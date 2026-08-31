import { NETLIFY_ASSESSMENT_DATA } from './generated/netlifyAssessmentData';
import type { AnswerMap, AssessmentQuestion, AssessmentSection, FinancialTheme } from './types';
import { matchFinancialThemes, partitionResults } from './ruleEngine';

export const financialSections = NETLIFY_ASSESSMENT_DATA.FIN.SECTIONS as unknown as AssessmentSection[];
export const financialQuestions = NETLIFY_ASSESSMENT_DATA.FIN.QUESTIONS as unknown as AssessmentQuestion[];
export const financialThemes = NETLIFY_ASSESSMENT_DATA.FIN.THEMES as unknown as FinancialTheme[];
export const financialPillars = NETLIFY_ASSESSMENT_DATA.FIN.PILLARS;

export function getFinancialMatches(answers: AnswerMap) {
  return matchFinancialThemes(financialThemes, answers);
}

export function getFinancialResultPartition(answers: AnswerMap, freeCount?: number) {
  return partitionResults(getFinancialMatches(answers), freeCount);
}

export const financialAssessmentMeta = {
  id: 'fin',
  label: 'Financial Success Assessment',
  eyebrow: 'Wealth Assessment',
  disclaimer:
    'Educational only. RPRx helps you identify areas to discuss with qualified tax, legal, insurance, education, and financial professionals.',
  sectionCount: financialSections.length,
  questionCount: financialQuestions.length,
  themeCount: financialThemes.length,
  strategyCount: financialThemes.reduce((total, theme) => total + (theme.tactics?.length ?? 0), 0),
};
