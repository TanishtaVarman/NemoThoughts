'use client';

import { ClipboardCheck, ClipboardList } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { ClientApiError, apiFetch, uid } from '@/lib/client';
import { DEFAULT_MODEL, isModelId, type ModelId } from '@/lib/models';
import { SUBJECTS, getSubject } from '@/lib/subjects';
import type { ChatMessage, CheckKeysResponseBody, ExtractedInsight, Insight, TutorResponseBody } from '@/lib/types';
import ChatView from './ChatView';
import MistakeBook from './MistakeBook';
import PlaceholderView from './PlaceholderView';
import SettingsModal, { type SessionMetrics } from './SettingsModal';
import Sidebar, { type View } from './Sidebar';

interface Prefs {
  model: ModelId;
  research: boolean;
}

interface InlineError {
  code: string;
  message: string;
  subjectId: string;
  retry: { lesson: string | null; history: ChatMessage[] };
}

const EMPTY_METRICS: SessionMetrics = {
  requests: 0,
  failures: 0,
  totalLatencyMs: 0,
  lastLatencyMs: null,
  totalTokens: 0,
  researchCalls: 0,
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export default function Workspace() {
  const [subjectId, setSubjectId] = usePersistentState('crimebook.subject', SUBJECTS[0].id);
  const [lessons, setLessons] = usePersistentState<Record<string, string | null>>('crimebook.lessons', {});
  const [chats, setChats] = usePersistentState<Record<string, ChatMessage[]>>('crimebook.chats.v1', {});
  const [insights, setInsights] = usePersistentState<Insight[]>('crimebook.insights.v1', []);
  const [prefs, setPrefs] = usePersistentState<Prefs>('crimebook.prefs.v1', { model: DEFAULT_MODEL, research: false });

  const [view, setView] = useState<View>('chat');
  const [draft, setDraft] = useState('');
  const [pendingSubject, setPendingSubject] = useState<string | null>(null);
  const [error, setError] = useState<InlineError | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metrics, setMetrics] = useState<SessionMetrics>(EMPTY_METRICS);
  const [keyStatus, setKeyStatus] = useState<CheckKeysResponseBody | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const subject = getSubject(subjectId) ?? SUBJECTS[0];
  const lesson = lessons[subject.id] ?? null;
  const messages = chats[subject.id] ?? [];
  const model = isModelId(prefs.model) ? prefs.model : DEFAULT_MODEL;

  /* ---------------- Mistake Book ---------------- */

  const logInsight = useCallback(
    (sid: string, lsn: string | null, insight: ExtractedInsight, question: string) => {
      const now = Date.now();
      setInsights((prev) => {
        const key = normalize(insight.topic);
        const existing = prev.find((i) => i.subjectId === sid && normalize(i.topic) === key);
        if (existing) {
          const updated: Insight = {
            ...existing,
            rule: insight.rule,
            question,
            hits: existing.hits + 1,
            mastered: false,
            updatedAt: now,
          };
          return [updated, ...prev.filter((i) => i.id !== existing.id)];
        }
        return [
          {
            id: uid(),
            subjectId: sid,
            lesson: lsn,
            topic: insight.topic,
            rule: insight.rule,
            question,
            hits: 1,
            mastered: false,
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ];
      });
    },
    [setInsights],
  );

  /* ---------------- Tutor ---------------- */

  const runTutor = useCallback(
    async (sid: string, lsn: string | null, history: ChatMessage[]) => {
      setPendingSubject(sid);
      setError(null);
      try {
        const data = await apiFetch<TutorResponseBody>('/api/tutor', {
          method: 'POST',
          body: JSON.stringify({
            subjectId: sid,
            lesson: lsn,
            model,
            research: prefs.research,
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        const reply: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: data.content,
          createdAt: Date.now(),
          sources: data.sources,
          model: data.model,
          latencyMs: data.latencyMs,
          loggedTopic: data.insight?.topic,
        };
        setChats((prev) => ({ ...prev, [sid]: [...(prev[sid] ?? []), reply] }));
        if (data.insight) logInsight(sid, lsn, data.insight, history[history.length - 1].content);

        setMetrics((m) => ({
          ...m,
          requests: m.requests + 1,
          totalLatencyMs: m.totalLatencyMs + data.latencyMs,
          lastLatencyMs: data.latencyMs,
          totalTokens: m.totalTokens + (data.usage?.totalTokens ?? 0),
          researchCalls: m.researchCalls + (data.research ? 1 : 0),
        }));
      } catch (err) {
        const e = err instanceof ClientApiError ? err : new ClientApiError(0, 'UNKNOWN_ERROR', String(err));
        setError({ code: e.code, message: e.message, subjectId: sid, retry: { lesson: lsn, history } });
        setMetrics((m) => ({ ...m, requests: m.requests + 1, failures: m.failures + 1 }));
      } finally {
        setPendingSubject(null);
      }
    },
    [model, prefs.research, setChats, logInsight],
  );

  const send = (text: string) => {
    if (pendingSubject) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, createdAt: Date.now() };
    const history = [...messages, userMsg];
    setChats((prev) => ({ ...prev, [subject.id]: history }));
    setDraft('');
    void runTutor(subject.id, lesson, history);
  };

  const retry = () => {
    if (!error || pendingSubject) return;
    void runTutor(error.subjectId, error.retry.lesson, error.retry.history);
  };

  /* ---------------- Key status ---------------- */

  const checkKeys = useCallback(async () => {
    setChecking(true);
    setCheckError(null);
    try {
      // /api/check-keys answers 500 when a service is unusable but still sends the full report.
      const res = await fetch('/api/check-keys', { cache: 'no-store' });
      const body = (await res.json()) as CheckKeysResponseBody;
      if (!body?.nebius || !body?.tavily) throw new Error(`Unexpected response (HTTP ${res.status}).`);
      setKeyStatus(body);
    } catch (err) {
      setCheckError(`Could not run the connection check: ${(err as Error).message}`);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (settingsOpen) void checkKeys();
  }, [settingsOpen, checkKeys]);

  /* ---------------- Navigation ---------------- */

  const navigate = (id: string, v: View) => {
    if (id !== subject.id) setDraft('');
    setSubjectId(id);
    setView(v);
    setSidebarOpen(false);
  };

  const selectLesson = (id: string, l: string | null) => {
    setLessons((prev) => ({ ...prev, [id]: l }));
    navigate(id, 'chat');
  };

  const review = (entry: Insight) => {
    setSubjectId(entry.subjectId);
    setLessons((prev) => ({ ...prev, [entry.subjectId]: entry.lesson }));
    setDraft(`Test me on ${entry.topic}: ask one practice question first, and only explain after I answer.`);
    setView('chat');
  };

  const activeCounts = insights.reduce<Record<string, number>>((acc, i) => {
    if (!i.mastered) acc[i.subjectId] = (acc[i.subjectId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white">
      <Sidebar
        subjects={SUBJECTS}
        subjectId={subject.id}
        lesson={lesson}
        view={view}
        activeCounts={activeCounts}
        keyStatus={keyStatus}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={navigate}
        onSelectLesson={selectLesson}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {view === 'chat' ? (
          <ChatView
            subject={subject}
            lesson={lesson}
            messages={messages}
            pending={pendingSubject === subject.id}
            busyElsewhere={pendingSubject !== null && pendingSubject !== subject.id}
            error={error && error.subjectId === subject.id ? error : null}
            draft={draft}
            model={model}
            research={prefs.research}
            onDraftChange={setDraft}
            onSend={send}
            onRetry={retry}
            onDismissError={() => setError(null)}
            onToggleResearch={() => setPrefs((p) => ({ ...p, research: !p.research }))}
            onClear={() => {
              setChats((prev) => ({ ...prev, [subject.id]: [] }));
              setError(null);
            }}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        ) : view === 'test' ? (
          <PlaceholderView
            title="Test"
            description="Adaptive practice tests generated from this subject's Mistake Book entries."
            icon={<ClipboardList size={18} strokeWidth={1.5} />}
            subject={subject}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        ) : view === 'corrections' ? (
          <PlaceholderView
            title="Test corrections"
            description="Marked answers with model solutions and a diagnosis of each mistake."
            icon={<ClipboardCheck size={18} strokeWidth={1.5} />}
            subject={subject}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        ) : (
          <MistakeBook
            subject={subject}
            insights={insights}
            onToggleMastered={(id) =>
              setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, mastered: !i.mastered, updatedAt: Date.now() } : i)))
            }
            onDelete={(id) => setInsights((prev) => prev.filter((i) => i.id !== id))}
            onReview={review}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </main>

      {settingsOpen && (
        <SettingsModal
          status={keyStatus}
          checking={checking}
          checkError={checkError}
          metrics={metrics}
          model={model}
          onModelChange={(m) => setPrefs((p) => ({ ...p, model: m }))}
          onRecheck={() => void checkKeys()}
          onClearChats={() => {
            setChats({});
            setError(null);
          }}
          onClearMistakes={() => setInsights([])}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
