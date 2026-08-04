'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';
import axios from 'axios';

interface CountryOption {
  id: string;
  name: string;
  isoCode: string;
  currencyId?: string;
}

interface CurrencyOption {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

export default function CustomerSettingsPage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryId, setCountryId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [avatar, setAvatar] = useState('');

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const metadataFetchedRef = useRef(false);

  // Bind values from auth context once user loads (adjust-state-during-render guard)
  const [boundUserKey, setBoundUserKey] = useState<string | null>(user?.email ?? null);
  if (user && user.email !== boundUserKey) {
    setBoundUserKey(user.email);
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setEmail(user.email || '');
    setMobile(user.mobile || '');
    setCountryId(user.countryId || '');
    setCurrencyId(user.currencyId || '');
    setAvatar(user.avatar || '');
  }

  // Load countries & currencies on mount
  useEffect(() => {
    if (metadataFetchedRef.current) return;
    metadataFetchedRef.current = true;
    async function loadMetadata() {
      try {
        const res = await axios.get('/api/user/metadata');
        setCountries(res.data.countries || []);
        setCurrencies(res.data.currencies || []);
      } catch (err) {
        console.error('Failed to load country/currency metadata:', err);
        metadataFetchedRef.current = false;
      }
    }
    loadMetadata();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      addToast('Uploading profile image...', 'info');

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'nexpo');

        const res = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setAvatar(res.data.url);
        addToast('Profile image uploaded successfully!', 'success');
      } catch (err: unknown) {
        console.warn('Failed to upload avatar to backend:', err);
        addToast('Failed to upload image.', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        firstName,
        lastName: lastName || null,
        profileImageUrl: avatar || null,
        countryId: countryId || null,
        currencyId: currencyId || null,
      };

      const response = await axios.patch('/api/user/auth/profile', payload);

      if (response.data) {
        // Sync context state
        updateUser({
          firstName,
          lastName,
          avatar,
          countryId,
          currencyId,
        });
        addToast('Profile details updated successfully!', 'success');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = e.response?.data?.error || e.message || 'Failed to update profile';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length <= 6) {
      addToast('Error: Password must be more than 6 characters long.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.patch('/api/user/auth/profile', {
        oldPassword,
        newPassword,
      });
      addToast('Security credentials updated successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = e.response?.data?.error || e.message || 'Failed to update password';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Details Form */}
        <div className="lg:col-span-8">
          <Card className="bg-surface-container-lowest" glass={false}>
            <form onSubmit={handleUpdate} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-lg border-b border-outline-variant/30 pb-lg">
                <div className="relative group w-20 h-20 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant flex-shrink-0 cursor-pointer">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="Profile Avatar"
                      fill
                      unoptimized
                      sizes="80px"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xl">
                      {firstName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity">
                    <span className="material-symbols-outlined text-md">photo_camera</span>
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={isUploading} />
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
                    disabled
                    value={mobile || 'No Mobile Linked'}
                    className="px-4 py-2 bg-surface-container-low/50 border border-outline-variant rounded-lg text-body-md text-on-surface-variant/80 w-full cursor-not-allowed font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Country</label>
                  <div className="relative">
                    <select
                      value={countryId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setCountryId(selectedId);
                        // Auto-select the linked currency of this country
                        const matchedCountry = countries.find(c => c.id === selectedId);
                        if (matchedCountry?.currencyId) {
                          setCurrencyId(matchedCountry.currencyId);
                        }
                      }}
                      className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full appearance-none font-bold"
                    >
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.isoCode})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Preferred Currency</label>
                  <div className="relative">
                    <select
                      value={currencyId}
                      onChange={(e) => setCurrencyId(e.target.value)}
                      className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full appearance-none font-bold"
                    >
                      <option value="">Select Currency</option>
                      {currencies.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.code} ({curr.symbol}) - {curr.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-outline-variant/30 pt-4 mt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-40 flex items-center justify-center gap-2" 
                  disabled={isSubmitting || isUploading}
                >
                  {(isSubmitting || isUploading) && (
                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Saving...' : isUploading ? 'Uploading...' : 'Save Changes'}</span>
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

              <Button 
                type="submit" 
                variant="secondary" 
                className="w-full mt-2 flex items-center justify-center gap-2" 
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>

    </div>
  );
}
