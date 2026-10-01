import Link from 'next/link';
import { Hero, SplitDemo, Story, Donut, AiChat } from '@/components/marketing/Interactive';
import { Accordion } from '@/components/marketing/LegalPage';
import { FAQS } from '@/components/marketing/content';

const TICKER = ['Salary +₹1,20,000', 'Rent −₹25,000', 'Asha settled ₹600', 'Netflix −₹299', 'Fresh Mart −₹1,499.40', 'Reminder: Wi-Fi due', 'Freelance +₹25,000', 'Uber −₹340'];
const BENTO: [string, string, string][] = [
  ['Receipt scanning', 'Images and PDFs become filled-in forms. You confirm, never retype.', 'md:ps:col-span-2'],
  ['Recurring entries', 'Rent and subscriptions approve in one tap.', ''],
  ['CSV in, CSV out', 'Import history. Export reports and settlements.', ''],
  ['Notifications', 'In-app inbox, optional email and browser push. Your choice, per channel.', ''],
  ['Admin console', 'Users, categories, groups, support tickets and platform-wide notification policy.', 'md:ps:col-span-2'],
];
const STATS: [string, string][] = [['15 min', 'one-time codes expire'], ['5 tries', 'then the code locks'], ['10 MB', 'verified upload cap'], ['Read-only', 'AI sees, never edits']];

export default function Home() {
  return (
    <>
      <Hero>
        <div className="ps:relative ps:mx-auto ps:grid ps:max-w-6xl ps:items-center ps:gap-14 ps:px-6 ps:py-24 ps:lg:grid-cols-[1.1fr_1fr] ps:lg:py-32">
          <div>
            <h1 className="ps:text-5xl ps:font-extrabold ps:leading-[1.02] ps:tracking-tight ps:sm:text-7xl">
              Money is better <span className="ps:bg-gradient-to-r ps:from-violet-300 ps:to-gold ps:bg-clip-text ps:text-transparent">shared, split</span> and remembered.
            </h1>
            <p className="ps:mt-6 ps:max-w-[46ch] ps:text-xl ps:leading-8 ps:text-white/70">Track spending, split bills to the paisa, get reminded before dues, and ask an AI about your own numbers.</p>
            <div className="ps:mt-9 ps:flex ps:flex-wrap ps:gap-3">
              <Link href="/auth/register" className="ps:rounded-full ps:bg-white ps:px-7 ps:py-3.5 ps:font-semibold ps:text-brand-deep ps:transition ps:hover:scale-105">Start free for 7 days</Link>
              <Link href="#story" className="ps:rounded-full ps:px-7 ps:py-3.5 ps:font-semibold ps:ring-1 ps:ring-white/30 ps:transition ps:hover:bg-white/10">Watch it work</Link>
            </div>
            <p className="ps:mt-5 ps:text-sm ps:text-white/50">Web app live now. Mobile app in testing.</p>
          </div>
          <div className="ps:text-ink ps:lg:rotate-2 ps:transition ps:hover:rotate-0"><SplitDemo /></div>
        </div>
        <div aria-hidden className="ps:overflow-hidden ps:border-t ps:border-white/10 ps:py-4">
          <div className="ps:flex ps:w-max ps:gap-10 ps:text-white/60 ps:motion-safe:animate-marquee">
            {[...TICKER, ...TICKER].map((t, i) => <span key={i} className="ps:whitespace-nowrap ps:text-sm">◆ {t}</span>)}
          </div>
        </div>
      </Hero>

      <section id="story" className="ps:mx-auto ps:max-w-6xl ps:scroll-mt-16 ps:px-6 ps:py-24">
        <h2 className="ps:max-w-xl ps:text-4xl ps:font-extrabold ps:tracking-tight">From a crumpled receipt to a settled balance.</h2>
        <div className="ps:mt-8"><Story /></div>
      </section>

      <section className="ps:bg-brand-soft/70 ps:py-24">
        <div className="ps:mx-auto ps:max-w-6xl ps:px-6">
          <h2 className="ps:max-w-xl ps:text-4xl ps:font-extrabold ps:tracking-tight">See where it goes. Poke the chart.</h2>
          <p className="ps:mb-10 ps:mt-3 ps:text-ink/65">Reports filter by category and date, and export to CSV. Sample data shown.</p>
          <Donut />
        </div>
      </section>

      <section className="ps:mx-auto ps:max-w-6xl ps:px-6 ps:py-24">
        <h2 className="ps:mb-10 ps:text-4xl ps:font-extrabold ps:tracking-tight">Everything else, already in the box.</h2>
        <div className="ps:grid ps:gap-4 ps:md:grid-cols-4">
          {BENTO.map(([t, d, span]) => (
            <div key={t} className={`ps:group ps:rounded-3xl ps:bg-white ps:p-7 ps:ring-1 ps:ring-ink/5 ps:transition ps:hover:-translate-y-1 ps:hover:shadow-xl ps:hover:shadow-brand/15 ${span.replace('md:ps:', 'ps:md:')}`}>
              <p className="ps:text-xl ps:font-bold ps:transition ps:group-hover:text-brand">{t}</p>
              <p className="ps:mt-2 ps:leading-7 ps:text-ink/65">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ai" className="ps:scroll-mt-16 ps:bg-ink ps:py-24 ps:text-white">
        <div className="ps:mx-auto ps:grid ps:max-w-6xl ps:items-center ps:gap-14 ps:px-6 ps:lg:grid-cols-2">
          <div>
            <h2 className="ps:text-4xl ps:font-extrabold ps:tracking-tight">Ask your money a question.</h2>
            <p className="ps:mt-5 ps:max-w-[48ch] ps:text-lg ps:leading-8 ps:text-white/70">Summaries, forecasts and forgotten subscriptions, answered from real figures. Insight cards on your dashboard speak up before you ask.</p>
          </div>
          <AiChat />
        </div>
      </section>

      <section id="security" className="ps:mx-auto ps:max-w-6xl ps:scroll-mt-16 ps:px-6 ps:py-24">
        <h2 className="ps:max-w-xl ps:text-4xl ps:font-extrabold ps:tracking-tight">Built like it holds your finances.</h2>
        <div className="ps:mt-10 ps:grid ps:gap-8 ps:sm:grid-cols-2 ps:lg:grid-cols-4">
          {STATS.map(([n, d]) => <div key={n} className="ps:border-t-2 ps:border-brand ps:pt-4"><p className="ps:text-4xl ps:font-extrabold">{n}</p><p className="ps:mt-1 ps:text-ink/65">{d}</p></div>)}
        </div>
        <p className="ps:mt-8 ps:max-w-[60ch] ps:text-ink/65">Sessions are checked server-side, sign-in and writes are rate limited, and every AI call is scoped to you.</p>
      </section>

      <section className="ps:mx-auto ps:max-w-3xl ps:px-6 ps:pb-24">
        <h2 className="ps:mb-8 ps:text-3xl ps:font-extrabold ps:tracking-tight">Questions</h2>
        <Accordion items={FAQS.slice(0, 5)} />
        <Link href="/faq" className="ps:mt-6 ps:inline-block ps:font-semibold ps:text-brand ps:hover:underline">Read all FAQs</Link>
      </section>

      <section className="ps:px-6 ps:pb-24">
        <div className="ps:mx-auto ps:max-w-6xl ps:rounded-[2rem] ps:bg-gradient-to-br ps:from-brand ps:to-brand-deep ps:px-8 ps:py-20 ps:text-center ps:text-white">
          <h2 className="ps:text-4xl ps:font-extrabold ps:tracking-tight ps:sm:text-6xl">Split the next bill here.</h2>
          <Link href="/auth/register" className="ps:mt-8 ps:inline-block ps:rounded-full ps:bg-white ps:px-8 ps:py-3.5 ps:font-semibold ps:text-brand-deep ps:transition ps:hover:scale-105">Create your account</Link>
        </div>
      </section>
    </>
  );
}
