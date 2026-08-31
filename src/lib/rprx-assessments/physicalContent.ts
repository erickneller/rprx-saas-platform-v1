import { NETLIFY_ASSESSMENT_DATA } from './generated/netlifyAssessmentData';
import type { AnswerMap, AssessmentQuestion, AssessmentSection, PhysicalSolution } from './types';
import { matchPhysicalTopics, partitionResults, passedPhysicalTopics } from './ruleEngine';

export const physicalSections = NETLIFY_ASSESSMENT_DATA.PHYS.SECTIONS as unknown as AssessmentSection[];
export const physicalQuestions = NETLIFY_ASSESSMENT_DATA.PHYS.QUESTIONS as unknown as AssessmentQuestion[];
export const physicalSolutions = NETLIFY_ASSESSMENT_DATA.PHYS.SOLUTIONS as unknown as Record<string, PhysicalSolution[]>;
export const physicalInfo = NETLIFY_ASSESSMENT_DATA.PHYS.INFO;

export function getPhysicalMatches(answers: AnswerMap) {
  return matchPhysicalTopics(physicalQuestions, answers);
}

export function getPassedPhysicalTopics(answers: AnswerMap) {
  return passedPhysicalTopics(physicalQuestions, answers);
}

export function getPhysicalResultPartition(answers: AnswerMap, freeCount?: number) {
  return partitionResults(getPhysicalMatches(answers), freeCount);
}

export const physicalAssessmentMeta = {
  id: 'phys',
  label: 'Physical Wellness Assessment',
  eyebrow: 'Health Assessment',
  disclaimer:
    'Educational wellness guidance only. This assessment is not medical advice, diagnosis, or treatment. For urgent symptoms or crisis support, contact emergency services or 988 in the U.S.',
  sectionCount: physicalSections.length,
  questionCount: physicalQuestions.length,
  solutionTopicCount: Object.keys(physicalSolutions).length,
};
