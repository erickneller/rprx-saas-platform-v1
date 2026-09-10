import type { HorsemanType } from './scoringEngine';

export interface FeedbackContent {
  title: string;
  intro: string;
  whatItMeans: string;
  whyItMatters: string;
}

const feedbackTemplates: Record<HorsemanType, FeedbackContent> = {
  interest: {
    title: 'Your Primary Pressure: Interest & Debt',
    intro:
      'Your assessment indicates that debt-related costs are creating the most significant pressure on your wealth picture. This is common when payments accumulate across multiple accounts, each quietly consuming resources through interest charges.',
    whatItMeans:
      'When debt payments command a large portion of income, less remains for building stability or responding to unexpected needs. The compounding nature of interest means this pressure can grow over time if not addressed systematically.',
    whyItMatters:
      'Interest costs interact with your other financial areas. Debt pressure can limit your ability to optimize taxes, maintain appropriate insurance coverage, or save for education goals.',
  },
  taxes: {
    title: 'Your Primary Pressure: Tax Efficiency',
    intro:
      'Your assessment suggests that tax-related awareness is an area where attention could yield meaningful improvements. This is particularly relevant when income changes or life circumstances evolve without corresponding adjustments to tax planning.',
    whatItMeans:
      'Without proactive awareness, tax obligations can take more than necessary from your income. Small inefficiencies accumulate over years, representing significant unrealized resources.',
    whyItMatters:
      'Tax efficiency affects how much remains for debt management, insurance costs, and savings goals. Clarity here creates ripple effects across your entire wealth picture.',
  },
  insurance: {
    title: 'Your Primary Pressure: Insurance Costs',
    intro:
      'Your assessment indicates that insurance costs and coverage alignment represent your most significant pressure area. This often develops gradually as policies accumulate without regular review or coordination.',
    whatItMeans:
      'Insurance is essential protection, but misaligned coverage—either gaps or redundancies—creates unnecessary financial drag. Premiums paid for unneeded coverage are resources that could serve you elsewhere.',
    whyItMatters:
      'Insurance costs affect your monthly cash flow, which influences your ability to manage debt, save for education, and optimize your overall financial efficiency.',
  },
  education: {
    title: 'Your Primary Pressure: Education Funding',
    intro:
      'Your assessment shows that education-related costs—current or future—are creating the most significant pressure on your financial outlook. This is common when education needs are approaching without a clear funding pathway.',
    whatItMeans:
      'Education costs continue to rise faster than general inflation, creating a moving target for planning. Without awareness and structured preparation, these costs often require last-minute borrowing, which compounds pressure in other areas.',
    whyItMatters:
      'Education funding pressure can influence decisions about debt, tax strategies, and how you allocate resources across all financial priorities.',
  },
};

export function getFeedback(primaryHorseman: HorsemanType): FeedbackContent {
  return feedbackTemplates[primaryHorseman];
}

export const compoundingExplanation = {
  title: 'How These Pressures Interact',
  content: `The Four Horsemen—Interest, Taxes, Insurance, and Education costs—don't exist in isolation. They compound and interact:

• Debt pressure can limit funds available for tax-efficient savings
• Tax inefficiency reduces resources for managing other costs
• Uncoordinated insurance creates cash flow drain affecting all areas
• Education funding gaps often lead to future debt, restarting the cycle

Understanding which area to address first creates clarity and prevents scattered efforts that rarely produce lasting change.`,
};
