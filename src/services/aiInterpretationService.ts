import { AiInterpretationResponse } from '../types/equity';

export interface InterpretCalculationPayload {
  question: string;
  calculationType: string;
  summaryStats: Record<string, any>;
  compactTable: any[];
  universeNotes?: string;
}

/**
 * Calls server-side Gemini endpoint /api/gemini/interpret.
 * CORE PRINCIPLE: "CODE CALCULATES. AI INTERPRETS."
 * Never invents numbers; strictly interprets deterministic calculation table.
 */
export async function requestAiInterpretation(
  payload: InterpretCalculationPayload
): Promise<AiInterpretationResponse> {
  try {
    const response = await fetch('/api/gemini/interpret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error || `Server responded with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      interpretation: data.interpretation,
      source: data.source,
    };
  } catch (err: any) {
    console.error('Failed to request AI interpretation:', err);
    return {
      success: false,
      error: err?.message || 'Network error communicating with AI interpretation server.',
    };
  }
}
