import { redirect } from 'next/navigation';

export default function CreditRedirectPage() {
  redirect('/customer/transactions');
}
