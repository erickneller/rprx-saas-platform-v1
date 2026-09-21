import { useEffect } from "react";
import {
  Receipt,
  Landmark,
  ShieldPlus,
  GraduationCap,
  CheckCircle2,
  Lock,
  FileCheck,
  Phone,
  Trophy,
  Palmtree,
  Sparkles,
  Users,
  Briefcase,
  Heart,
  Video,
  Bot,
  Star,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import W2Nav from "@/components/w2/W2Nav";
import heroImg from "@/assets/w2-hero.jpg";
import {
  CHECKOUT_ANNUAL_URL,
  CHECKOUT_MONTHLY_URL,
  MEMBER_LOGIN_URL,
} from "@/lib/w2Config";
import { RPRX_FULL_IMPLEMENTATION_PAYMENT_URL } from "@/lib/rprxPaymentLinks";

const ANNUAL_CTA = "Join RPRx Membership — $97/month";

const horsemen = [
  {
    icon: Receipt,
    title: "Taxes",
    stat: "Thousands overpaid every year",
    body: "The IRS takes its cut before you ever touch your paycheck. Most W2 employees overpay by thousands every year — not because they cheated, but because nobody showed them the legal strategies hiding in plain sight in the tax code.",
    quote: "When is the last time your CPA called YOU with a new strategy to save money?",
  },
  {
    icon: Landmark,
    title: "Interest",
    stat: "$300,000+ in mortgage interest",
    body: "You will pay your bank more in interest than the original price of your home. On a $400,000 30-year mortgage, you hand the bank over $300,000 in interest alone. They have the nicest buildings in every city for a reason.",
    quote: "Notice any new bank buildings going up in your area lately?",
  },
  {
    icon: ShieldPlus,
    title: "Insurance",
    stat: "$36,000/yr family premiums",
    body: "ACA health insurance premiums for a family of four average $36,000 per year — and that number is directly tied to your taxable income. Lower your income, lower your premiums. Most W2 employees have no idea this lever exists.",
  },
  {
    icon: GraduationCap,
    title: "Education",
    stat: "$120,000+ per degree",
    body: "The average cost of a 4-year college degree now exceeds $120,000. The financial aid formula is based on your income and assets — and traditional tax advice is often in direct conflict with maximizing your aid eligibility.",
  },
];

const comparison: [string, string, string][] = [
  ["Tax Strategy", "File and pray", "Proactive, year-round"],
  ["Mortgage", "30 years", "Paid off in ~10 years"],
  ["Health Insurance", "Full price", "Reduced via income planning"],
  ["College Funding", "529 and hope", "Financial aid optimized"],
  ["Tax Credits", "$0 additional", "$2,000 minimum, day one"],
  ["Business Income", "None", "Referral commissions"],
];

const benefits = [
  {
    icon: FileCheck,
    title: "The $2,000 Tax Credit (K1)",
    headline: "Your Membership Pays For Itself Immediately",
    body: "Via our K1 partnership, members can receive tax-credit documentation that they review with their CPA or the RPRx filing service. Need more? Members in good standing can upgrade to Silver, Gold, Platinum, or Diamond tiers for additional credits at any time.",
  },
  {
    icon: Landmark,
    title: "Equity Recapture",
    headline: "Stop Giving Your Bank $300,000 In Interest",
    body: "Our Equity Recapture method shows you exactly how to apply your tax savings to your mortgage — cutting a 30-year loan down to approximately 10 years and saving hundreds of thousands in interest. On a $600,000 loan at 9.3%, adding $3,000/month in savings pays it off in 9 years and saves $655,000 in interest.",
  },
  {
    icon: GraduationCap,
    title: "College Aid Optimization",
    headline: "The IRS Can Help Pay For Your Kids' College",
    body: "Most families leave tens of thousands in financial aid on the table because their traditional tax advice works against them. The financial aid formula is based on your income and assets — RPRx shows you how to position both to maximize what your family receives.",
  },
  {
    icon: Heart,
    title: "Health Premium Reduction",
    headline: "Lower Your Income. Lower Your Premiums.",
    body: "ACA health insurance premiums are income-based. By lowering your taxable income through your RPRx partnership, you may qualify for significantly lower monthly premiums — potentially saving $3,000–$6,000 or more per year for a family.",
  },
  {
    icon: ShieldPlus,
    title: "Life Insurance Like The Wealthy Use It",
    headline: "Stop Using Life Insurance Like A W2 Employee",
    body: "The wealthy don't use life insurance just for death benefits. They use it as a tax-free savings vehicle, a loan source, and a retirement income tool — with no contribution limits, no government involvement, and no double taxation at death. RPRx shows you exactly how.",
  },
  {
    icon: Bot,
    title: "RPRx Virtual Advisor",
    headline: "24/7 Access To Expert Guidance",
    body: "Your RPRx Virtual Advisor is an AI-powered financial guidance system trained on Rick Darvis's complete library of over 2,000 tax and financial strategies. Available by voice, 24 hours a day, 7 days a week. Ask anything. Get answers immediately.",
  },
  {
    icon: Video,
    title: "Ongoing Education",
    headline: "2–4 New Videos Every Month",
    body: "New video content released 2–4 times per month covering tax updates, financial strategies, real examples, and implementation guides — all designed specifically for W2 employees and presented in plain language.",
  },
  {
    icon: Phone,
    title: "1 Free Advisor Consultation",
    headline: "A Real Expert In Your Corner",
    body: "Every member receives one complimentary 30-minute consultation with an RPRx Advisor who can review your specific situation, identify your biggest savings opportunities, and point you toward the right strategies for your household.",
  },
  {
    icon: Palmtree,
    title: "Best Beach Giveaway",
    headline: "Quarterly Siesta Key Vacation Drawing",
    body: "Every member is automatically entered into our quarterly Best Beach giveaway — a 4-day, 3-night Siesta Key beach vacation for two. Earn additional entries for every RPRx Member you refer who joins.",
  },
  {
    icon: Users,
    title: "Referral Program",
    headline: "Refer Members. Earn 20% Recurring.",
    body: "Refer another member who joins and you earn 20% of their membership fee — every month they stay active. Refer 5 people and your membership is essentially free. Refer 10 and you are making money. That referral income is business income — which means you now have a business — which means you now qualify for business tax deductions you didn't have yesterday.",
  },
];

const upgradeTiers = [
  { name: "Silver", credits: "$3,000", price: "$1,497", net: "$1,503" },
  { name: "Gold", credits: "$7,500", price: "$2,997", net: "$4,503" },
  { name: "Platinum", credits: "$15,000", price: "$4,997", net: "$10,003" },
  { name: "Diamond", credits: "$30,000", price: "$8,997", net: "$21,003" },
];

const testimonials = [
  {
    quote:
      "Nothing we have ever added to our practice has been so well received, or expanded our practice so rapidly. It is the best purchase we have made in years.",
    name: "Kriss Mann, CPA",
    title: "Glendale, CA",
  },
  {
    quote:
      "The impact of your presentation was tremendous. You gave our community important exposure to a topic that is inadequately discussed and yet so relevant to the education and financial planning concerns of our clients.",
    name: "Mark Reich, CPA, CFP",
    title: "New York, NY · NAPFA Conference Committee Member",
  },
  {
    quote:
      "This was a significant wake up call for many of us. After this session I discussed these issues with at least a dozen of my own clients, resulting in scheduled planning meetings before year end.",
    name: "Ken Williams, CPA",
    title: "Brady, Martz and Associates",
  },
  {
    quote:
      "Rick Darvis put together an effective and result-oriented approach to financing a college education. His expertise has enabled my family to save thousands of dollars. No family can afford to plan for college without the guidance that Rick provides.",
    name: "Brian A. Schofield, M.D.",
    title: "Asst. Clinical Professor, Florida State University",
  },
  {
    quote:
      "I arrived at the workshop as a general practitioner CPA and left with a blueprint to become a specialist in college planning, cash flow planning, and debt reduction. No stone was left unturned. This can change your life.",
    name: "Peter J. Marchiano Jr., CPA, CCPS",
    title: "Bayville, NJ",
  },
];

const faqs = [
  {
    q: "What exactly is the $2,000 tax credit and how does it work?",
    a: "You become a member of our K1 partnership. You receive K1/tax-credit documentation to review with your CPA or with the RPRx filing service at tax time.",
  },
  {
    q: "Is this legal?",
    a: "Absolutely. K1 partnerships are a standard IRS-recognized tax structure used by millions of Americans. This is the same mechanism used by business partners, real estate investors, and limited partnership members across the country. Rick Darvis is a licensed CPA with over 30 years of experience in tax strategy and compliance.",
  },
  {
    q: "What if I already have a CPA?",
    a: "Your RPRx membership works alongside your existing CPA. You simply provide them with your K1 at tax time. Many CPAs are unfamiliar with the full scope of strategies available — the RPRx system complements what they do, it doesn't replace them. We also offer our own filing service if you prefer.",
  },
  {
    q: "What if I need more than $2,000 in credits?",
    a: "Members in good standing can upgrade to Silver, Gold, Platinum, or Diamond tiers at any time for additional tax credits. Your RPRx Virtual Advisor or a complimentary consultation with an RPRx Advisor can help you determine the right tier for your tax situation.",
  },
  {
    q: "I'm not a business owner. Will this actually work for me?",
    a: "Yes — this program was built specifically for W2 employees. The partnership structure gives you access to business-level tax benefits without requiring you to own a traditional business. Additionally, our referral program generates commission income that itself creates legitimate business activity for you.",
  },
  {
    q: "How does the referral commission work?",
    a: "When someone joins RPRx using your unique referral link, you earn 20% of their membership fee for as long as they remain a member. Commissions are tracked automatically and paid monthly. Refer 5 active members on monthly plans and your membership is effectively free.",
  },
  {
    q: "What if I just want to start monthly?",
    a: "Monthly membership includes the public RPRx member benefits and gives you the path to implementation support. Full done-for-you implementation is available separately for members who want tax filing support handled for them.",
  },
];

function PrimaryCta({ children = ANNUAL_CTA }: { children?: React.ReactNode }) {
  return (
    <a
      href={CHECKOUT_ANNUAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--w2-gold))] px-7 py-4 text-base font-bold text-[hsl(var(--w2-navy))] shadow-[0_10px_30px_-10px_hsl(var(--w2-gold)/0.6)] transition-all hover:-translate-y-0.5 hover:bg-[hsl(var(--w2-gold-soft))] hover:shadow-[0_20px_40px_-15px_hsl(var(--w2-gold)/0.7)]"
    >
      {children} →
    </a>
  );
}

export default function RprxW2() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title =
      "RPRx Member Program for W2 Employees | $97/month";

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    const desc =
      "W2 employees: access tax, mortgage, insurance and college strategies built by CPA Rick Darvis through RPRx Membership at $97/month.";
    const created: HTMLElement[] = [];
    created.push(setMeta("description", desc));
    created.push(setMeta("og:title", "RPRx Member Program for W2 Employees", "property"));
    created.push(setMeta("og:description", desc, "property"));
    created.push(setMeta("og:type", "website", "property"));

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const createdCanonical = !canonical;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const prevHref = canonical.href;
    canonical.href = `${window.location.origin}/rprx-w2`;

    return () => {
      document.title = prevTitle;
      if (createdCanonical) canonical?.remove();
      else if (canonical) canonical.href = prevHref;
    };
  }, []);

  return (
    <div
      id="top"
      className="min-h-screen bg-white text-[hsl(var(--w2-ink))] [--w2-navy:218_55%_14%] [--w2-navy-soft:218_40%_22%] [--w2-gold:42_78%_52%] [--w2-gold-soft:42_90%_65%] [--w2-cream:40_30%_97%] [--w2-ink:220_20%_12%]"
    >
      <W2Nav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-[hsl(var(--w2-cream))]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--w2-gold))]">
              For W2 Employees Tired of Paying More and Keeping Less
            </p>
            <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-[hsl(var(--w2-navy))] sm:text-5xl lg:text-6xl">
              Your employer takes your taxes before you see your paycheck. Your CPA files what happened.{" "}
              <span className="text-[hsl(var(--w2-gold))]">Nobody is actually fighting for you.</span>
            </h1>
            <p className="mt-6 text-lg text-[hsl(var(--w2-ink))]/80 sm:text-xl">
              The RPRx Member Program gives W2 employees access to the same tax strategies wealthy business
              owners have used for decades — starting with a{" "}
              <strong className="text-[hsl(var(--w2-navy))]">member tax-strategy resources and implementation support</strong>{" "}
              after joining.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3">
              <PrimaryCta />
              <a
                href={CHECKOUT_MONTHLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[hsl(var(--w2-navy))] underline-offset-4 hover:underline"
              >
                Start RPRx Membership at $97/month
              </a>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-[hsl(var(--w2-ink))]/80">
              {[
                "Tax-strategy resources unlocked after checkout",
                "30-minute setup",
                "Cancel anytime",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--w2-gold))]" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5">
              <img
                src={heroImg}
                alt="A W2 employee stressed at their desk on the left, then relaxed at home with family on the right"
                width={1600}
                height={896}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 hidden rounded-xl bg-[hsl(var(--w2-navy))] px-5 py-3 text-white shadow-xl sm:block">
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--w2-gold))]">Member Path</p>
              <p className="font-serif text-2xl font-bold">$97/mo</p>
            </div>
          </div>
        </div>

        {/* Social proof bar */}
        <div className="border-y border-[hsl(var(--w2-navy))]/10 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-[hsl(var(--w2-ink))]/70">
              Rick Darvis has trained financial professionals in over 40 states and been quoted in{" "}
              <span className="font-semibold text-[hsl(var(--w2-navy))]">
                Forbes, The Wall Street Journal, Newsweek, Kiplinger's, Bloomberg
              </span>{" "}
              and The New York Times.
            </p>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-3xl text-center font-serif text-3xl font-bold leading-tight text-[hsl(var(--w2-navy))] sm:text-4xl">
            Here's what's actually happening to your money every single month
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {horsemen.map((h) => {
              const Icon = h.icon;
              return (
                <div
                  key={h.title}
                  className="flex flex-col rounded-2xl border border-[hsl(var(--w2-navy))]/10 bg-[hsl(var(--w2-cream))] p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--w2-navy))] text-[hsl(var(--w2-gold))]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[hsl(var(--w2-navy))]">{h.title}</h3>
                  <p className="mt-1 text-sm font-bold text-[hsl(var(--w2-gold))]">{h.stat}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--w2-ink))]/80">{h.body}</p>
                  {h.quote && (
                    <p className="mt-4 border-l-2 border-[hsl(var(--w2-gold))] pl-3 text-sm italic text-[hsl(var(--w2-ink))]/70">
                      {h.quote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-14 max-w-3xl rounded-2xl bg-[hsl(var(--w2-navy))] p-8 text-white sm:p-10">
            <ul className="space-y-3 text-base">
              <li>
                <span className="mr-2 text-[hsl(var(--w2-gold))]">✕</span>
                Only <strong>22%</strong> of Americans feel they will have enough money to retire comfortably
              </li>
              <li>
                <span className="mr-2 text-[hsl(var(--w2-gold))]">✕</span>
                <strong>57%</strong> of people already retired have less than $250,000 saved
              </li>
              <li>
                <span className="mr-2 text-[hsl(var(--w2-gold))]">✕</span>
                The average W2 employee loses <strong>$30,000–$50,000 per year</strong> across these four
                categories — with no strategy to fight back
              </li>
            </ul>
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-lg text-[hsl(var(--w2-ink))]/80">
            This is not a budgeting problem. This is a <strong>strategy</strong> problem. And the strategy has
            existed for decades — it just wasn't available to you. <em>Until now.</em>
          </p>
        </div>
      </section>

      {/* ROOT CAUSE */}
      <section className="bg-[hsl(var(--w2-cream))] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-4xl text-center font-serif text-3xl font-bold leading-tight text-[hsl(var(--w2-navy))] sm:text-4xl">
            The real problem isn't how much you make. It's that you're playing the game with one hand tied
            behind your back.
          </h2>
          <div className="mx-auto mt-10 max-w-3xl space-y-5 text-lg text-[hsl(var(--w2-ink))]/85">
            <p>
              Business owners have access to hundreds of legal tax strategies that W2 employees simply cannot
              access on their own. They hire their kids. They deduct their home office. They own their own
              insurance company. They write off vehicles, meals, equipment, and education.
            </p>
            <p>You've been told there's nothing you can do because you don't own a business.</p>
            <p className="font-semibold text-[hsl(var(--w2-navy))]">That's about to change.</p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-[hsl(var(--w2-navy))]/10 bg-white shadow-sm">
            <table className="w-full text-left text-sm sm:text-base">
              <thead className="bg-[hsl(var(--w2-navy))] text-white">
                <tr>
                  <th className="px-4 py-4 sm:px-6">Category</th>
                  <th className="px-4 py-4 sm:px-6">Typical W2 Employee</th>
                  <th className="px-4 py-4 sm:px-6 text-[hsl(var(--w2-gold))]">RPRx Member</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(([k, a, b], i) => (
                  <tr key={k} className={i % 2 ? "bg-[hsl(var(--w2-cream))]/40" : ""}>
                    <td className="px-4 py-4 font-semibold text-[hsl(var(--w2-navy))] sm:px-6">{k}</td>
                    <td className="px-4 py-4 text-[hsl(var(--w2-ink))]/70 sm:px-6">{a}</td>
                    <td className="px-4 py-4 font-medium text-[hsl(var(--w2-navy))] sm:px-6">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--w2-gold))]">
            Introducing
          </p>
          <h2 className="mt-3 text-center font-serif text-3xl font-bold leading-tight text-[hsl(var(--w2-navy))] sm:text-4xl">
            The RPRx Member Program — the simplest way for W2 employees to start keeping more of what they earn
          </h2>
          <div className="mx-auto mt-8 max-w-3xl space-y-5 text-lg text-[hsl(var(--w2-ink))]/85">
            <p>
              The RPRx Member Program is a <strong>$97/month</strong> membership
              that gives you access to the tax strategies, financial tools, and expert guidance that have previously
              only been available to wealthy business owners and high-income professionals.
            </p>
            <p>
              It was built by Rick Darvis — CPA, national tax strategist, and one of the most quoted financial
              experts in America — specifically to give everyday W2 employees a fighting chance.
            </p>
            <p>No complicated setup. No confusing financial jargon. No expensive advisor fees upfront.</p>
            <p className="font-semibold text-[hsl(var(--w2-navy))]">
              You join. You complete onboarding. Your member resources and next-step implementation path unlock after checkout.
              You are ahead before you watch a single video.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border-l-4 border-[hsl(var(--w2-gold))] bg-[hsl(var(--w2-cream))] p-8">
            <h3 className="font-serif text-2xl font-bold text-[hsl(var(--w2-navy))]">
              Rick Darvis, CPA, CCPS
            </h3>
            <p className="mt-3 text-[hsl(var(--w2-ink))]/85">
              Author of multiple nationally published books on tax and college planning. Featured speaker at state
              CPA conferences in over 40 states. Quoted in Forbes, The Wall Street Journal, Newsweek, U.S. News &amp;
              World Report, Kiplinger's Personal Finance, Bloomberg, and more. Founder of a national financial
              planning network with over 2,000 members.
            </p>
            <p className="mt-4 italic text-[hsl(var(--w2-ink))]/70">
              "He has the expertise and tools that financial advisors have been waiting for." — Troy Onink, CCPS
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="scroll-mt-16 bg-[hsl(var(--w2-navy))] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-3xl text-center font-serif text-3xl font-bold leading-tight sm:text-4xl">
            Three steps. About 30 minutes. <span className="text-[hsl(var(--w2-gold))]">RPRx</span> resources unlocked for members.
          </h2>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "1",
                t: "Join",
                b: "Join the $97/month RPRx Membership. Complete your membership agreement and certification in about 30 minutes, then use the portal to coordinate next tax-strategy steps with qualified professionals.",
              },
              {
                n: "2",
                t: "Get Your K1",
                b: "Your $2,000 tax credit K1 is prepared and delivered directly to you. Hand it to your CPA or use it with our RPRx filing service at tax time. It applies directly to your return — dollar for dollar.",
              },
              {
                n: "3",
                t: "Start Learning & Saving",
                b: "Access your member portal, your RPRx Virtual Advisor (available 24/7 by voice), and your growing library of financial strategies designed specifically for W2 employees.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--w2-gold))] font-serif text-xl font-bold text-[hsl(var(--w2-navy))]">
                  {s.n}
                </div>
                <h3 className="font-serif text-xl font-bold">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{s.b}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-2xl bg-[hsl(var(--w2-gold))] p-8 text-[hsl(var(--w2-navy))] shadow-2xl">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> The math is simple
            </p>
            <ul className="mt-4 space-y-1 font-serif text-lg sm:text-xl">
              <li>RPRx Membership = <strong>$97/month</strong></li>
              <li>Strategy review and implementation resources unlocked for members</li>
              <li className="border-t border-[hsl(var(--w2-navy))]/20 pt-2">
                Next step = <strong>member implementation support</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="what" className="scroll-mt-16 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-3xl text-center font-serif text-3xl font-bold leading-tight text-[hsl(var(--w2-navy))] sm:text-4xl">
            Everything included in your RPRx membership
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="flex gap-5 rounded-2xl border border-[hsl(var(--w2-navy))]/10 bg-[hsl(var(--w2-cream))] p-6 transition-shadow hover:shadow-md"
                >
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--w2-navy))] text-[hsl(var(--w2-gold))]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--w2-gold))]">
                      {b.title}
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-bold text-[hsl(var(--w2-navy))]">
                      {b.headline}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--w2-ink))]/80">{b.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upgrade Tiers */}
          <div className="mt-14 rounded-2xl border-2 border-[hsl(var(--w2-gold))]/40 bg-gradient-to-br from-[hsl(var(--w2-cream))] to-white p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--w2-gold))]">
              Income Broker Upgrade Tiers
            </p>
            <h3 className="mt-2 font-serif text-2xl font-bold text-[hsl(var(--w2-navy))]">
              Need more than $2,000 in credits?
            </h3>
            <p className="mt-2 text-[hsl(var(--w2-ink))]/80">
              Members in good standing can upgrade their Income Broker tier at any time:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {upgradeTiers.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-[hsl(var(--w2-navy))]/10 bg-white p-5 text-center"
                >
                  <p className="font-serif text-lg font-bold text-[hsl(var(--w2-navy))]">{t.name}</p>
                  <p className="mt-2 text-sm text-[hsl(var(--w2-ink))]/70">+{t.credits} credits</p>
                  <p className="text-sm text-[hsl(var(--w2-ink))]/70">for {t.price}</p>
                  <p className="mt-3 rounded-md bg-[hsl(var(--w2-gold))]/15 py-2 text-sm font-bold text-[hsl(var(--w2-navy))]">
                    Net gain: {t.net}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-[hsl(var(--w2-cream))] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-3xl text-center font-serif text-3xl font-bold leading-tight text-[hsl(var(--w2-navy))] sm:text-4xl">
            What financial professionals say about Rick Darvis and the RPRx system
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex h-full flex-col rounded-2xl border-l-4 border-[hsl(var(--w2-gold))] bg-white p-6 shadow-sm"
              >
                <div className="mb-2 flex gap-0.5 text-[hsl(var(--w2-gold))]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="flex-1 italic text-[hsl(var(--w2-ink))]/85">"{t.quote}"</blockquote>
                <figcaption className="mt-4">
                  <p className="font-bold text-[hsl(var(--w2-navy))]">{t.name}</p>
                  <p className="text-sm text-[hsl(var(--w2-ink))]/60">{t.title}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[hsl(var(--w2-ink))]/70">
            <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Secure Checkout</span>
            <span className="flex items-center gap-2"><FileCheck className="h-4 w-4" /> IRS-Compliant K1</span>
            <span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> 30+ Years of Proven Results</span>
            <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> 24/7 Virtual Advisor Access</span>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-16 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-3xl text-center font-serif text-3xl font-bold leading-tight text-[hsl(var(--w2-navy))] sm:text-4xl">
            Choose your RPRx path
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {/* Monthly */}
            <div className="flex flex-col rounded-2xl border border-[hsl(var(--w2-navy))]/15 bg-white p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--w2-ink))]/60">
                RPRx Member — Monthly
              </p>
              <p className="mt-3 font-serif text-5xl font-bold text-[hsl(var(--w2-navy))]">
                $97<span className="text-base font-normal text-[hsl(var(--w2-ink))]/60">/month</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-[hsl(var(--w2-ink))]/85">
                {[
                  "$2,000 tax credit K1 at year-end filing",
                  "All member benefits included",
                  "Cancel anytime",
                  "Use member resources to prepare for tax-professional review",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--w2-gold))]" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <a
                href={CHECKOUT_MONTHLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center justify-center rounded-full border-2 border-[hsl(var(--w2-navy))] px-6 py-3 text-sm font-bold text-[hsl(var(--w2-navy))] transition-colors hover:bg-[hsl(var(--w2-navy))] hover:text-white"
              >
                Start Monthly
              </a>
            </div>

            {/* Full implementation */}
            <div className="relative flex flex-col rounded-2xl border-2 border-[hsl(var(--w2-gold))] bg-gradient-to-br from-white to-[hsl(var(--w2-cream))] p-8 shadow-xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(var(--w2-gold))] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[hsl(var(--w2-navy))]">
                ⭐ Best Value
              </span>
              <p className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--w2-gold))]">
                Full Done For You Support
              </p>
              <p className="mt-3 font-serif text-5xl font-bold text-[hsl(var(--w2-navy))]">
                $5,997<span className="text-base font-normal text-[hsl(var(--w2-ink))]/60"> one-time</span>
              </p>
              <p className="text-sm text-[hsl(var(--w2-ink))]/60">Complete RPRx Implementation and Tax Filing</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-[hsl(var(--w2-ink))]/85">
                {[
                  "Full done-for-you implementation support",
                  "All member benefits included",
                  "Tax filing support included",
                  "Customer-facing implementation handoff",
                  "Uses the approved RPRx full implementation checkout",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--w2-gold))]" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-lg bg-[hsl(var(--w2-navy))] p-4 text-center text-sm text-white">
                You can choose self-guided membership or full implementation support.
                <br />
                <strong className="text-[hsl(var(--w2-gold))]">Full implementation checkout: $5,997 one-time.</strong>
              </p>
              <a
                href={RPRX_FULL_IMPLEMENTATION_PAYMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[hsl(var(--w2-gold))] px-6 py-3 text-sm font-bold text-[hsl(var(--w2-navy))] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[hsl(var(--w2-gold-soft))]"
              >
                Start Full Implementation →
              </a>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-base text-[hsl(var(--w2-ink))]/80">
            Start with the $97/month membership, or choose the full done-for-you implementation path if you want filing support included.
          </p>
        </div>
      </section>

      {/* RISK REVERSAL */}
      <section className="bg-[hsl(var(--w2-cream))] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-bold leading-tight text-[hsl(var(--w2-navy))] sm:text-4xl">
            The risk is not joining. The risk is another year without a strategy.
          </h2>
          <div className="mt-8 space-y-4 text-left text-lg text-[hsl(var(--w2-ink))]/85 sm:text-center">
            <p>
              Every year you don't have a tax strategy is a year you overpay the IRS, overpay your bank, and leave
              financial aid on the table.
            </p>
            <p>
              At <strong>$97/month</strong>, the RPRx Member Program gives members access to RPRx implementation resources, strategy education, and next-step support.
            </p>
            <p>
              If for any reason you feel the program is not right for you within your first 30 days, contact us and
              we will make it right.
            </p>
          </div>
          <div className="mt-10 inline-flex items-center gap-3 rounded-2xl border-2 border-[hsl(var(--w2-gold))] bg-white px-6 py-5 text-left shadow-sm">
            <Briefcase className="h-10 w-10 shrink-0 text-[hsl(var(--w2-gold))]" />
            <div>
              <p className="font-serif text-lg font-bold text-[hsl(var(--w2-navy))]">
                30-Day Satisfaction Guarantee
              </p>
              <p className="text-sm text-[hsl(var(--w2-ink))]/75">
                Complete onboarding, review your K1, access the portal — if it isn't delivering value, contact us
                within 30 days and we'll work with you to make it right.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-3xl font-bold leading-tight text-[hsl(var(--w2-navy))] sm:text-4xl">
            Questions we hear most often
          </h2>
          <Accordion type="single" collapsible className="mt-10 w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-[hsl(var(--w2-navy))]/10">
                <AccordionTrigger className="text-left font-serif text-lg text-[hsl(var(--w2-navy))] hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[hsl(var(--w2-ink))]/80">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[hsl(var(--w2-navy))] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Every day you wait is another day the IRS, the bank, and the insurance company{" "}
            <span className="text-[hsl(var(--w2-gold))]">win</span>.
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-4 text-lg text-white/85">
            <p>You work too hard to keep giving it away.</p>
            <p>
              The RPRx Member Program exists because W2 employees deserve the same strategies that wealthy
              business owners have used for decades.
            </p>
            <p className="font-semibold text-white">
              $97/month. 30-minute setup. RPRx implementation resources unlocked for members.
            </p>
          </div>
          <div className="mt-10 flex flex-col items-center gap-3">
            <PrimaryCta />
            <a
              href={CHECKOUT_MONTHLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              Start RPRx Membership at $97/month
            </a>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secure Checkout</span>
            <span className="flex items-center gap-1.5"><FileCheck className="h-3.5 w-3.5" /> IRS-Compliant K1</span>
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> 24/7 Virtual Advisor</span>
            <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> 30+ Years Proven</span>
            <span className="flex items-center gap-1.5"><Palmtree className="h-3.5 w-3.5" /> Best Beach Giveaway</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[hsl(var(--w2-navy)/0.97)] py-12 text-white/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-center">
            <div className="flex items-center gap-2 font-serif text-base font-bold text-white">
              <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--w2-gold))]" />
              RPRx Member Program
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="mailto:support@rprx4life.com" className="hover:text-white">Contact</a>
              <a href={MEMBER_LOGIN_URL} className="hover:text-white">Member Login</a>
            </div>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-white/55">
            Disclaimer: Tax results vary by individual situation. RPRx Member Program members receive K1
            documentation prepared in accordance with IRS regulations. Consult with a qualified tax professional
            regarding your specific tax situation. Rick Darvis CPA.
          </p>
          <p className="mt-4 text-xs text-white/50">
            © RPRx {new Date().getFullYear()} · All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
