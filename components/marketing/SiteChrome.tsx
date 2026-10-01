import Link from 'next/link';

const LINKS = [['How it works', '/#story'], ['AI assistant', '/#ai'], ['Security', '/#security'], ['FAQ', '/faq']];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="ps:flex ps:items-center ps:gap-2 ps:font-extrabold ps:tracking-tight">
      <span className="ps:grid ps:size-8 ps:place-items-center ps:rounded-lg ps:bg-brand ps:text-sm ps:text-white">PS</span>
      <span className={light ? 'ps:text-white' : 'ps:text-ink'}>PaysaSuchan</span>
    </Link>
  );
}

export function Nav() {
  return (
    <header className="ps:sticky ps:top-0 ps:z-40 ps:border-b ps:border-ink/5 ps:bg-paper/80 ps:backdrop-blur-lg">
      <div className="ps:mx-auto ps:flex ps:h-16 ps:max-w-6xl ps:items-center ps:justify-between ps:px-6">
        <Logo />
        <nav className="ps:hidden ps:gap-8 ps:text-sm ps:font-medium ps:text-ink/70 ps:md:flex">
          {LINKS.map(([t, h]) => <Link key={t} href={h} className="ps:hover:text-brand">{t}</Link>)}
        </nav>
        <div className="ps:flex ps:items-center ps:gap-3 ps:text-sm ps:font-semibold">
          <Link href="/auth/login" className="ps:hidden ps:px-3 ps:py-2 ps:hover:text-brand ps:sm:block">Sign in</Link>
          <Link href="/auth/register" className="ps:rounded-full ps:bg-brand ps:px-5 ps:py-2.5 ps:text-white ps:transition ps:hover:bg-brand-deep ps:focus-visible:outline-2 ps:focus-visible:outline-offset-2 ps:focus-visible:outline-brand">Start free</Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const col = 'ps:flex ps:flex-col ps:gap-2 ps:text-sm ps:text-white/65';
  return (
    <footer className="ps:bg-ink ps:text-white">
      <div className="ps:mx-auto ps:grid ps:max-w-6xl ps:gap-10 ps:px-6 ps:py-16 ps:md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="ps:mt-4 ps:max-w-xs ps:text-sm ps:leading-6 ps:text-white/60">Track your money, split it fairly and never miss a due date.</p>
        </div>
        <div className={col}><b className="ps:text-white">Product</b><Link href="/#story">How it works</Link><Link href="/#ai">AI assistant</Link><Link href="/#security">Security</Link></div>
        <div className={col}><b className="ps:text-white">Legal</b><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/terms-of-use">Terms of Use</Link><Link href="/privacy-policy">Privacy Policy</Link></div>
        <div className={col}><b className="ps:text-white">Help</b><Link href="/faq">FAQ</Link><Link href="/auth/login">Sign in</Link><Link href="/auth/register">Create account</Link></div>
      </div>
      <p className="ps:border-t ps:border-white/10 ps:py-6 ps:text-center ps:text-xs ps:text-white/45">© 2026 PaysaSuchan. All rights reserved.</p>
    </footer>
  );
}
