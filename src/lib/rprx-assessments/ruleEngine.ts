import type {
  AnswerMap,
  AssessmentQuestion,
  FinancialTheme,
  PhysicalQuestionMatch,
  ResultPartition,
  Rule,
  RuleLeaf,
} from './types';

export const DEFAULT_FREE_RESULT_COUNT = 3;

export function evalRule(rule: Rule | undefined | null, answers: AnswerMap): boolean {
  if (!rule) return true;

  if ('q' in rule) return answers[rule.q] === rule.is;
  if ('any' in rule) return rule.any.some((child) => evalRule(child, answers));
  if ('all' in rule) return rule.all.every((child) => evalRule(child, answers));
  if ('not' in rule) return !evalRule(rule.not, answers);
  if ('countAtLeast' in rule) {
    const threshold = rule.countAtLeast.count ?? rule.countAtLeast.n ?? 0;
    const hitCount = rule.countAtLeast.of.filter((child) => evalRule(child, answers)).length;
    return hitCount >= threshold;
  }

  return false;
}

export function triggerLeaves(rule: Rule | undefined | null): RuleLeaf[] {
  if (!rule) return [];
  if ('q' in rule) return [rule];
  if ('any' in rule) return rule.any.flatMap(triggerLeaves);
  if ('all' in rule) return rule.all.flatMap(triggerLeaves);
  if ('not' in rule) return triggerLeaves(rule.not);
  if ('countAtLeast' in rule) return rule.countAtLeast.of.flatMap(triggerLeaves);
  return [];
}

export function visibleQuestions<T extends AssessmentQuestion>(questions: readonly T[], answers: AnswerMap): T[] {
  return questions.filter((question) => evalRule(question.showIf, answers));
}

export function visibleMatrixItems(question: AssessmentQuestion, answers: AnswerMap) {
  return (question.items ?? []).filter((item) => evalRule(item.showIf, answers));
}

export function answerableQuestionIds(questions: readonly AssessmentQuestion[], answers: AnswerMap): string[] {
  return visibleQuestions(questions, answers).flatMap((question) => {
    if (question.type === 'matrix') return visibleMatrixItems(question, answers).map((item) => item.id);
    return [question.id];
  });
}

export function pruneHiddenAnswers(questions: readonly AssessmentQuestion[], answers: AnswerMap): AnswerMap {
  const liveIds = new Set(answerableQuestionIds(questions, answers));
  return Object.fromEntries(Object.entries(answers).filter(([id]) => liveIds.has(id)));
}

export function calculateProgress(questions: readonly AssessmentQuestion[], answers: AnswerMap) {
  const answerable = answerableQuestionIds(questions, answers);
  const answered = answerable.filter((id) => answers[id] !== undefined);
  return {
    total: answerable.length,
    answered: answered.length,
    left: answerable.length - answered.length,
    complete: answerable.length > 0 && answerable.length === answered.length,
  };
}

export function matchFinancialThemes(themes: readonly FinancialTheme[], answers: AnswerMap): FinancialTheme[] {
  return themes
    .filter((theme) => evalRule(theme.trigger, answers))
    .map((theme) => {
      const matchedReasons = triggerLeaves(theme.trigger).filter((leaf) => answers[leaf.q] === leaf.is);
      return {
        ...theme,
        hot: !!theme.emphasise && evalRule(theme.emphasise, answers),
        matchedReasons,
      };
    })
    .sort((a, b) => Number(Boolean(b.hot)) - Number(Boolean(a.hot)) || a.name.localeCompare(b.name));
}

export function matchPhysicalTopics(questions: readonly AssessmentQuestion[], answers: AnswerMap): PhysicalQuestionMatch[] {
  return questions
    .filter((question) => question.type === 'yesno' && Boolean(question.topic) && answers[question.id] === 'yes')
    .map((question) => ({
      ...question,
      matchedReasons: [{ q: question.id, is: 'yes' as const }],
    }));
}

export function passedPhysicalTopics(questions: readonly AssessmentQuestion[], answers: AnswerMap): AssessmentQuestion[] {
  return questions.filter((question) => question.type === 'yesno' && Boolean(question.topic) && answers[question.id] === 'no');
}

export function partitionResults<T>(items: readonly T[], freeCount = DEFAULT_FREE_RESULT_COUNT): ResultPartition<T> {
  return {
    free: items.slice(0, freeCount),
    locked: items.slice(freeCount),
  };
}
