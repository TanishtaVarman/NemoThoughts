import { NextResponse } from 'next/server';
import { ApiError, errorResponse } from '@/lib/errors';
import { extractInsight } from '@/lib/format';
import { buildTutorSystemPrompt, createChatCompletion, resolveModel, type ChatTurn } from '@/lib/nebius';
import { getSubject } from '@/lib/subjects';
import { tavilySearch } from '@/lib/tavily';
import type { SearchResult, TutorRequestBody, TutorResponseBody } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_HISTORY = 16;
const MAX_MESSAGE_CHARS = 8000;

function parseBody(raw: unknown): TutorRequestBody {
  if (!raw || typeof raw !== 'object') throw new ApiError(400, 'BAD_REQUEST', 'Request body must be a JSON object.');
  const body = raw as Partial<TutorRequestBody>;

  if (typeof body.subjectId !== 'string') throw new ApiError(400, 'BAD_REQUEST', '"subjectId" is required.');
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new ApiError(400, 'BAD_REQUEST', '"messages" must be a non-empty array.');
  }
  for (const m of body.messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      throw new ApiError(400, 'BAD_REQUEST', 'Each message needs a role of "user" or "assistant" and string content.');
    }
    if (m.content.length > MAX_MESSAGE_CHARS) {
      throw new ApiError(400, 'MESSAGE_TOO_LONG', `Messages are limited to ${MAX_MESSAGE_CHARS} characters.`);
    }
  }
  if (body.messages[body.messages.length - 1].role !== 'user') {
    throw new ApiError(400, 'BAD_REQUEST', 'The last message must come from the user.');
  }

  return {
    subjectId: body.subjectId,
    lesson: typeof body.lesson === 'string' && body.lesson.trim() ? body.lesson.trim() : null,
    model: typeof body.model === 'string' ? body.model : undefined,
    research: body.research === true,
    messages: body.messages,
  };
}

export async function POST(req: Request) {
  try {
    const body = parseBody(await req.json().catch(() => null));
    const subject = getSubject(body.subjectId);
    if (!subject) throw new ApiError(400, 'UNKNOWN_SUBJECT', `Unknown subject "${body.subjectId}".`);

    const question = body.messages[body.messages.length - 1].content.trim();
    const lesson = body.lesson ?? null;

    let research: SearchResult[] = [];
    let researchMeta: TutorResponseBody['research'] = null;
    if (body.research) {
      const query = `${subject.name}${lesson ? ` ${lesson}` : ''}: ${question}`;
      const search = await tavilySearch(query, { maxResults: 5, depth: 'basic' });
      research = search.results;
      researchMeta = { query: search.query, responseTimeMs: search.responseTimeMs };
    }

    const turns: ChatTurn[] = [
      { role: 'system', content: buildTutorSystemPrompt({ subject, lesson, research }) },
      ...body.messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content })),
    ];

    const completion = await createChatCompletion(turns, { model: resolveModel(body.model) });
    const fallbackTopic = lesson ?? (question.length > 60 ? `${question.slice(0, 57).trimEnd()}…` : question);

    const response: TutorResponseBody = {
      content: completion.content,
      insight: extractInsight(completion.content, fallbackTopic),
      sources: research.map((r) => ({ title: r.title, url: r.url })),
      model: completion.model,
      latencyMs: completion.latencyMs,
      usage: completion.usage,
      research: researchMeta,
    };
    return NextResponse.json(response);
  } catch (err) {
    return errorResponse(err);
  }
}
