'use client';
import { useState } from 'react';

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

const TABS = [
  { id: 'ledger', name: 'Personal ledger', title: 'Every rupee in and out, in one place.', body: 'Log income and expenses, attach receipts, set recurring entries and import from CSV. The dashboard shows monthly spend, deposits and where the money goes.', rows: [['Salary', '+₹1,20,000', 'in'], ['Rent', '−₹25,000', 'out'], ['Fresh Mart', '−₹1,499.40', 'out'], ['Freelance', '+₹25,000', 'in']] },
  { id: 'groups', name: 'Groups', title: 'Shared costs without the awkward maths.', body: 'Invite by username, email or phone. Split equally, by amount or by percentage, and see live balances. Members edit their own entries; admins manage the rest. Export a settlement summary as CSV.', rows: [['Asha owes You', '₹600.00', 'in'], ['You owe Ravi', '₹250.00', 'out'], ['Meera is settled', '₹0.00', 'in']] },
  { id: 'reminders', name: 'Reminders', title: 'Due dates that find you first.', body: 'Personal or group reminders with weekly or monthly repeats. Snooze or mark done. Choose in-app, email or browser push, per your own preferences.', rows: [['Rent · 1 Oct', '₹25,000', 'out'], ['Wi-Fi · 5 Oct', '₹1,180', 'out'], ['Flat dues · 7 Oct', '₹2,400', 'out']] },
  { id: 'reports', name: 'Reports', title: 'See patterns, then export them.', body: 'Filter by category and date, break spending down by category and download CSV for your accountant or spreadsheet.', rows: [['Groceries', '₹2,950', 'out'], ['Entertainment', '₹1,327', 'out'], ['Transport', '₹1,450', 'out']] },
  { id: 'admin', name: 'Admin console', title: 'Oversight for the people running it.', body: 'Manage users and admins, categories, groups and reminders, triage support tickets, and set platform-wide notification policy from one console.', rows: [['Open tickets', '4', 'in'], ['Groups', '128', 'in'], ['Push notifications', 'On', 'in']] },
];

export function FeatureTabs() {
  const [i, setI] = useState(0);
  const t = TABS[i];
  return (
    <div>
      <div role="tablist" aria-label="Features" className="ps:flex ps:flex-wrap ps:gap-2">
        {TABS.map((x, j) => (
          <button key={x.id} role="tab" aria-selected={i === j} onClick={() => setI(j)}
            className={`ps:rounded-full ps:px-5 ps:py-2.5 ps:text-sm ps:font-semibold ps:transition ps:focus-visible:outline-2 ps:focus-visible:outline-brand ${i === j ? 'ps:bg-brand ps:text-white' : 'ps:bg-white ps:text-ink/70 ps:ring-1 ps:ring-ink/10 ps:hover:text-brand'}`}>
            {x.name}
          </button>
        ))}
      </div>
      <div role="tabpanel" key={t.id} className="ps:mt-10 ps:grid ps:items-center ps:gap-10 ps:md:grid-cols-2">
        <div>
          <h3 className="ps:text-3xl ps:font-extrabold ps:tracking-tight">{t.title}</h3>
          <p className="ps:mt-4 ps:max-w-[52ch] ps:text-lg ps:leading-8 ps:text-ink/70">{t.body}</p>
        </div>
        <ul className="ps:rounded-3xl ps:bg-white ps:p-3 ps:ring-1 ps:ring-ink/5">
          {t.rows.map(([a, b, k]) => (
            <li key={a} className="ps:flex ps:justify-between ps:rounded-2xl ps:px-4 ps:py-4 ps:odd:bg-paper">
              <span className="ps:font-medium">{a}</span>
              <span className={`ps:font-bold ps:tabular-nums ${k === 'in' ? 'ps:text-mint' : 'ps:text-ink'}`}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
