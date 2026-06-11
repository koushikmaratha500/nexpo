export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  avatar?: string;
  lastLogin?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string; // e.g. FOOD, RENT, TRAVEL, UTILITIES, SOFTWARE, MARKETING
  color: string; // Tailwind color class or hex
  icon: string;
}

export interface Expense {
  id: string;
  merchant: string;
  description: string;
  category: string; // Category code
  date: string;
  status: 'VERIFIED' | 'PENDING' | 'DECLINED';
  amount: number;
  submittedBy: string; // User name
  paymentType: string; // e.g. Credit Card, Debit Card, Cash, Bank Transfer
  currency: string; // e.g. USD, EUR, GBP, JPY
  notes?: string;
  receiptName?: string;
  receiptSize?: string;
  receiptDate?: string;
  receiptUrl?: string;
}

export interface Log {
  id: string;
  user: string;
  avatarInitials: string;
  action: string;
  entity: string;
  timestamp: string;
  avatarBg: string;
}

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    firstName: 'Alex',
    lastName: 'Sterling',
    email: 'user@nexpo.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    avatar: 'https://lh3.googleusercontent.com/aida/AP1WRLskcaT4zEfnc7-RMLGT2ABk-1Fbp2KitI5pDZki9-GZaeRr50garGxd9qaW8lE4QqbGZBSKlEnnlpKhCn3b9GtKcih-2g0MiOrgzmktdJ-3stdf2jb4rfQCAHbODMYI6dpTE4dQLPK_wh_jCbDC1PtehwjtZFZVI7JPuNXTK51Xc_eRfXbYrAHCyiae8NGgN2DjoGX5_99GXUJrrjv0iip0VS7zvTzEYDGZbw4PFoFbj0lACVh3kewYzNY',
    lastLogin: 'Today, 10:15 AM'
  },
  {
    id: 'u2',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'admin@nexpo.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatar: 'https://lh3.googleusercontent.com/aida/AP1WRLs_EWPFXxgj4xBIHeCjXIwKXlyPLAKFsz1tlB9umS6nGNHDNVshLbnAZC7A-L8SPnqGBATylspVEDHpOUOpAumei-6E2EUgBVwnlCHNg52ulME4ku7tdrKKDORVDhG2HzvDvJorrFWgPV_6HBWgO67jfNitI1tzJiLch9hASDF9vURAQ3MEBYSyC63jd9C2nkdjWDLocW3Esu6bI-iYPpUg9ZnmtMRHwaOiCNYjeJhguTYHHRqfqc60PJww',
    lastLogin: 'Today, 11:24 AM'
  },
  {
    id: 'u3',
    firstName: 'Marcus',
    lastName: 'Smith',
    email: 'marcus@nexpo.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    lastLogin: 'Yesterday, 04:52 PM'
  },
  {
    id: 'u4',
    firstName: 'Alex',
    lastName: 'Kim',
    email: 'alex.k@nexpo.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    lastLogin: 'Yesterday, 02:15 PM'
  },
  {
    id: 'u5',
    firstName: 'Lisa',
    lastName: 'Vance',
    email: 'lisa_vanc@nexpo.com',
    role: 'CUSTOMER',
    status: 'PENDING',
    lastLogin: 'Oct 17, 2023, 09:30 AM'
  },
  {
    id: 'u6',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah@nexpo.com',
    role: 'CUSTOMER',
    status: 'BLOCKED',
    lastLogin: 'Oct 15, 2023, 11:10 AM'
  },
  {
    id: 'u7',
    firstName: 'David',
    lastName: 'Miller',
    email: 'david.m@nexpo.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    lastLogin: 'Oct 12, 2023, 03:45 PM'
  }
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Food', code: 'FOOD', color: 'bg-secondary-container text-on-secondary-container', icon: 'restaurant' },
  { id: 'c2', name: 'Rent', code: 'RENT', color: 'bg-primary-fixed text-on-primary-fixed-variant', icon: 'home_work' },
  { id: 'c3', name: 'Travel', code: 'TRAVEL', color: 'bg-outline-variant/30 text-on-surface-variant', icon: 'flight' },
  { id: 'c4', name: 'Utilities', code: 'UTILITIES', color: 'bg-surface-variant text-on-surface-variant', icon: 'bolt' },
  { id: 'c5', name: 'Software', code: 'SOFTWARE', color: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', icon: 'code' },
  { id: 'c6', name: 'Marketing', code: 'MARKETING', color: 'bg-error-container text-on-error-container', icon: 'campaign' }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1',
    merchant: 'Artisan Bistro',
    description: 'Client Lunch - Tech Project',
    category: 'FOOD',
    date: 'Oct 24, 2023',
    status: 'VERIFIED',
    amount: 145.20,
    submittedBy: 'Alex Sterling',
    paymentType: 'Credit Card',
    currency: 'INR',
    notes: 'Client Lunch with Strategic Partner to discuss Q4 integration plans.',
    receiptName: 'receipt_24102023_bistro.pdf',
    receiptSize: '1.2 MB',
    receiptDate: 'Oct 24',
    receiptUrl: '/basic-text.pdf'
  },
  {
    id: 'e2',
    merchant: 'Delta Airlines',
    description: 'Conference Flight - SFO',
    category: 'TRAVEL',
    date: 'Oct 22, 2023',
    status: 'VERIFIED',
    amount: 840.00,
    submittedBy: 'Alex Sterling',
    paymentType: 'Credit Card',
    currency: 'INR',
    notes: 'Q4 Sales conference flight to SFO. Includes priority boarding and baggage fees.',
    receiptName: 'receipt_22102023_delta.pdf',
    receiptSize: '2.4 MB',
    receiptDate: 'Oct 22',
    receiptUrl: '/basic-text.pdf'
  },
  {
    id: 'e3',
    merchant: 'WeWork Central',
    description: 'Monthly Desk Subscription',
    category: 'RENT',
    date: 'Oct 20, 2023',
    status: 'PENDING',
    amount: 1200.00,
    submittedBy: 'Marcus Smith',
    paymentType: 'Bank Transfer',
    currency: 'EUR'
  },
  {
    id: 'e4',
    merchant: 'AWS Cloud Services',
    description: 'Staging Infrastructure Billing',
    category: 'SOFTWARE',
    date: 'Oct 18, 2023',
    status: 'VERIFIED',
    amount: 4532.10,
    submittedBy: 'Alex Kim',
    paymentType: 'Bank Transfer',
    currency: 'INR'
  },
  {
    id: 'e5',
    merchant: 'Adobe Creative Cloud',
    description: 'Design Team Subscription',
    category: 'SOFTWARE',
    date: 'Oct 17, 2023',
    status: 'VERIFIED',
    amount: 79.99,
    submittedBy: 'Lisa Vance',
    paymentType: 'Credit Card',
    currency: 'EUR'
  },
  {
    id: 'e6',
    merchant: 'Facebook Ads',
    description: 'Q4 Product Launch Campaign',
    category: 'MARKETING',
    date: 'Oct 15, 2023',
    status: 'PENDING',
    amount: 2500.00,
    submittedBy: 'Lisa Vance',
    paymentType: 'Debit Card',
    currency: 'INR'
  },
  {
    id: 'e7',
    merchant: 'Tokyo Inn & Suites',
    description: 'APAC Sales Summit Lodging',
    category: 'TRAVEL',
    date: 'Oct 12, 2023',
    status: 'DECLINED',
    amount: 1150.00,
    submittedBy: 'Marcus Smith',
    paymentType: 'Credit Card',
    currency: 'JPY'
  },
  {
    id: 'e8',
    merchant: 'Office Depot',
    description: 'Team Whiteboards & Markers',
    category: 'UTILITIES',
    date: 'Oct 10, 2023',
    status: 'VERIFIED',
    amount: 85.50,
    submittedBy: 'Alex Kim',
    paymentType: 'Cash',
    currency: 'INR'
  },
  {
    id: 'e9',
    merchant: 'Slack Technologies',
    description: 'Yearly Slack Upgrade',
    category: 'SOFTWARE',
    date: 'Oct 05, 2023',
    status: 'VERIFIED',
    amount: 3400.00,
    submittedBy: 'Alex Sterling',
    paymentType: 'Bank Transfer',
    currency: 'EUR'
  },
  {
    id: 'e10',
    merchant: 'Uber Business',
    description: 'Local Client Transfers',
    category: 'TRAVEL',
    date: 'Oct 02, 2023',
    status: 'VERIFIED',
    amount: 42.80,
    submittedBy: 'Marcus Smith',
    paymentType: 'Debit Card',
    currency: 'INR'
  }
];

export const MOCK_ACTIVITY_LOGS: Log[] = [
  {
    id: 'l1',
    user: 'Jane Doe',
    avatarInitials: 'JD',
    action: 'Approved Batch',
    entity: 'Q2 Marketing Expenses',
    timestamp: 'Today, 11:24 AM',
    avatarBg: 'bg-primary-fixed text-on-primary-fixed'
  },
  {
    id: 'l2',
    user: 'Marcus Smith',
    avatarInitials: 'MS',
    action: 'Modified Role',
    entity: 'User: @lisa_vanc',
    timestamp: 'Yesterday, 04:52 PM',
    avatarBg: 'bg-surface-variant text-on-surface-variant'
  },
  {
    id: 'l3',
    user: 'Alex Kim',
    avatarInitials: 'AK',
    action: 'Revoked Access',
    entity: 'API Endpoint: /v1/global',
    timestamp: 'Yesterday, 09:12 AM',
    avatarBg: 'bg-tertiary-fixed text-on-tertiary-fixed'
  }
];

export const MOCK_MONTHLY_GROWTH = [
  { month: 'Jan', value: 320 },
  { month: 'Feb', value: 480 },
  { month: 'Mar', value: 650 },
  { month: 'Apr', value: 590 },
  { month: 'May', value: 890 },
  { month: 'Jun', value: 1240 }
];

export const MOCK_SPEND_DISTRIBUTION = [
  { region: 'North America', amount: 210400, percentage: 65, color: 'bg-on-secondary-container' },
  { region: 'Europe', amount: 142100, percentage: 45, color: 'bg-primary-fixed dim' },
  { region: 'Asia Pacific', amount: 97700, percentage: 30, color: 'bg-inverse-primary' }
];

export const MOCK_CATEGORY_BREAKDOWN = [
  { name: 'Rent', percentage: 45, amount: 5602.50, color: 'bg-on-secondary-container' },
  { name: 'Food', percentage: 20, amount: 2490.00, color: 'bg-primary-fixed-dim' },
  { name: 'Travel', percentage: 20, amount: 2490.00, color: 'bg-outline' },
  { name: 'Utilities1', percentage: 15, amount: 1867.50, color: 'bg-surface-variant' },
  { name: 'Utilities2', percentage: 15, amount: 1867.50, color: 'bg-surface-variant' },
  { name: 'Utilities3', percentage: 15, amount: 1867.50, color: 'bg-surface-variant' },
  { name: 'Utilities4', percentage: 15, amount: 1867.50, color: 'bg-surface-variant' },
  { name: 'Utilities5', percentage: 15, amount: 1867.50, color: 'bg-surface-variant' },
  { name: 'Utilities6', percentage: 15, amount: 1867.50, color: 'bg-surface-variant' }
];
