import { describe, expect, it } from 'vitest';
import {
  answerableQuestionIds,
  calculateProgress,
  evalRule,
  financialAssessmentMeta,
  financialQuestions,
  getFinancialMatches,
  getFinancialResultPartition,
  getPhysicalMatches,
  getPhysicalResultPartition,
  physicalAssessmentMeta,
  physicalQuestions,
  pruneHiddenAnswers,
  visibleQuestions,
} from '@/lib/rprx-assessments';

describe('Netlify assessment engine import', () => {
  it('preserves the imported Netlify content inventory', () => {
    expect(financialAssessmentMeta.sectionCount).toBe(7);
    expect(financialAssessmentMeta.questionCount).toBe(39);
    expect(financialAssessmentMeta.themeCount).toBe(47);
    expect(financialAssessmentMeta.strategyCount).toBeGreaterThan(500);
    expect(physicalAssessmentMeta.sectionCount).toBe(5);
    expect(physicalAssessmentMeta.questionCount).toBe(25);
  });

  it('evaluates yes/no, any, all, not, and countAtLeast rules', () => {
    const answers = {
      married: 'no' as const,
      dep_children: 'yes' as const,
      a: 'yes' as const,
      b: 'yes' as const,
      c: 'no' as const,
    };

    expect(evalRule({ q: 'married', is: 'no' }, answers)).toBe(true);
    expect(evalRule({ any: [{ q: 'married', is: 'yes' }, { q: 'dep_children', is: 'yes' }] }, answers)).toBe(true);
    expect(evalRule({ all: [{ q: 'married', is: 'no' }, { q: 'dep_children', is: 'yes' }] }, answers)).toBe(true);
    expect(evalRule({ not: { q: 'married', is: 'yes' } }, answers)).toBe(true);
    expect(evalRule({ countAtLeast: { n: 2, of: [{ q: 'a', is: 'yes' }, { q: 'b', is: 'yes' }, { q: 'c', is: 'yes' }] } }, answers)).toBe(true);
  });

  it('shows conditional follow-up questions only when their trigger answers are present', () => {
    expect(visibleQuestions(financialQuestions, { married: 'yes' }).some((q) => q.id === 'marriage_planned')).toBe(false);
    expect(visibleQuestions(financialQuestions, { married: 'no' }).some((q) => q.id === 'marriage_planned')).toBe(true);

    const ids = answerableQuestionIds(financialQuestions, { married: 'no' });
    expect(ids).toContain('marriage_planned');
  });

  it('prunes answers that become hidden after an upstream answer changes', () => {
    const answers = pruneHiddenAnswers(financialQuestions, {
      married: 'yes',
      marriage_planned: 'yes',
      dep_children: 'yes',
    });

    expect(answers.married).toBe('yes');
    expect(answers.marriage_planned).toBeUndefined();
    expect(answers.dep_children).toBe('yes');
  });

  it('matches financial themes and partitions free versus locked cards', () => {
    const matches = getFinancialMatches({ dep_children: 'yes', dep_school: 'yes' });

    expect(matches.map((theme) => theme.id)).toContain('financial-aid-positioning');
    expect(matches[0].matchedReasons?.length).toBeGreaterThan(0);

    const partition = getFinancialResultPartition({ dep_children: 'yes', dep_school: 'yes' }, 1);
    expect(partition.free).toHaveLength(1);
    expect(partition.locked.length).toBe(matches.length - 1);
  });

  it('matches physical topics and partitions free versus locked cards', () => {
    const matches = getPhysicalMatches({ mental: 'yes', fitness: 'yes', nutrition: 'yes', heart: 'yes' });

    expect(matches.map((topic) => topic.id)).toEqual(expect.arrayContaining(['mental', 'fitness', 'nutrition', 'heart']));

    const partition = getPhysicalResultPartition({ mental: 'yes', fitness: 'yes', nutrition: 'yes', heart: 'yes' }, 3);
    expect(partition.free.map((topic) => topic.id)).toEqual(['mental', 'fitness', 'nutrition']);
    expect(partition.locked.map((topic) => topic.id)).toEqual(['heart']);
  });

  it('calculates progress from currently visible answerable questions', () => {
    const progress = calculateProgress(physicalQuestions, { mental: 'yes' });

    expect(progress.total).toBeGreaterThan(20);
    expect(progress.answered).toBe(1);
    expect(progress.left).toBe(progress.total - 1);
    expect(progress.complete).toBe(false);
  });
});
