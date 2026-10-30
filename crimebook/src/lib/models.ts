export const MODELS = [
  {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    label: 'Nemotron 3 Super',
    detail: '120B MoE · 12B active · deeper reasoning',
  },
  {
    id: 'nvidia/Nemotron-3_5-Lightning',
    label: 'Nemotron 3.5 Lightning',
    detail: 'Low latency · fast iteration',
  },
] as const;

export type ModelId = (typeof MODELS)[number]['id'];

export const DEFAULT_MODEL: ModelId = MODELS[0].id;

export function isModelId(value: unknown): value is ModelId {
  return typeof value === 'string' && MODELS.some((m) => m.id === value);
}

export function modelLabel(id: string | undefined): string {
  return MODELS.find((m) => m.id === id)?.label ?? id ?? 'Unknown model';
}
