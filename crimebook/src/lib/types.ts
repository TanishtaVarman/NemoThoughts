export type Role = 'user' | 'assistant';

export interface Source {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  sources?: Source[];
  model?: string;
  latencyMs?: number;
  /** Topic of the Mistake Book entry this answer produced, if any. */
  loggedTopic?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  lessons: string[];
  prompts: string[];
}

export interface Insight {
  id: string;
  subjectId: string;
  lesson: string | null;
  topic: string;
  rule: string;
  question: string;
  /** How many times this concept has come up in chat. */
  hits: number;
  mastered: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ExtractedInsight {
  topic: string;
  rule: string;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/* ---------- API contracts ---------- */

export interface TutorRequestBody {
  subjectId: string;
  lesson?: string | null;
  model?: string;
  research?: boolean;
  messages: { role: Role; content: string }[];
}

export interface TutorResponseBody {
  content: string;
  insight: ExtractedInsight | null;
  sources: Source[];
  model: string;
  latencyMs: number;
  usage: Usage | null;
  research: { query: string; responseTimeMs: number } | null;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResponseBody {
  query: string;
  answer: string | null;
  results: SearchResult[];
  responseTimeMs: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export type ServiceState = 'connected' | 'missing' | 'invalid' | 'error';

export interface ServiceStatus {
  service: 'nebius' | 'tavily';
  endpoint: string;
  configured: boolean;
  state: ServiceState;
  httpStatus: number | null;
  latencyMs: number | null;
  message: string;
}

export interface NebiusStatus extends ServiceStatus {
  service: 'nebius';
  defaultModel: string;
  models: { id: string; available: boolean }[];
}

export interface CheckKeysResponseBody {
  ok: boolean;
  checkedAt: string;
  nebius: NebiusStatus;
  tavily: ServiceStatus;
}
