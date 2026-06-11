'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthContext';

export default function CustomerSettingsPage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || 'Alex');
  const [lastName, setLastName] = useState(user?.lastName || 'Sterling');
  const [email, setEmail] = useState(user?.email || 'user@nexpo.com');
  const [mobile, setMobile] = useState('+91 98765 43210');
  const [currency, setCurrency] = useState('INR');
  const [country, setCountry] = useState('India');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://lh3.googleusercontent.com/aida/AP1WRLskcaT4zEfnc7-RMLGT2ABk-1Fbp2KitI5pDZki9-GZaeRr50garGxd9qaW8lE4QqbGZBSKlEnnlpKhCn3b9GtKcih-2g0MiOrgzmktdJ-3stdf2jb4rfQCAHbODMYI6dpTE4dQLPK_wh_jCbDC1PtehwjtZFZVI7JPuNXTK51Xc_eRfXbYrAHCyiae8NGgN2DjoGX5_99GXUJrrjv0iip0VS7zvTzEYDGZbw4PFoFbj0lACVh3kewYzNY');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAvatar(URL.createObjectURL(files[0]));
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updatedUser = {
        ...user,
        firstName,
        lastName,
        avatar
      };
      localStorage.setItem('nexpo_user', JSON.stringify(updatedUser));
    }
    setToastMsg('Profile details updated successfully!');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length <= 6) {
      setToastMsg('Error: Password must be more than 6 characters long.');
    } else {
      setToastMsg('Security credentials updated successfully!');
      setOldPassword('');
      setNewPassword('');
    }
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Profile Settings</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Update your credentials, profile details, and avatars.</p>
        </div>
      </div>

      {toastMsg && (
        <div className={`p-4 border rounded-lg text-body-md font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 ${
          toastMsg.startsWith('Error') 
            ? 'bg-error-container/20 border-error/20 text-error' 
            : 'bg-secondary-container/20 border-secondary/20 text-on-secondary-container'
        }`}>
          <span className="material-symbols-outlined text-md">
            {toastMsg.startsWith('Error') ? 'error' : 'done'}
          </span>
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Details Form */}
        <div className="lg:col-span-8">
          <Card className="bg-surface-container-lowest" glass={false}>
            <form onSubmit={handleUpdate} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-lg border-b border-outline-variant/30 pb-lg">
                <div className="relative group w-20 h-20 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant flex-shrink-0 cursor-pointer">
                  <img src={avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity">
                    <span className="material-symbols-outlined text-md">photo_camera</span>
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-title-md text-title-md font-bold text-primary">Workspace Profile</h3>
                  <p className="font-label-md text-label-md text-on-surface-variant mt-1">Submit alterations to your corporate profile identity.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface font-bold uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled
                    value={email}
                    className="px-4 py-2 bg-surface-container-low/50 border border-outline-variant rounded-lg text-body-md text-on-surface-variant/80 w-full cursor-not-allowed font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Preferred Currency</label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full appearance-none font-bold"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Country</label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full appearance-none font-bold"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Canada">Canada</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-outline-variant/30 pt-4 mt-2">
                <Button type="submit" variant="primary" className="w-36">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Security Password Update Form */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-surface-container-lowest" glass={false}>
            <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
              <div>
                <h3 className="font-title-md text-title-md font-bold text-primary">Security Settings</h3>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">Keep your account authentication secure.</p>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface font-bold uppercase">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full"
                />
              </div>

              <Button type="submit" variant="secondary" className="w-full mt-2">
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>

    </div>
  );
}
