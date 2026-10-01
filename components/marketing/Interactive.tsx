'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';

const MEMBERS = ['You', 'Asha', 'Ravi', 'Meera'];
const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Live equal-split demo. Leftover paisa goes to the first included member (the payer). */
export function SplitDemo() {
  const [total, setTotal] = useState(2400);
  const [inc, setInc] = useState([true, true, true, true]);
  const n = inc.filter(Boolean).length;
  const cents = Math.round(total * 100);
  const base = n ? Math.floor(cents / n) : 0;
  const rem = n ? cents - base * n : 0;
  const firstIn = inc.indexOf(true);
  const share = inc.map((on, i) => (on ? (base + (i === firstIn ? rem : 0)) / 100 : 0));

  return (
    <div className="ps:relative ps:rounded-3xl ps:bg-white ps:p-6 ps:shadow-[0_30px_80px_-30px_rgba(76,29,149,.45)] ps:ring-1 ps:ring-ink/5">
      <div className="ps:flex ps:items-baseline ps:justify-between">
        <div>
          <p className="ps:text-sm ps:text-ink/55">Dinner at Toit · Flatmates</p>
          <p className="ps:text-4xl ps:font-extrabold ps:tabular-nums">{inr(total)}</p>
        </div>
        <span className="ps:rounded-full ps:bg-brand-soft ps:px-3 ps:py-1 ps:text-xs ps:font-semibold ps:text-brand">Equal split</span>
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
      <p className="ps:mt-4 ps:text-xs ps:text-ink/50">Tap a name to leave them out. The rest is re-split instantly, to the paisa.</p>
    </div>
  );
}

/* ---------- Hero: pointer spotlight + parallax floating chips ---------- */
const CHIPS: [string, string, string, number][] = [
  ['Swiggy −₹450', '4%', '12%', 20], ['Salary +₹1,20,000', '46%', '5%', -16], ['Rent due in 3 days', '1%', '80%', 24],
  ['Asha paid you ₹600', '44%', '90%', -22], ['Receipt scanned ✓', '93%', '44%', 16],
];
export function Hero({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const move = (e: PointerEvent) => {
    const el = ref.current!; const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
    el.style.setProperty('--px', String((x - 0.5) * 2)); el.style.setProperty('--py', String((y - 0.5) * 2));
  };
  return (
    <section ref={ref} onPointerMove={move}
      style={{ background: 'radial-gradient(620px circle at var(--mx,72%) var(--my,28%), rgba(139,92,246,.5), transparent 60%), #14112b' }}
      className="ps:relative ps:overflow-hidden ps:text-white">
      {CHIPS.map(([t, x, y, d]) => (
        <div key={t} aria-hidden className="ps:pointer-events-none ps:absolute ps:hidden ps:lg:block" style={{ left: x, top: y, transform: `translate3d(calc(var(--px,0)*${d}px),calc(var(--py,0)*${d}px),0)` }}>
          <span className="ps:block ps:rounded-full ps:bg-white/10 ps:px-4 ps:py-2 ps:text-sm ps:font-medium ps:text-white/80 ps:ring-1 ps:ring-white/15 ps:backdrop-blur ps:motion-safe:animate-bob">{t}</span>
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
  if (i === 0) return (<div className="ps:space-y-3"><p className="ps:text-sm ps:text-white/60">Extracting from receipt…</p>
    {[['Merchant', 'Fresh Mart'], ['Amount', '₹1,499.40'], ['Date', '5 Aug 2026'], ['Category', 'Groceries']].map(([a, b]) => <div key={a} className={row}><span className="ps:text-white/60">{a}</span><b>{b}</b></div>)}</div>);
  if (i === 1) return (<div className="ps:grid ps:grid-cols-2 ps:gap-3">{['You', 'Asha', 'Ravi', 'Meera'].map((m) => <div key={m} className="ps:rounded-2xl ps:bg-white/10 ps:p-4 ps:text-center"><span className="ps:mx-auto ps:grid ps:size-10 ps:place-items-center ps:rounded-full ps:bg-brand ps:font-bold">{m[0]}</span><p className="ps:mt-2 ps:text-sm ps:text-white/60">{m}</p><b className="ps:text-xl">₹600</b></div>)}</div>);
  if (i === 2) return (<div className="ps:space-y-3">{[['Rent', '1 Oct · monthly'], ['Wi-Fi', '5 Oct · monthly'], ['Flat dues', '7 Oct · group']].map(([a, b]) => <div key={a} className={row}><span><span className="ps:inline-block ps:origin-top ps:motion-safe:animate-wiggle">🔔</span> {a}</span><span className="ps:text-white/60">{b}</span></div>)}</div>);
  return (<div className="ps:space-y-3"><p className="ps:ml-auto ps:w-fit ps:rounded-2xl ps:bg-brand ps:px-4 ps:py-2">Why was July so high?</p><p className="ps:rounded-2xl ps:bg-white/10 ps:px-4 ps:py-3 ps:leading-7">Groceries rose to ₹2,950 and three subscriptions billed in the same week.</p></div>);
}
export function Story() {
  const [a, setA] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setA(Number(e.target.getAttribute('data-i')))), { rootMargin: '-40% 0px -40% 0px' });
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  return (
    <div className="ps:grid ps:gap-6 ps:lg:grid-cols-2 ps:lg:gap-12">
      <div>
        {STEPS.map(([t, d], i) => (
          <button key={t} type="button" ref={(el) => { refs.current[i] = el; }} data-i={i} onClick={() => setA(i)}
            className={`ps:block ps:w-full ps:min-h-[38vh] ps:py-8 ps:text-left ps:transition-opacity ps:md:min-h-[45vh] ps:lg:min-h-[60vh] ps:lg:py-24 ${a === i ? 'ps:opacity-100' : 'ps:opacity-35'}`}>
            <span className="ps:text-sm ps:font-bold ps:text-brand">0{i + 1}</span>
            <span className="ps:mt-2 ps:block ps:text-4xl ps:sm:text-5xl ps:font-extrabold ps:tracking-tight">{t}</span>
            <span className="ps:mt-4 ps:block ps:max-w-[40ch] ps:text-lg ps:leading-8 ps:text-ink/65">{d}</span>
          </button>
        ))}
      </div>
      <div className="ps:sticky ps:top-[72px] ps:z-10 ps:order-first ps:mx-auto ps:w-full ps:max-w-xl ps:lg:top-28 ps:lg:order-last ps:lg:h-[420px] ps:lg:max-w-none">
        <div className="ps:relative ps:h-64 ps:sm:h-72 ps:rounded-[2rem] ps:bg-ink ps:p-5 ps:sm:p-6 ps:text-white ps:shadow-2xl ps:shadow-brand/30 ps:lg:h-full">
          {STEPS.map(([t], i) => (
            <div key={t} aria-hidden={a !== i} className={`ps:absolute ps:inset-5 ps:sm:inset-6 ps:transition-all ps:duration-500 ${a === i ? 'ps:translate-y-0 ps:opacity-100' : 'ps:pointer-events-none ps:translate-y-4 ps:opacity-0'}`}><StepVisual i={i} /></div>
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
    <div className="ps:md:hidden">
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
