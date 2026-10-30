/**
 * Pure text helpers shared by the server (output hygiene, insight extraction)
 * and the client (rendering the "Rule to remember" callout).
 */
import type { ExtractedInsight } from './types';

const RULE_LINE = /^[ \t]*(?:[-*+]|\d+\.)?[ \t]*\*{0,2}[ \t]*Rule to remember[ \t]*:?[ \t]*\*{0,2}[ \t]*:?[ \t]*(.+?)[ \t]*$/im;
const CONCEPT_LINE = /^[ \t]*(?:[-*+]|\d+\.)?[ \t]*\*{0,2}[ \t]*Core concept[ \t]*:?[ \t]*\*{0,2}[ \t]*:?[ \t]*(.+?)[ \t]*$/im;
const FILLER_OPENER =
  /^(?:sure|certainly|of course|absolutely|great question|good question|okay|ok|alright|happy to help|let'?s (?:explore|dive|break)|i'?d be happy)\b[^\n]{0,140}\n+/i;

/** Remove inline Markdown so a fragment can be stored as plain text. */
export function plainText(fragment: string): string {
  return fragment
    .replace(/\*\*|__|`/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip reasoning traces some Nemotron deployments emit inline. */
export function stripReasoning(raw: string): string {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const orphanClose = text.lastIndexOf('</think>');
  if (orphanClose !== -1) text = text.slice(orphanClose + '</think>'.length);
  return text.trim();
}

/**
 * Enforce the house style even if the model slips:
 * Markdown headers become bold lines, and filler openers are dropped.
 * Code fences are left untouched.
 */
export function enforceHouseStyle(text: string): string {
  const segments = text.split(/(```[\s\S]*?```)/g);
  const cleaned = segments
    .map((segment) => {
      if (segment.startsWith('```')) return segment;
      return segment.replace(/^[ \t]{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, (_m, title: string) => `**${title.replace(/\*\*/g, '')}**`);
    })
    .join('');
  return cleaned.replace(FILLER_OPENER, '').trim();
}

/** Split an answer into its body and its "Rule to remember" line for display. */
export function splitRule(content: string): { body: string; rule: string | null } {
  const match = content.match(RULE_LINE);
  if (!match || match.index === undefined) return { body: content, rule: null };
  const body = (content.slice(0, match.index) + content.slice(match.index + match[0].length)).trim();
  return { body, rule: match[1].replace(/^\*+|\*+$/g, '').trim() };
}

/** Pull the core concept and rule out of a tutor answer for the Mistake Book. */
export function extractInsight(content: string, fallbackTopic: string): ExtractedInsight | null {
  const ruleMatch = content.match(RULE_LINE);
  if (!ruleMatch) return null;
  const rule = plainText(ruleMatch[1]);
  if (!rule) return null;

  const conceptMatch = content.match(CONCEPT_LINE);
  let topic = conceptMatch ? plainText(conceptMatch[1]) : '';
  // "Name — definition" or "Name: definition" → keep the name.
  topic = topic.split(/\s[—–-]\s|:\s/)[0].replace(/[.;,]+$/, '').trim();
  if (!topic) topic = fallbackTopic;
  if (topic.length > 80) topic = `${topic.slice(0, 77).trimEnd()}…`;

  return { topic, rule };
}
