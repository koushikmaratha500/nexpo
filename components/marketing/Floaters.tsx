import type { ReactNode } from 'react';

const SHAPES: Record<string, ReactNode> = {
  coin: <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#F6AD55" /><circle cx="20" cy="20" r="13" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" /><text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7a4a0a">₹</text></svg>,
  receipt: <svg viewBox="0 0 40 48"><path d="M4 2h32v42l-5-3-5 3-6-3-6 3-5-3-5 3z" fill="#fff" /><path d="M10 12h20M10 20h20M10 28h12" stroke="#6d28d9" strokeWidth="2.5" strokeLinecap="round" /></svg>,
  bell: <svg viewBox="0 0 40 40"><path d="M20 4a10 10 0 0 0-10 10v8l-4 6h28l-4-6v-8A10 10 0 0 0 20 4z" fill="#a78bfa" /><circle cx="20" cy="33" r="4" fill="#f6ad55" /></svg>,
  pie: <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#6d28d9" /><path d="M20 20V3a17 17 0 0 1 14.7 8.5z" fill="#F6AD55" /><path d="M20 20l14.7-8.5A17 17 0 0 1 20 37z" fill="#0e9f6e" /></svg>,
  spark: <svg viewBox="0 0 24 24"><path d="M12 1l2.5 8.5L23 12l-8.5 2.5L12 23l-2.5-8.5L1 12l8.5-2.5z" fill="#fff" /></svg>,
  people: <svg viewBox="0 0 60 28"><circle cx="14" cy="14" r="12" fill="#a78bfa" /><circle cx="30" cy="14" r="12" fill="#F6AD55" /><circle cx="46" cy="14" r="12" fill="#0e9f6e" /></svg>,
};

// Full class names so Tailwind's scanner can see them (no string-built classes).
const ANIM: Record<string, string> = {
  bob: 'ps:motion-safe:animate-bob', sway: 'ps:motion-safe:animate-sway', wiggle: 'ps:motion-safe:animate-wiggle',
  twinkle: 'ps:motion-safe:animate-twinkle', rise: 'ps:motion-safe:animate-rise', turn: 'ps:motion-safe:animate-turn',
};

// [shape, left, top, max px, animation, delay s, hide on small screens]
type F = [keyof typeof SHAPES, string, string, number, string, number, boolean?];
const SCENES: Record<string, F[]> = {
  hero: [
    ['coin', '6%', '14%', 54, 'bob', 0], ['receipt', '88%', '10%', 50, 'sway', 0.8], ['bell', '3%', '72%', 44, 'wiggle', 0.3],
    ['pie', '92%', '70%', 58, 'turn', 0], ['spark', '30%', '6%', 18, 'twinkle', 0.5], ['spark', '72%', '90%', 16, 'twinkle', 1.4],
    ['coin', '58%', '93%', 32, 'sway', 1.2, true], ['people', '40%', '84%', 64, 'bob', 0.6, true],
  ],
  ai: [
    ['spark', '8%', '12%', 20, 'twinkle', 0], ['spark', '92%', '20%', 16, 'twinkle', 1], ['spark', '50%', '92%', 22, 'twinkle', 2],
    ['spark', '4%', '80%', 14, 'twinkle', 1.6, true], ['spark', '96%', '78%', 18, 'twinkle', 0.6, true],
  ],
  cta: [
    ['coin', '10%', '60%', 36, 'rise', 0], ['coin', '30%', '70%', 28, 'rise', 2], ['coin', '52%', '65%', 34, 'rise', 4, true],
    ['coin', '72%', '72%', 30, 'rise', 1], ['coin', '90%', '62%', 38, 'rise', 3], ['spark', '20%', '15%', 16, 'twinkle', 0.4], ['spark', '80%', '18%', 20, 'twinkle', 1.2],
  ],
};

export function FloatField({ scene }: { scene: 'hero' | 'ai' | 'cta' }) {
  return (
    <div aria-hidden className="ps:pointer-events-none ps:absolute ps:inset-0 ps:overflow-hidden ps:opacity-60 ps:sm:opacity-100">
      {SCENES[scene].map(([s, x, y, px, anim, d, hide], i) => (
        <div key={i} className={`ps:absolute ${hide ? 'ps:hidden ps:md:block' : ''}`} style={{ left: x, top: y, width: `clamp(${Math.round(px * 0.55)}px, ${px / 11}vw, ${px}px)` }}>
          <div className={ANIM[anim]} style={{ animationDelay: `${d}s` }}>{SHAPES[s]}</div>
        </div>
      ))}
    </div>
  );
}
