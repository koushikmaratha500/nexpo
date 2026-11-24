import axios from 'axios';

/** Fetches an invoice PDF (base64 over the authed API) and saves it as `<invoiceNumber>.pdf`. */
export async function downloadInvoicePdf(id: string, invoiceNumber: string): Promise<void> {
  const res = await axios.get<{ base64: string }>(`/api/user/billing/invoices/${id}`);
  const bytes = Uint8Array.from(atob(res.data.base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
