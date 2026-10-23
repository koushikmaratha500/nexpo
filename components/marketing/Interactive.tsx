'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { FREEMIUM_LIMITS, PLAN_PRICES_INR, TRIAL_DAYS, formatInr } from '@/lib/billing/catalog';

const MEMBERS = ['You', 'Asha', 'Ravi', 'Meera'];
const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

const DEMO_TOASTS = ['Asha paid you ₹600', 'Rent reminder: due in 3 days', 'Receipt scanned ✓', 'Ravi joined Flat 402'];

function ToastLoop() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((v) => (v + 1) % DEMO_TOASTS.length), 3200);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <div aria-hidden className="ps:pointer-events-none ps:absolute ps:-bottom-5 ps:left-4 ps:z-10 ps:sm:-left-6">
      <p
        key={reduced ? 'static' : i}
        className="ps:max-w-[min(100%,16rem)] ps:rounded-2xl ps:bg-ink ps:px-4 ps:py-2.5 ps:text-sm ps:font-medium ps:text-white ps:shadow-xl ps:ring-1 ps:ring-white/10 ps:motion-safe:animate-rise-in"
      >
        🔔 {DEMO_TOASTS[reduced ? 0 : i]}
      </p>
    </div>
  );
}

/** Live equal-split demo. Leftover paisa goes to the first included member (the payer). */
export function SplitDemo() {
  const [total, setTotal] = useState(2400);
  const [inc, setInc] = useState([true, true, true, true]);
  const [burst, setBurst] = useState(0);
  const [done, setDone] = useState(false);
  const settle = () => {
    setBurst((b) => b + 1);
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  };
  const n = inc.filter(Boolean).length;
  const cents = Math.round(total * 100);
  const base = n ? Math.floor(cents / n) : 0;
  const rem = n ? cents - base * n : 0;
  const firstIn = inc.indexOf(true);
  const share = inc.map((on, i) => (on ? (base + (i === firstIn ? rem : 0)) / 100 : 0));

  return (
    <div className="ps:relative ps:rounded-3xl ps:bg-white ps:p-6 ps:shadow-[0_30px_80px_-30px_rgba(76,29,149,.45)] ps:ring-1 ps:ring-ink/5">
      {burst > 0 && (
        <div key={burst} aria-hidden className="ps:pointer-events-none ps:absolute ps:inset-0 ps:overflow-hidden ps:rounded-3xl">
          {Array.from({ length: 16 }, (_, k) => (
            <span
              key={k}
              style={{ left: `${((k * 53) % 94) + 2}%`, animationDelay: `${k * 45}ms` }}
              className="ps:absolute ps:top-0 ps:grid ps:size-6 ps:place-items-center ps:rounded-full ps:bg-gold ps:text-xs ps:font-bold ps:text-[#7a4a0a] ps:opacity-0 ps:motion-safe:animate-fall"
            >
              ₹
            </span>
          ))}
        </div>
      )}
      <div className="ps:flex ps:items-baseline ps:justify-between ps:gap-3">
        <div>
          <p className="ps:text-sm ps:text-ink/55">Dinner at Toit · Flatmates</p>
          <p className="ps:text-3xl ps:font-extrabold ps:tabular-nums ps:sm:text-4xl">{inr(total)}</p>
        </div>
        <span className="ps:hidden ps:shrink-0 ps:rounded-full ps:bg-brand-soft ps:px-3 ps:py-1 ps:text-xs ps:min-[380px]:block ps:font-semibold ps:text-brand">Equal split</span>
      </div>
      <label className="ps:mt-5 ps:block ps:text-sm ps:font-medium">
        Drag the bill
        <input type="range" min={200} max={20000} step={50} value={total} onChange={(e) => setTotal(+e.target.value)} className="ps:mt-2 ps:w-full ps:accent-brand" />
      </label>
      <ul className="ps:mt-4 ps:space-y-2">
        {MEMBERS.map((m, i) => (
          <li key={m}>
            <button
              type="button"
              aria-pressed={inc[i]}
              onClick={() => setInc(inc.map((v, j) => (j === i ? !v : v)))}
              className={`ps:flex ps:w-full ps:items-center ps:justify-between ps:rounded-xl ps:px-4 ps:py-3 ps:text-left ps:transition ps:focus-visible:outline-2 ps:focus-visible:outline-brand ${inc[i] ? 'ps:bg-brand-soft' : 'ps:bg-ink/5 ps:opacity-60'}`}
            >
              <span className="ps:flex ps:items-center ps:gap-3">
                <span className={`ps:grid ps:size-8 ps:place-items-center ps:rounded-full ps:text-xs ps:font-bold ${inc[i] ? 'ps:bg-brand ps:text-white' : 'ps:bg-ink/20'}`}>{m[0]}</span>
                <span className="ps:font-semibold">{m}</span>
                {!inc[i] && <span className="ps:text-xs ps:text-ink/50">left out</span>}
              </span>
              <span className="ps:font-bold ps:tabular-nums">{inr(share[i])}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={settle}
        className={`ps:mt-4 ps:w-full ps:rounded-xl ps:py-3 ps:font-semibold ps:transition ps:focus-visible:outline-2 ps:focus-visible:outline-brand ${done ? 'ps:bg-mint ps:text-white' : 'ps:bg-ink ps:text-white ps:hover:bg-brand'}`}
      >
        {done ? 'Everyone is square ✓' : 'Settle up 🎉'}
      </button>
      <p className="ps:mt-3 ps:text-xs ps:text-ink/50">Tap a name to leave them out. The rest is re-split instantly, to the paisa.</p>
      <ToastLoop />
    </div>
  );
}

/* ---------- Hero: pointer spotlight + parallax floating chips ---------- */
const CHIPS: [string, Record<string, string>, number][] = [
  ['Swiggy −₹450', { left: '3%', top: '7%' }, 8],
  ['Salary +₹1,20,000', { left: '42%', top: '5%' }, -8],
  ['Rent due in 3 days', { left: '3%', bottom: '90px' }, 10],
];
export function Hero({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const move = (e: PointerEvent) => {
    if (reduced) return;
    const el = ref.current!; const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
    el.style.setProperty('--px', String((x - 0.5) * 2)); el.style.setProperty('--py', String((y - 0.5) * 2));
  };
  return (
    <section ref={ref} onPointerMove={move}
      style={{ background: 'radial-gradient(620px circle at var(--mx,72%) var(--my,28%), rgba(139,92,246,.5), transparent 60%), #14112b' }}
      className="ps:relative ps:overflow-hidden ps:text-white">
      {CHIPS.map(([t, pos, d]) => (
        <div
          key={t}
          aria-hidden
          className="ps:pointer-events-none ps:absolute ps:hidden ps:xl:block"
          style={{ ...pos, transform: `translate3d(calc(var(--px,0)*${d}px),calc(var(--py,0)*${d}px),0)` }}
        >
          <span className="ps:block ps:whitespace-nowrap ps:rounded-full ps:bg-white/10 ps:px-4 ps:py-2 ps:text-sm ps:font-medium ps:text-white/80 ps:ring-1 ps:ring-white/15 ps:backdrop-blur ps:motion-safe:animate-bob">
            {t}
          </span>
        </div>
      ))}
      {children}
    </section>
  );
}

/* ---------- Scroll story: sticky visual changes as steps scroll past ---------- */
const STEPS = [
  ['Snap it', 'Photograph a receipt. AI reads the amount, date, merchant and category; you confirm.'],
  ['Split it', 'Drop it in a group. Equal, custom amounts, percentages, or leave someone out.'],
  ['Remember it', 'Due dates repeat weekly or monthly and reach you in-app, by email or push.'],
  ['Ask about it', 'Ask the assistant what changed. It answers only from your own numbers.'],
];
function StepVisual({ i }: { i: number }) {
  const row = 'ps:flex ps:justify-between ps:rounded-xl ps:bg-white/10 ps:px-4 ps:py-3';
  if (i === 0) {
    return (
      <div className="ps:relative ps:space-y-3">
        <span
          aria-hidden
          className="ps:pointer-events-none ps:absolute ps:inset-x-0 ps:z-10 ps:h-0.5 ps:bg-gradient-to-r ps:from-transparent ps:via-gold ps:to-transparent ps:motion-safe:animate-scan"
        />
        <p className="ps:text-sm ps:text-white/60">Extracting from receipt…</p>
        {[['Merchant', 'Fresh Mart'], ['Amount', '₹1,499.40'], ['Date', '5 Aug 2026'], ['Category', 'Groceries']].map(([a, b]) => (
          <div key={a} className={row}>
            <span className="ps:text-white/60">{a}</span>
            <b>{b}</b>
          </div>
        ))}
      </div>
    );
  }
  if (i === 1) return (<div className="ps:grid ps:grid-cols-2 ps:gap-3">{['You', 'Asha', 'Ravi', 'Meera'].map((m) => <div key={m} className="ps:rounded-2xl ps:bg-white/10 ps:p-4 ps:text-center"><span className="ps:mx-auto ps:grid ps:size-10 ps:place-items-center ps:rounded-full ps:bg-brand ps:font-bold">{m[0]}</span><p className="ps:mt-2 ps:text-sm ps:text-white/60">{m}</p><b className="ps:text-xl">₹600</b></div>)}</div>);
  if (i === 2) return (<div className="ps:space-y-3">{[['Rent', '1 Oct · monthly'], ['Wi-Fi', '5 Oct · monthly'], ['Flat dues', '7 Oct · group']].map(([a, b]) => <div key={a} className={row}><span><span className="ps:inline-block ps:origin-top ps:motion-safe:animate-wiggle">🔔</span> {a}</span><span className="ps:text-white/60">{b}</span></div>)}</div>);
  return (<div className="ps:space-y-3"><p className="ps:ml-auto ps:w-fit ps:rounded-2xl ps:bg-brand ps:px-4 ps:py-2">Why was July so high?</p><p className="ps:rounded-2xl ps:bg-white/10 ps:px-4 ps:py-3 ps:leading-7">Groceries rose to ₹2,950 and three subscriptions billed in the same week.</p></div>);
}
function StepCard({ i }: { i: number }) {
  return <div className="ps:rounded-[2rem] ps:bg-ink ps:p-5 ps:text-white ps:shadow-2xl ps:shadow-brand/30 ps:sm:p-6"><StepVisual i={i} /></div>;
}
export function Story() {
  const [a, setA] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setA(Number(e.target.getAttribute('data-i')))), { rootMargin: '-40% 0px -40% 0px' });
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  return (
    <div className="ps:grid ps:gap-4 ps:lg:grid-cols-2 ps:lg:gap-12">
      <div>
        {STEPS.map(([t, d], i) => (
          <div key={t} ref={(el) => { refs.current[i] = el; }} data-i={i}
            className={`ps:py-8 ps:transition-opacity ps:lg:min-h-[60vh] ps:lg:py-24 ${a === i ? '' : 'ps:lg:opacity-35'}`}>
            <button type="button" onClick={() => setA(i)} className="ps:block ps:w-full ps:text-left">
              <span className="ps:text-sm ps:font-bold ps:text-brand">0{i + 1}</span>
              <span className="ps:mt-2 ps:block ps:text-4xl ps:font-extrabold ps:tracking-tight ps:sm:text-5xl">{t}</span>
              <span className="ps:mt-4 ps:block ps:max-w-[40ch] ps:text-lg ps:leading-8 ps:text-ink/65">{d}</span>
            </button>
            <div className="ps:mt-6 ps:max-w-xl ps:lg:hidden"><StepCard i={i} /></div>
          </div>
        ))}
      </div>
      <div className="ps:hidden ps:lg:sticky ps:lg:top-28 ps:lg:block ps:lg:self-start">
        <div className="ps:grid ps:min-h-[420px] ps:rounded-[2rem] ps:bg-ink ps:p-6 ps:text-white ps:shadow-2xl ps:shadow-brand/30">
          {STEPS.map(([t], i) => (
            <div key={t} aria-hidden={a !== i} className={`ps:col-start-1 ps:row-start-1 ps:transition-all ps:duration-500 ${a === i ? 'ps:translate-y-0 ps:opacity-100' : 'ps:pointer-events-none ps:translate-y-4 ps:opacity-0'}`}><StepVisual i={i} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Spend donut: hover or focus a slice ---------- */
const CATS: [string, number, string][] = [['Rent', 25000, '#6d28d9'], ['Groceries', 9800, '#a78bfa'], ['Transport', 4200, '#f6ad55'], ['Dining', 6100, '#0e9f6e'], ['Other', 3900, '#cbd5e1']];
const CATS_TOTAL = CATS.reduce((sum, c) => sum + c[1], 0);
const DONUT_SLICES = CATS.reduce<{ n: string; v: number; c: string; k: number; len: number; off: number }[]>((slices, [n, v, c], k) => {
  const len = (v / CATS_TOTAL) * 100;
  const off = -slices.reduce((sum, x) => sum + x.len, 0);
  slices.push({ n, v, c, k, len, off });
  return slices;
}, []);

export function Donut() {
  const [i, setI] = useState(0);
  const total = CATS_TOTAL;
  return (
    <div className="ps:grid ps:items-center ps:gap-10 ps:md:grid-cols-[320px_1fr]">
      <svg viewBox="0 0 36 36" role="img" aria-label="Spending by category" className="ps:mx-auto ps:w-56 ps:sm:w-72 ps:-rotate-90">
        {DONUT_SLICES.map(({ n, c, k, len, off }) => (
          <circle key={n} cx="18" cy="18" r="15.9155" fill="none" stroke={c} strokeWidth={i === k ? 5 : 3.5} strokeDasharray={`${len - 0.6} ${100 - len + 0.6}`} strokeDashoffset={off}
            className="ps:cursor-pointer ps:transition-all" onPointerEnter={() => setI(k)} />))}
        <g className="ps:rotate-90" style={{ transformOrigin: '18px 18px' }}>
          <text x="18" y="17.5" textAnchor="middle" fontSize="2.6" fontWeight="800" fill="#14112b">₹{CATS[i][1].toLocaleString('en-IN')}</text>
          <text x="18" y="21.5" textAnchor="middle" fontSize="1.9" fill="#14112b" opacity=".6">{CATS[i][0]} · {Math.round((CATS[i][1] / total) * 100)}%</text>
        </g>
      </svg>
      <ul className="ps:space-y-2">
        {CATS.map(([n, v, c], k) => (
          <li key={n}><button type="button" onMouseEnter={() => setI(k)} onFocus={() => setI(k)} className={`ps:flex ps:w-full ps:items-center ps:justify-between ps:rounded-xl ps:px-4 ps:py-3 ps:transition ps:focus-visible:outline-2 ps:focus-visible:outline-brand ${i === k ? 'ps:bg-white ps:shadow-md' : ''}`}>
            <span className="ps:flex ps:items-center ps:gap-3 ps:font-semibold"><i className="ps:size-3 ps:rounded-full" style={{ background: c }} />{n}</span>
            <span className="ps:tabular-nums ps:text-ink/70">₹{v.toLocaleString('en-IN')}</span></button></li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- AI chat: pick a question, watch the answer type out ---------- */
const QA = [
  ['How much did I spend on groceries last month?', 'You spent ₹2,950 on Groceries in July, mostly at Fresh Mart. Only Rent was higher.'],
  ['Which subscriptions am I paying for?', 'Netflix (₹299), Spotify (₹129) and YouTube (₹899) have billed you every month since May.'],
  ['Will I overspend this month?', 'At your current pace you would reach about ₹6,200 over your usual monthly spend. Dining is the main driver.'],
];
export function AiChat() {
  const [s, setS] = useState(-1);
  const [n, setN] = useState(0);
  const pickQuestion = (k: number) => {
    setS(k);
    setN(0);
  };
  useEffect(() => {
    if (s < 0) return;
    const id = setInterval(() => setN((v) => { if (v >= QA[s][1].length) { clearInterval(id); return v; } return v + 2; }), 22);
    return () => clearInterval(id);
  }, [s]);
  return (
    <div className="ps:rounded-3xl ps:bg-white/5 ps:p-6 ps:ring-1 ps:ring-white/10">
      <div className="ps:min-h-48 ps:space-y-3" aria-live="polite">
        {s < 0 ? <p className="ps:text-white/50">Pick a question to try it.</p> : (<>
          <p className="ps:ml-auto ps:w-fit ps:max-w-[88%] ps:rounded-2xl ps:bg-brand ps:px-4 ps:py-3">{QA[s][0]}</p>
          <p className="ps:w-fit ps:max-w-[92%] ps:rounded-2xl ps:bg-white/10 ps:px-4 ps:py-3 ps:leading-7">{QA[s][1].slice(0, n)}<span className="ps:ml-0.5 ps:inline-block ps:h-4 ps:w-0.5 ps:animate-pulse ps:bg-white" /></p></>)}
      </div>
      <div className="ps:mt-4 ps:flex ps:flex-wrap ps:gap-2">
        {QA.map(([q], k) => <button key={q} type="button" onClick={() => pickQuestion(k)} className={`ps:rounded-full ps:px-4 ps:py-2 ps:text-sm ps:ring-1 ps:transition ${s === k ? 'ps:bg-white ps:text-ink ps:ring-white' : 'ps:ring-white/25 ps:hover:bg-white/10'}`}>{q}</button>)}
      </div>
      <p className="ps:mt-4 ps:text-xs ps:text-white/45">Illustrative. Not professional financial advice.</p>
    </div>
  );
}

/* ---------- Scroll progress, reveal, mobile menu ---------- */
export function ScrollBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const f = () => { const h = document.documentElement; setP(h.scrollTop / (h.scrollHeight - h.clientHeight || 1)); };
    f(); addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);
  return <div aria-hidden className="ps:fixed ps:inset-x-0 ps:top-0 ps:z-50 ps:h-1 ps:origin-left ps:bg-gradient-to-r ps:from-brand ps:to-gold" style={{ transform: `scaleX(${p})` }} />;
}

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`${className} ps:transition-all ps:duration-700 ps:motion-reduce:translate-y-0 ps:motion-reduce:opacity-100 ${on ? 'ps:translate-y-0 ps:opacity-100' : 'ps:translate-y-6 ps:opacity-0'}`}>
      {children}
    </div>
  );
}

export function MobileMenu({ links }: { links: string[][] }) {
  const [o, setO] = useState(false);
  const bar = 'ps:block ps:h-0.5 ps:w-5 ps:bg-ink ps:transition';
  return (
    <div className="ps:lg:hidden">
      <button type="button" aria-label="Menu" aria-expanded={o} onClick={() => setO(!o)} className="ps:grid ps:size-10 ps:place-content-center ps:gap-1.5 ps:rounded-full ps:ring-1 ps:ring-ink/15">
        <span className={`${bar} ${o ? 'ps:translate-y-2 ps:rotate-45' : ''}`} /><span className={`${bar} ${o ? 'ps:opacity-0' : ''}`} /><span className={`${bar} ${o ? 'ps:-translate-y-2 ps:-rotate-45' : ''}`} />
      </button>
      {o && (
        <nav className="ps:absolute ps:inset-x-0 ps:top-16 ps:z-50 ps:flex ps:flex-col ps:border-b ps:border-ink/10 ps:bg-paper ps:p-3 ps:shadow-xl">
          {[...links, ['Sign in', '/auth/login']].map(([t, h]) => (
            <Link key={t} href={h} onClick={() => setO(false)} className="ps:rounded-xl ps:px-4 ps:py-3 ps:font-semibold ps:hover:bg-brand-soft">{t}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}

const STARTER_YEARLY_SAVINGS_INR =
  PLAN_PRICES_INR.starterMonthly * 12 - PLAN_PRICES_INR.starterYearly;

/* ---------- Pricing: monthly / yearly toggle ---------- */
export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const plans = useMemo(
    () => [
      {
        name: 'Free trial',
        price: formatInr(0),
        note: `for ${TRIAL_DAYS} days`,
        feats: [
          `Up to ${FREEMIUM_LIMITS.personalTransactions} personal transactions`,
          `Up to ${FREEMIUM_LIMITS.groups} groups, ${FREEMIUM_LIMITS.membersPerGroup} people each`,
          'Limited AI messages and receipt scans',
        ],
        cta: 'Start free trial',
      },
      {
        name: 'Starter',
        price: yearly ? formatInr(PLAN_PRICES_INR.starterYearly) : formatInr(PLAN_PRICES_INR.starterMonthly),
        note: yearly
          ? `per year · save ${formatInr(STARTER_YEARLY_SAVINGS_INR)}`
          : 'per month',
        feats: ['No usage limits', 'Groups, reminders, reports and AI', 'GST invoice by email'],
        cta: 'Choose Starter',
        hot: true,
      },
      {
        name: 'Pro',
        price: formatInr(PLAN_PRICES_INR.proLifetime),
        note: 'one time · lifetime',
        feats: ['Everything in Starter', 'Pay once, use for life', 'Priority support'],
        cta: 'Go Pro',
      },
    ],
    [yearly],
  );
  return (
    <div>
      <div className="ps:flex ps:flex-col ps:gap-6 ps:sm:flex-row ps:sm:flex-wrap ps:sm:items-end ps:sm:justify-between">
        <h2 className="ps:max-w-md ps:text-3xl ps:font-extrabold ps:tracking-tight ps:sm:text-4xl">Simple pricing. Start free.</h2>
        <div role="group" aria-label="Billing period" className="ps:flex ps:w-fit ps:rounded-full ps:bg-white ps:p-1 ps:ring-1 ps:ring-ink/10">
          {[['Monthly', false], ['Yearly', true]].map(([l, v]) => (
            <button
              key={String(l)}
              type="button"
              aria-pressed={yearly === v}
              onClick={() => setYearly(v as boolean)}
              className={`ps:rounded-full ps:px-5 ps:py-2 ps:text-sm ps:font-semibold ps:transition ${yearly === v ? 'ps:bg-brand ps:text-white' : 'ps:text-ink/60'}`}
            >
              {l as string}
            </button>
          ))}
        </div>
      </div>
      <div className="ps:mt-10 ps:grid ps:gap-5 ps:md:grid-cols-3">
        {plans.map((p) => (
          <Tilt key={p.name} subtleGlow={Boolean(p.hot)} className="ps:h-full ps:rounded-3xl">
            <div
              className={`ps:flex ps:h-full ps:flex-col ps:rounded-3xl ps:p-6 ps:transition ps:sm:p-7 ps:hover:-translate-y-1 ${p.hot ? 'ps:bg-ink ps:text-white ps:shadow-2xl ps:shadow-brand/30 ps:md:scale-[1.03]' : 'ps:bg-white ps:ring-1 ps:ring-ink/5'}`}
            >
              <p className={`ps:text-sm ps:font-bold ${p.hot ? 'ps:text-gold' : 'ps:text-brand'}`}>
                {p.name}
                {p.hot && ' · most popular'}
              </p>
              <p className="ps:mt-3 ps:text-4xl ps:font-extrabold ps:tabular-nums ps:sm:text-5xl">{p.price}</p>
              <p className={`ps:mt-1 ps:text-sm ${p.hot ? 'ps:text-white/60' : 'ps:text-ink/55'}`}>{p.note}</p>
              <ul className="ps:mt-6 ps:flex-1 ps:space-y-2 ps:text-sm ps:leading-6">
                {p.feats.map((f) => (
                  <li key={f} className="ps:flex ps:gap-2">
                    <span className="ps:text-mint">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className={`ps:mt-7 ps:block ps:rounded-full ps:py-3 ps:text-center ps:font-semibold ps:transition ${p.hot ? 'ps:bg-white ps:text-brand-deep ps:hover:bg-brand-soft' : 'ps:bg-brand ps:text-white ps:hover:bg-brand-deep'}`}
              >
                {p.cta}
              </Link>
            </div>
          </Tilt>
        ))}
      </div>
      <p className="ps:mt-6 ps:text-sm ps:text-ink/55">
        Prices are before GST. Pay with Razorpay or Stripe. After a trial you can still view your data.
      </p>
    </div>
  );
}

/* ---------- Stories: pick who you are ---------- */
const STORIES: [string, string, string[]][] = [
  ['Solo', 'Track your month', ['Sign up', 'Add expenses as they happen', 'Scan a receipt', 'Check your dashboard']],
  ['Roommates', 'Split rent and utilities', ['Create a group', 'Invite by username', 'Add the rent, split equally', 'See who owes whom']],
  ['Trips', 'Settle up after Goa', ['Create the trip group', 'Everyone adds their spends', 'Leave out who skipped dinner', 'Export the settlement list']],
  ['Bills', 'Never miss a due date', ['Create a reminder', 'Repeat monthly', 'Get notified', 'Mark done or snooze']],
];

export function Stories() {
  const [i, setI] = useState(0);
  const [, title, steps] = STORIES[i];
  return (
    <div>
      <div role="tablist" aria-label="Who are you?" className="ps:flex ps:flex-wrap ps:gap-2">
        {STORIES.map(([n], k) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={i === k}
            onClick={() => setI(k)}
            className={`ps:rounded-full ps:px-4 ps:py-2.5 ps:text-sm ps:font-semibold ps:transition ps:sm:px-5 ${i === k ? 'ps:bg-brand ps:text-white' : 'ps:bg-white ps:text-ink/70 ps:ring-1 ps:ring-ink/10 ps:hover:text-brand'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <p key={title} className="ps:mt-8 ps:text-xl ps:font-bold ps:sm:text-2xl">{title}</p>
      <ol key={i} className="ps:mt-6 ps:grid ps:gap-3 ps:sm:grid-cols-2 ps:lg:grid-cols-4">
        {steps.map((st, k) => (
          <li
            key={st}
            style={{ animationDelay: `${k * 90}ms` }}
            className="ps:flex ps:items-center ps:gap-3 ps:rounded-2xl ps:bg-white ps:p-4 ps:ring-1 ps:ring-ink/5 ps:motion-safe:animate-rise-in"
          >
            <span className="ps:grid ps:size-8 ps:shrink-0 ps:place-items-center ps:rounded-full ps:bg-brand-soft ps:text-sm ps:font-bold ps:text-brand">
              {k + 1}
            </span>
            <span className="ps:font-medium">{st}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Delight: rotating word, magnetic button, tilt cards, quiz ---------- */
const ROTATING_WORDS = ['shared', 'split', 'tracked', 'remembered'];

export function RotatingWord() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((v) => (v + 1) % ROTATING_WORDS.length), 2200);
    return () => clearInterval(id);
  }, [reduced]);
  const active = reduced ? 0 : i;
  return (
    <span className="ps:mt-1 ps:block ps:grid ps:w-fit ps:justify-items-start">
      {ROTATING_WORDS.map((w, k) => (
        <span
          key={w}
          aria-hidden={k !== active}
          className={`ps:col-start-1 ps:row-start-1 ps:bg-gradient-to-r ps:from-violet-300 ps:to-gold ps:bg-clip-text ps:text-transparent ps:transition-all ps:duration-500 ps:motion-reduce:transition-none ${k === active ? 'ps:translate-y-0 ps:opacity-100' : 'ps:-translate-y-3 ps:opacity-0'}`}
        >
          {w}.
        </span>
      ))}
    </span>
  );
}

export function Magnetic({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const move = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduced) return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return (
    <Link
      ref={ref}
      href={href}
      onPointerMove={move}
      onPointerLeave={reset}
      className={`${className} ps:transition-transform ps:duration-200 ps:motion-reduce:transform-none`}
    >
      {children}
    </Link>
  );
}

export function Tilt({
  children,
  className = '',
  subtleGlow = false,
}: {
  children: ReactNode;
  className?: string;
  subtleGlow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const move = (e: PointerEvent) => {
    if (reduced) return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg)`;
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
  };
  const reset = () => {
    if (!ref.current) return;
    ref.current.style.transform = '';
  };
  const glow = subtleGlow
    ? 'radial-gradient(240px circle at var(--gx,50%) var(--gy,50%), rgba(139,92,246,.08), transparent 70%)'
    : 'radial-gradient(240px circle at var(--gx,50%) var(--gy,50%), rgba(139,92,246,.18), transparent 70%)';
  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      className={`${className} ps:group/tilt ps:relative ps:transition-transform ps:duration-200 ps:motion-reduce:transform-none`}
    >
      {!reduced && (
        <div
          aria-hidden
          className="ps:pointer-events-none ps:absolute ps:inset-0 ps:z-10 ps:rounded-[inherit] ps:opacity-0 ps:transition-opacity ps:group-hover/tilt:opacity-100 ps:group-focus-within/tilt:opacity-100"
          style={{ background: glow }}
        />
      )}
      <div className="ps:relative ps:z-0">{children}</div>
    </div>
  );
}

type MoodKey = 'S' | 'P' | 'R';
const MOOD_QUIZ: [string, [string, MoodKey][]][] = [
  ['Payday just landed. First move?', [['Move some to savings', 'S'], ['Pay back friends I owe', 'P'], ['Schedule every bill', 'R']]],
  ['The group dinner bill arrives…', [['I quietly check the total', 'S'], ['I split it before dessert', 'P'], ['I already budgeted for it', 'R']]],
  ['A payment reminder buzzes your phone. You…', [['Smile, it is handled', 'R'], ['Never needed one', 'S'], ['Forward it to the group', 'P']]],
];
const MOOD_RESULTS: Record<MoodKey, [string, string]> = {
  S: ['The Saver', 'You guard every rupee. Reports and insight cards will show where the leaks hide.'],
  P: ['The Splitter', 'You keep friendships and balances clean. Groups, custom splits and settlement lists are made for you.'],
  R: ['The Planner', 'You live by due dates. Recurring entries and reminders can run your month for you.'],
};

function pickMood(answers: MoodKey[]): MoodKey {
  const counts = { S: 0, P: 0, R: 0 };
  for (const a of answers) counts[a] += 1;
  return (['S', 'P', 'R'] as MoodKey[]).sort((a, b) => counts[b] - counts[a])[0];
}

export function MoneyMood() {
  const [ans, setAns] = useState<MoodKey[]>([]);
  const q = MOOD_QUIZ[ans.length];
  const top = pickMood(ans);
  return (
    <div className="ps:relative ps:overflow-hidden ps:rounded-[2rem] ps:bg-gradient-to-br ps:from-brand ps:to-brand-deep ps:p-6 ps:text-white ps:sm:p-12">
      <p className="ps:text-sm ps:font-bold ps:text-gold">30-second quiz</p>
      <h2 className="ps:mt-2 ps:text-3xl ps:font-extrabold ps:tracking-tight ps:sm:text-4xl">What&apos;s your money mood?</h2>
      <div className="ps:mt-8 ps:min-h-52" aria-live="polite">
        {q ? (
          <div key={ans.length} className="ps:motion-safe:animate-rise-in">
            <p className="ps:mb-4 ps:text-lg ps:font-semibold ps:text-white/90">{ans.length + 1}/3 · {q[0]}</p>
            <div className="ps:grid ps:gap-3 ps:sm:grid-cols-3">
              {q[1].map(([t, k]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAns([...ans, k])}
                  className="ps:rounded-2xl ps:bg-white/10 ps:p-4 ps:text-left ps:font-medium ps:ring-1 ps:ring-white/20 ps:transition ps:hover:-translate-y-1 ps:hover:bg-white ps:hover:text-brand-deep"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ps:motion-safe:animate-rise-in">
            <p className="ps:text-4xl ps:font-extrabold">{MOOD_RESULTS[top][0]}</p>
            <p className="ps:mt-3 ps:max-w-[52ch] ps:text-lg ps:leading-8 ps:text-white/80">{MOOD_RESULTS[top][1]}</p>
            <div className="ps:mt-6 ps:flex ps:flex-wrap ps:gap-3">
              <Link href="/auth/register" className="ps:rounded-full ps:bg-white ps:px-6 ps:py-3 ps:font-semibold ps:text-brand-deep ps:hover:bg-brand-soft">
                Start free
              </Link>
              <button type="button" onClick={() => setAns([])} className="ps:rounded-full ps:px-6 ps:py-3 ps:font-semibold ps:ring-1 ps:ring-white/40 ps:hover:bg-white/10">
                Retake
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="ps:mt-4 ps:text-xs ps:text-white/55">Just for fun. Not financial advice.</p>
    </div>
  );
}
