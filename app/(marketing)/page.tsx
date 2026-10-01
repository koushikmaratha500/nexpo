import Link from 'next/link';
import { SplitDemo, FeatureTabs } from '@/components/marketing/Interactive';
import { Accordion } from '@/components/marketing/LegalPage';
import { FAQS } from '@/components/marketing/content';

const MORE = [
  ['Receipt scanning', 'Upload an image or PDF and AI fills in amount, date, merchant and category for you to confirm.'],
  ['Recurring entries', 'Rent, subscriptions and salary approve in one tap when they come due.'],
  ['CSV import and export', 'Bring history in, take reports and settlements out.'],
  ['Notifications', 'In-app inbox, optional email and browser push, each switchable by you.'],
  ['Multi-currency', 'Pick your country and currency; receipts in other currencies are recognised.'],
  ['Help Center', 'FAQs and support tickets with status updates, inside the app.'],
];
const SAFE = [
  ['Server-checked sessions', 'Signed tokens are validated against the database, and password changes sign out old sessions.'],
  ['Rate limits everywhere it matters', 'Sign-in, one-time codes, writes, invites and AI requests are throttled.'],
  ['Verified uploads', 'Files are checked by type and size before they are stored.'],
  ['Short-lived codes', 'Email codes are random, expire in 15 minutes and lock after five wrong tries.'],
];

export default function Home() {
  return (
    <>
      <section className="ps:relative ps:overflow-hidden">
        <div aria-hidden className="ps:pointer-events-none ps:absolute ps:-right-32 ps:-top-32 ps:size-[520px] ps:rounded-full ps:bg-brand/15 ps:blur-3xl ps:motion-safe:animate-drift" />
        <div className="ps:relative ps:mx-auto ps:grid ps:max-w-6xl ps:items-center ps:gap-14 ps:px-6 ps:py-20 ps:lg:grid-cols-[1.1fr_1fr] ps:lg:py-28">
          <div>
            <h1 className="ps:text-5xl ps:font-extrabold ps:leading-[1.05] ps:tracking-tight ps:sm:text-6xl">
              Your money, and the people you share it with.
            </h1>
            <p className="ps:mt-6 ps:max-w-[46ch] ps:text-xl ps:leading-8 ps:text-ink/70">
              Track spending, split group bills to the paisa, get reminded before dues, and ask an AI about your own numbers.
            </p>
            <div className="ps:mt-9 ps:flex ps:flex-wrap ps:gap-3">
              <Link href="/auth/register" className="ps:rounded-full ps:bg-brand ps:px-7 ps:py-3.5 ps:font-semibold ps:text-white ps:shadow-lg ps:shadow-brand/30 ps:transition ps:hover:bg-brand-deep">Start free for 7 days</Link>
              <Link href="#features" className="ps:rounded-full ps:px-7 ps:py-3.5 ps:font-semibold ps:ring-1 ps:ring-ink/15 ps:transition ps:hover:ring-brand ps:hover:text-brand">See what it does</Link>
            </div>
            <p className="ps:mt-5 ps:text-sm ps:text-ink/55">Web app live now. Mobile app in testing.</p>
          </div>
          <SplitDemo />
        </div>
      </section>

      <section id="features" className="ps:scroll-mt-16 ps:bg-brand-soft/60 ps:py-24">
        <div className="ps:mx-auto ps:max-w-6xl ps:px-6">
          <h2 className="ps:mb-10 ps:max-w-2xl ps:text-4xl ps:font-extrabold ps:tracking-tight">One app for your wallet, your group chat dues and your admin.</h2>
          <FeatureTabs />
        </div>
      </section>

      <section className="ps:mx-auto ps:max-w-6xl ps:px-6 ps:py-24">
        <h2 className="ps:text-3xl ps:font-extrabold ps:tracking-tight">And the details you would have asked about</h2>
        <dl className="ps:mt-10 ps:grid ps:gap-x-14 ps:md:grid-cols-2">
          {MORE.map(([t, d]) => (
            <div key={t} className="ps:border-t ps:border-ink/10 ps:py-6">
              <dt className="ps:text-lg ps:font-bold">{t}</dt>
              <dd className="ps:mt-1 ps:max-w-[48ch] ps:leading-7 ps:text-ink/65">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="ai" className="ps:scroll-mt-16 ps:bg-ink ps:py-24 ps:text-white">
        <div className="ps:mx-auto ps:grid ps:max-w-6xl ps:items-center ps:gap-14 ps:px-6 ps:lg:grid-cols-2">
          <div>
            <h2 className="ps:text-4xl ps:font-extrabold ps:tracking-tight">Ask your money a question.</h2>
            <p className="ps:mt-5 ps:max-w-[50ch] ps:text-lg ps:leading-8 ps:text-white/70">
              The assistant reads your transactions, never changes them, and answers only from real figures: monthly summaries, cash-flow forecasts, subscriptions you may have forgotten. Insight cards on your dashboard surface changes before you ask.
            </p>
          </div>
          <div className="ps:space-y-3 ps:rounded-3xl ps:bg-white/5 ps:p-6 ps:ring-1 ps:ring-white/10" aria-label="Example conversation">
            <p className="ps:ml-auto ps:w-fit ps:max-w-[85%] ps:rounded-2xl ps:bg-brand ps:px-4 ps:py-3">How much did I spend on groceries last month?</p>
            <p className="ps:w-fit ps:max-w-[90%] ps:rounded-2xl ps:bg-white/10 ps:px-4 ps:py-3 ps:leading-7">You spent ₹2,950 on Groceries in July, mostly at Fresh Mart. That is the biggest category after Rent.</p>
            <p className="ps:w-fit ps:max-w-[90%] ps:rounded-2xl ps:bg-white/10 ps:px-4 ps:py-3 ps:leading-7">Netflix and Spotify have billed you every month since May. Want a list of recurring charges?</p>
            <p className="ps:pt-2 ps:text-xs ps:text-white/45">Illustrative example. Not professional financial advice.</p>
          </div>
        </div>
      </section>

      <section id="security" className="ps:mx-auto ps:max-w-6xl ps:scroll-mt-16 ps:px-6 ps:py-24">
        <h2 className="ps:max-w-2xl ps:text-4xl ps:font-extrabold ps:tracking-tight">Built like it holds your finances, because it does.</h2>
        <ul className="ps:mt-10 ps:grid ps:gap-x-14 ps:md:grid-cols-2">
          {SAFE.map(([t, d]) => (
            <li key={t} className="ps:border-t ps:border-ink/10 ps:py-6">
              <p className="ps:text-lg ps:font-bold">{t}</p>
              <p className="ps:mt-1 ps:max-w-[48ch] ps:leading-7 ps:text-ink/65">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="ps:mx-auto ps:max-w-3xl ps:px-6 ps:pb-24">
        <h2 className="ps:mb-8 ps:text-3xl ps:font-extrabold ps:tracking-tight">Questions</h2>
        <Accordion items={FAQS.slice(0, 5)} />
        <Link href="/faq" className="ps:mt-6 ps:inline-block ps:font-semibold ps:text-brand ps:hover:underline">Read all FAQs</Link>
      </section>

      <section className="ps:px-6 ps:pb-24">
        <div className="ps:mx-auto ps:max-w-6xl ps:rounded-[2rem] ps:bg-gradient-to-br ps:from-brand ps:to-brand-deep ps:px-8 ps:py-16 ps:text-center ps:text-white">
          <h2 className="ps:text-4xl ps:font-extrabold ps:tracking-tight">Start with the next bill you split.</h2>
          <p className="ps:mx-auto ps:mt-4 ps:max-w-md ps:text-white/80">Create an account, add a group and see who owes what in a minute.</p>
          <Link href="/auth/register" className="ps:mt-8 ps:inline-block ps:rounded-full ps:bg-white ps:px-8 ps:py-3.5 ps:font-semibold ps:text-brand-deep ps:transition ps:hover:bg-brand-soft">Create your account</Link>
        </div>
      </section>
    </>
  );
}
