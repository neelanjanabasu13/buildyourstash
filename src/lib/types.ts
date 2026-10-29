export interface Tally {
  checked: number;
  dropped: number;
}

export interface Receipt {
  quote: string;
}

export interface Idea {
  id: string;
  name: string;
  summary: string;
  droppedWhen: string | null;
  droppedDate: string | null;
  receipts: Receipt[];
}

export interface Thread {
  theme: string;
  explanation: string;
  receipts: Receipt[];
}

export interface Reason {
  reason: string;
  quote: string;
}

export interface WhyStopped {
  reasons: Reason[];
  trigger: string;
  searchQuery: string;
  topic: "news" | "general";
}

export type VerdictLabel = "REVIVE NOW" | "NOT YET" | "STILL DEAD";

export interface Evidence {
  claim: string;
  url: string;
  title: string;
  quote: string;
}

export interface LiveCheck {
  verdict: VerdictLabel;
  summary: string;
  evidence: Evidence[];
  nothingFound: boolean;
  query: string;
  searchedSince: string | null;
  resultsSeen: number;
}

export interface RevivalKit {
  pitch: string;
  steps: string[];
  headline: string;
  subhead: string;
}

export interface IdeaResult {
  idea: Idea;
  why?: WhyStopped;
  check?: LiveCheck;
  kit?: RevivalKit;
  feedback?: "yes" | "no" | undefined;
  feedbackNote?: string | undefined;
  error?: string;
}

export interface SweepResult {
  thread: Thread | null;
  ideas: IdeaResult[];
  pileTally: Tally;
  webTally: Tally;
}

export interface Checked<T> {
  value: T;
  tally: Tally;
}
