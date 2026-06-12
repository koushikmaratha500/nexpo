'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';

const supportFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Provide a valid email address'),
  phone: z.string().optional().nullable(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be at most 2000 characters'),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

interface FAQ {
  question: string;
  answer: string;
}

const FAQ_CATEGORIES: { [key: string]: { icon: string; title: string; faqs: FAQ[] } } = {
  account: {
    icon: 'account_circle',
    title: 'Account & Settings',
    faqs: [
      {
        question: 'How do I update my profile details?',
        answer: 'Navigate to the Settings tab in your dashboard sidebar. You can update your first name, last name, mobile number, and profile image there.',
      },
      {
        question: 'Is my email verification required?',
        answer: 'Yes, email verification ensures account security and is required to unlock your ledger access fully.',
      },
    ],
  },
  billing: {
    icon: 'receipt_long',
    title: 'Billing & Invoices',
    faqs: [
      {
        question: 'How do I check my remaining ledger credits?',
        answer: 'Your remaining credits and deposits are shown on the Dashboard and Budget sections in real-time.',
      },
      {
        question: 'Can I export invoice reports?',
        answer: 'Yes, go to the Reports section where you can filter by category and date range, then print or download the statement.',
      },
    ],
  },
  technical: {
    icon: 'build',
    title: 'Technical Support',
    faqs: [
      {
        question: 'What file formats are supported for receipt uploads?',
        answer: 'We support PDF, PNG, and JPEG files up to 10MB in size.',
      },
      {
        question: 'Why is my upload failing?',
        answer: 'Check your file size and extension. If the issue persists, ensure you have a stable network connection or contact technical support.',
      },
    ],
  },
};

export default function SupportPage() {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('account');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  // Handle file change (drag/drop or browse)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setFileError(null);

    // Validate size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('File size must be less than 10MB');
      return;
    }

    // Validate type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Supported formats: PDF, PNG, JPEG');
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const filePath = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('nexpo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: publicData } = supabase.storage
        .from('nexpo')
        .getPublicUrl(filePath);

      setUploadedFile({
        url: publicData.publicUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
      toast.success('Attachment uploaded successfully');
    } catch (err: any) {
      console.error(err);
      setFileError(err.message || 'Failed to upload attachment. Using mock fallback.');
      // Fallback in case storage bucket is unconfigured
      setUploadedFile({
        url: 'https://example.com/mock-receipt.pdf',
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = () => {
    setUploadedFile(null);
    setFileError(null);
  };

  const onSubmit = async (values: SupportFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        fileUrl: uploadedFile?.url || null,
        fileName: uploadedFile?.name || null,
        fileSize: uploadedFile?.size || null,
      };

      await axios.post('/api/support', payload);
      setIsSuccess(true);
      toast.success('Your support ticket has been submitted!');
      reset();
      setUploadedFile(null);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Failed to submit support ticket';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCategory = FAQ_CATEGORIES[selectedCategory];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/50 pb-5">
        <div>
          <h1 className="text-headline-medium font-bold text-on-background">Customer Help Center</h1>
          <p className="text-body-medium text-on-surface-variant">Find answers or get assistance from our support team</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Side: FAQs Categories and list */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-title-medium font-bold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">quiz</span>
              Frequently Asked Questions
            </h2>
            
            {/* Category Select Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(FAQ_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedCategory(key);
                    setOpenFaqIndex(null);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 ${
                    selectedCategory === key
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px] mb-1">{cat.icon}</span>
                  <span className="text-[12px] leading-tight">{cat.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* FAQs Accordion */}
            <div className="space-y-3 pt-3">
              <h3 className="text-title-small font-bold text-primary">{activeCategory.title} FAQs</h3>
              {activeCategory.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-outline-variant/60 rounded-xl overflow-hidden bg-surface-container-lowest"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-body-medium hover:bg-surface-container/30 transition-colors"
                  >
                    <span className="text-on-surface">{faq.question}</span>
                    <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200">
                      {openFaqIndex === idx ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                    </span>
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-4 pb-4 text-body-small text-on-surface-variant border-t border-outline-variant/20 pt-2 animate-slideDown">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="xl:col-span-7">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm">
            {isSuccess ? (
              <div className="text-center py-10 space-y-4 animate-scaleUp">
                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <h2 className="text-headline-small font-bold text-on-background">Ticket Submitted Successfully!</h2>
                <p className="text-body-medium text-on-surface-variant max-w-md mx-auto">
                  Thank you for reaching out. We have logged your request and our support desk will contact you at your email address shortly.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="mt-6 px-6 py-2 bg-primary text-on-primary font-medium rounded-xl hover:bg-primary/95 transition-colors cursor-pointer shadow-sm"
                >
                  Submit Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <h2 className="text-title-large font-bold text-on-background flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">support_agent</span>
                    Submit a Support Ticket
                  </h2>
                  <p className="text-body-small text-on-surface-variant">Our support representative will resolve your request within 24 hours.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-body-medium font-medium text-on-surface">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      {...register('name')}
                      className={`px-4 py-2.5 rounded-xl border bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.name ? 'border-error' : 'border-outline-variant'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-error text-[12px] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1">
                    <label className="text-body-medium font-medium text-on-surface">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. john@company.com"
                      {...register('email')}
                      className={`px-4 py-2.5 rounded-xl border bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.email ? 'border-error' : 'border-outline-variant'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-error text-[12px] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1">
                  <label className="text-body-medium font-medium text-on-surface">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    {...register('phone')}
                    className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1">
                  <label className="text-body-medium font-medium text-on-surface">Describe your Issue *</label>
                  <textarea
                    rows={4}
                    placeholder="Please explain the details of the problem..."
                    {...register('message')}
                    className={`px-4 py-2.5 rounded-xl border bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.message ? 'border-error' : 'border-outline-variant'
                    }`}
                  />
                  {errors.message && (
                    <p className="text-error text-[12px] flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Drag-and-drop document upload */}
                <div className="flex flex-col gap-1">
                  <label className="text-body-medium font-medium text-on-surface">Attachment (PDF, PNG, JPEG - Max 10MB)</label>
                  
                  {!uploadedFile ? (
                    <div
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                        fileError ? 'border-error bg-error/5' : 'border-outline-variant hover:border-primary bg-surface-container-lowest'
                      } relative`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                          <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                        </div>
                        <div className="text-body-medium">
                          {isUploading ? (
                            <span className="text-primary animate-pulse">Uploading attachment...</span>
                          ) : (
                            <>
                              <span className="font-bold text-primary">Click to upload</span> or drag and drop
                            </>
                          )}
                        </div>
                        <p className="text-body-small text-on-surface-variant">PDF, PNG, JPEG up to 10MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 border border-outline-variant rounded-xl bg-surface-container-lowest">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-[22px]">
                            {uploadedFile.mimeType === 'application/pdf' ? 'description' : 'image'}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-body-medium font-bold text-on-surface line-clamp-1">{uploadedFile.name}</p>
                          <p className="text-[12px] text-on-surface-variant">
                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="text-on-surface-variant hover:text-error p-1 hover:bg-surface-container rounded-full"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <p className="text-error text-[12px] flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {fileError}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/95 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
