export type AnswerValue = 'yes' | 'no';
export type AnswerMap = Record<string, AnswerValue | undefined>;

export type RuleLeaf = {
  q: string;
  is: AnswerValue;
};

export type Rule =
  | RuleLeaf
  | { any: Rule[] }
  | { all: Rule[] }
  | { not: Rule }
  | { countAtLeast: { count?: number; n?: number; of: Rule[] } };

export type AssessmentSection = {
  id: string;
  label: string;
  blurb?: string;
};

export type AssessmentItem = {
  id: string;
  label: string;
  showIf?: Rule;
};

export type AssessmentQuestion = {
  id: string;
  section: string;
  type: 'yesno' | 'matrix';
  text: string;
  help?: string;
  blurb?: string;
  topic?: string;
  sub?: boolean;
  showIf?: Rule;
  items?: AssessmentItem[];
};

export type FinancialTheme = {
  id: string;
  name: string;
  group?: string;
  category?: string;
  pillar?: string;
  horseman?: string;
  blurb: string;
  trigger?: Rule;
  emphasise?: Rule | null;
  tactics: string[];
  hot?: boolean;
  matchedReasons?: RuleLeaf[];
};

export type PhysicalSolution = {
  t: string;
  b: string;
  u?: string;
};

export type PhysicalQuestionMatch = AssessmentQuestion & {
  matchedReasons?: RuleLeaf[];
};

export type ResultPartition<T> = {
  free: T[];
  locked: T[];
};
