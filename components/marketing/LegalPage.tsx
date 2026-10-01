import Link from 'next/link';
import type { Section } from './content';

const ARTICLE = 'ps:max-w-[68ch] ps:text-[17px] ps:leading-8 ps:text-ink/80';

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <div className="ps:mx-auto ps:grid ps:max-w-6xl ps:gap-12 ps:px-6 ps:py-12 ps:sm:py-20 ps:lg:grid-cols-[220px_1fr]">
      <aside className="ps:hidden ps:lg:block">
        <nav aria-label="On this page" className="ps:sticky ps:top-24 ps:flex ps:flex-col ps:gap-1 ps:border-l ps:border-ink/10 ps:text-sm">
          {sections.map((s, i) => (
            <a key={s.h} href={`#s${i}`} className="ps:-ml-px ps:border-l-2 ps:border-transparent ps:py-1.5 ps:pl-4 ps:text-ink/60 ps:hover:border-brand ps:hover:text-brand">
              {s.h}
            </a>
          ))}
        </nav>
      </aside>
      <article>
        <h1 className="ps:text-4xl ps:font-extrabold ps:tracking-tight ps:sm:text-5xl">{title}</h1>
        <p className={`${ARTICLE} ps:mt-4`}>{intro}</p>
        <p className="ps:mt-2 ps:text-sm ps:text-ink/50">Last updated 30 September 2026</p>
        {sections.map((s, i) => (
          <section key={s.h} id={`s${i}`} className="ps:mt-12 ps:scroll-mt-24">
            <h2 className="ps:text-2xl ps:font-bold">{s.h}</h2>
            {s.p.map((t) => <p key={t} className={`${ARTICLE} ps:mt-3`}>{t}</p>)}
          </section>
        ))}
        <p className="ps:mt-16 ps:text-sm ps:text-ink/60">
          Also read: <Link className="ps:underline" href="/terms-and-conditions">Terms &amp; Conditions</Link>,{' '}
          <Link className="ps:underline" href="/terms-of-use">Terms of Use</Link>,{' '}
          <Link className="ps:underline" href="/privacy-policy">Privacy Policy</Link>.
        </p>
      </article>
    </div>
  );
}

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="ps:divide-y ps:divide-ink/10 ps:border-y ps:border-ink/10">
      {items.map((f) => (
        <details key={f.q} className="ps:group ps:py-5">
          <summary className="ps:flex ps:cursor-pointer ps:list-none ps:items-center ps:justify-between ps:gap-6 ps:text-lg ps:font-semibold ps:focus-visible:outline-2 ps:focus-visible:outline-brand [&::-webkit-details-marker]:ps:hidden">
            {f.q}
            <span aria-hidden className="ps:grid ps:size-8 ps:shrink-0 ps:place-items-center ps:rounded-full ps:bg-brand-soft ps:text-brand ps:transition-transform ps:group-open:rotate-45">+</span>
          </summary>
          <p className="ps:mt-3 ps:max-w-[68ch] ps:leading-7 ps:text-ink/70">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
