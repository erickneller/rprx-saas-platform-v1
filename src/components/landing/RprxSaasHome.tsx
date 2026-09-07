import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, HeartPulse, Shield, Sparkles, Stethoscope, WalletCards, Zap } from 'lucide-react';
import rprxLogo from '@/assets/rprx-logo.png';
import { Button } from '@/components/ui/button';

const horsemen = ['Interest', 'Taxes', 'Insurance', 'Education costs'];

const cards = [
  {
    eyebrow: 'Wealth Assessment',
    title: '2 clicks to start taking the Four Horsemen out of your life',
    copy: 'Answer simple yes-or-no questions and RPRx matches your situation with wealth, tax, debt, insurance, education, and cash-flow strategies.',
    icon: WalletCards,
    href: '/auth?next=/assessment',
    cta: 'Start wealth assessment',
    meta: 'Free · about 3 minutes · no statements needed',
  },
  {
    eyebrow: 'Health Assessment',
    title: '2 clicks to start taking the Lightning out of your life',
    copy: 'Identify the physical wellness areas that may be draining energy, productivity, and quality of life — without submitting medical records.',
    icon: HeartPulse,
    href: '/auth?next=/health-assessment',
    cta: 'Start health assessment',
    meta: 'Free · about 3 minutes · no health records collected',
  },
];

const howItWorks = [
  'Take the free financial and/or physical assessment.',
  'Review the top RPRx strategy areas matched to your answers.',
  'Turn matches into a practical plan, then use the library, advisors, and trusted sources to act on it.',
];

const memberBenefits = [
  'Full RPRx strategy library and calculators',
  'Implementation guides, documents, and videos',
  'AI advisor support for matched strategy areas',
  'Trusted source and partner pathways when professional help is needed',
];

export default function RprxSaasHome() {
  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#172033]">
      <header className="sticky top-0 z-40 border-b border-[#ded3bf] bg-[#f7f3ea]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={rprxLogo} alt="RPRx Logo" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#5b6475]">RPRx</p>
              <p className="text-lg font-black leading-none">Financial & Health Wellness</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#5b6475] md:flex">
            <a href="#what">What</a>
            <a href="#paths">Assessments</a>
            <a href="#membership">Membership</a>
            <Link to="/old-home" className="text-[#8a6d2f]">Old home</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" className="text-[#172033]">Sign in</Button>
            </Link>
            <Link to="/auth?next=/assessment">
              <Button className="bg-[#172033] text-white hover:bg-[#273248]">Start free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d6c7aa] bg-white px-4 py-2 text-sm font-bold text-[#8a5d14] shadow-sm">
              <Sparkles className="h-4 w-4" /> The Four Horsemen + The Lightning
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#101827] md:text-7xl">
                Four Horsemen are stealing your wealth — and the Lightning strikes at your health.
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-[#556070]">
                RPRx helps individuals, families, businesses, organizations, schools, and their members identify practical strategies to reduce financial pressure while improving physical wellness and quality of life.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/auth?next=/assessment">
                <Button size="lg" className="w-full bg-[#172033] px-7 text-white hover:bg-[#273248] sm:w-auto">
                  Take the free assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#paths">
                <Button size="lg" variant="outline" className="w-full border-[#cfc2ad] bg-white sm:w-auto">
                  Compare the two paths
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              {horsemen.map((item) => (
                <span key={item} className="rounded-full border border-[#d6c7aa] bg-white px-3 py-1 text-sm font-semibold text-[#4a5566]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d7cab5] bg-[#161f31] p-4 text-white shadow-2xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#25314a] via-[#182236] to-[#0f1727]">
              <div className="aspect-video p-6">
                <div className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/80">RPRx roadmap</span>
                    <Zap className="h-7 w-7 text-yellow-300" />
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-200">Assess → Match → Plan</p>
                    <h2 className="text-3xl font-black leading-tight md:text-4xl">Find what is draining wealth, health, time, and confidence.</h2>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 border-t border-white/10 bg-black/20 p-4 sm:grid-cols-3">
                {['Free assessment', 'Matched strategies', 'Member resources'].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/10 p-3 text-sm font-semibold text-white/85">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="what" className="border-y border-[#ded3bf] bg-white/70">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-12 md:grid-cols-3">
            {[
              ['What', 'A wealth and health wellness program that matches users to strategy areas before asking them to buy implementation help.'],
              ['Why', 'The Four Horsemen and the Lightning quietly create avoidable pressure. RPRx gives people a clearer path to reduce and recover.'],
              ['How', 'Simple assessments create a personalized roadmap, then membership unlocks the library, guides, calculators, AI advisor, and partner pathways.'],
            ].map(([label, text]) => (
              <div key={label} className="rounded-3xl border border-[#d8cbb6] bg-[#fbfaf7] p-6 shadow-sm">
                <span className="mb-4 inline-flex rounded-full bg-[#172033] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">{label}</span>
                <p className="text-lg leading-8 text-[#4a5566]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="paths" className="mx-auto max-w-7xl px-5 py-16">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#8a5d14]">Choose your path</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] md:text-5xl">Where do you want to start?</h2>
            <p className="mt-4 text-lg leading-8 text-[#5b6475]">Both assessments are free. Sign in so your results, saved plans, and edits are waiting when you come back.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.eyebrow} className="rounded-[2rem] border border-[#d7cab5] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#172033] text-white">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="mb-3 text-sm font-black uppercase tracking-[0.26em] text-[#8a5d14]">{card.eyebrow}</p>
                  <h3 className="mb-4 text-3xl font-black leading-tight tracking-[-0.03em]">{card.title}</h3>
                  <p className="mb-6 text-lg leading-8 text-[#596476]">{card.copy}</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link to={card.href}>
                      <Button className="bg-[#172033] text-white hover:bg-[#273248]">
                        {card.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <span className="text-sm font-semibold text-[#697386]">{card.meta}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-[#172033] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-200">How it works</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.03em]">Three steps from assessment to action.</h2>
              <ol className="mt-8 space-y-4">
                {howItWorks.map((step, index) => (
                  <li key={step} className="flex gap-4 rounded-2xl bg-white/10 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#172033]">{index + 1}</span>
                    <span className="text-lg leading-7 text-white/85">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div id="membership" className="rounded-[2rem] border border-white/10 bg-white p-7 text-[#172033] shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-[#172033] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">Membership</span>
                <span className="text-3xl font-black">$97<span className="text-base font-semibold text-[#687386]">/mo</span></span>
              </div>
              <h3 className="text-3xl font-black tracking-[-0.03em]">Unlock the tools to implement what your results reveal.</h3>
              <div className="mt-6 space-y-3">
                {memberBenefits.map((benefit) => (
                  <div key={benefit} className="flex gap-3 text-[#4d596b]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2e7d5c]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              <Link to="/join" className="mt-7 inline-block">
                <Button size="lg" className="bg-[#172033] text-white hover:bg-[#273248]">See membership options</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 md:grid-cols-3">
          <div className="rounded-3xl border border-[#d7cab5] bg-white p-6">
            <Shield className="mb-4 h-8 w-8 text-[#172033]" />
            <h3 className="text-xl font-black">No financial statements required</h3>
            <p className="mt-2 text-[#5b6475]">The first step is directional matching, not intrusive data collection.</p>
          </div>
          <div className="rounded-3xl border border-[#d7cab5] bg-white p-6">
            <Stethoscope className="mb-4 h-8 w-8 text-[#172033]" />
            <h3 className="text-xl font-black">No medical diagnosis</h3>
            <p className="mt-2 text-[#5b6475]">RPRx is an education and wellness resource, not medical advice.</p>
          </div>
          <div className="rounded-3xl border border-[#d7cab5] bg-white p-6">
            <Sparkles className="mb-4 h-8 w-8 text-[#172033]" />
            <h3 className="text-xl font-black">One profile, both sides</h3>
            <p className="mt-2 text-[#5b6475]">Your assessments, plans, library resources, and advisor pathways stay together.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#ded3bf] bg-[#fbfaf7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#697386] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} RPRx. Financial and physical wellness education.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/old-home">Old home page</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
