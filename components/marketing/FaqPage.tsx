import { FAQS } from '@/components/marketing/content';
import { Accordion } from '@/components/marketing/LegalPage';

export function MarketingFaqPage() {
  return (
    <div className="ps:mx-auto ps:max-w-3xl ps:px-6 ps:py-20">
      <h1 className="ps:text-4xl ps:font-extrabold ps:tracking-tight ps:sm:text-5xl">Frequently asked questions</h1>
      <p className="ps:mb-10 ps:mt-4 ps:text-lg ps:text-ink/70">Can&apos;t find your answer? Submit a ticket from the Help Center in the app.</p>
      <Accordion items={FAQS} />
    </div>
  );
}
