import { useEffect, useState } from "react";
import { CHECKOUT_ANNUAL_URL } from "@/lib/w2Config";

const links = [
  { href: "#how", label: "How It Works" },
  { href: "#what", label: "What You Get" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function W2Nav() {
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowCta(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[hsl(var(--w2-navy))] text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--w2-gold))]" />
          RPRx Member Program
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-[hsl(var(--w2-gold))]"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href={CHECKOUT_ANNUAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden rounded-full bg-[hsl(var(--w2-gold))] px-4 py-2 text-sm font-semibold text-[hsl(var(--w2-navy))] shadow-md transition-all hover:bg-[hsl(var(--w2-gold-soft))] hover:shadow-lg sm:inline-block ${
            showCta ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          Get My $2,000 Tax Credit →
        </a>
      </div>
    </header>
  );
}
