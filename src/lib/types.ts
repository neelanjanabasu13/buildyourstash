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

export interface IdeaContext {
  receipts: Receipt[];
  focus: string;
  searchQuery: string;
  topic: "news" | "general";
}

export type VerdictLabel = "BUILD NOW" | "WATCH" | "PARK";

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
  confidence?: "low" | "medium" | "high";
  wouldChange?: string;
}

export interface RevivalKit {
  pitch: string;
  steps: string[];
  headline: string;
  subhead: string;
  outreach?: string;
  createdAt?: string;
  archetype?: import("./archetypes").ArchetypeId;
  liveTemplate?: { title: string; url: string }[];
  precedents?: { title: string; url: string; snippet: string }[];
}

export type SignalType = "Now possible" | "Crowded" | "Opportunity" | "Timing changed";
export interface Signal {
  type: SignalType;
  headline: string;
  ideaQuote: string | null;
  evidence: Evidence;
  sourceDate: string | null;
  move: "build" | "pivot" | "narrow" | "park" | "watch";
  why: string;
  confidence: "low" | "medium" | "high";
  wouldChange: string;
  deadline: string | null;
  prize: string | null;
  fit: string | null;
}
export interface Radar {
  newSourceUrls?: string[];
  newSignals?: number;
  checkedAt: string;
  signals: Signal[];
  queries: string[];
  webTally: Tally;
  pileTally: Tally;
}

export interface IdeaResult {
  history?: (LiveCheck & { checkedAt: string })[];
  idea: Idea;
  context?: IdeaContext;
  check?: LiveCheck;
  kit?: RevivalKit;
  feedback?: "yes" | "no" | undefined;
  feedbackNote?: string | undefined;
  error?: string;
  radar?: Radar;
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
