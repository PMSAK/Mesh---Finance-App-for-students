import type { IncomingMessage, ServerResponse } from 'node:http';

export interface CoachApiOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  /** Injected for tests. */
  fetchImpl?: typeof fetch;
}

export interface FinanceSummaryPayload {
  studentName: string;
  currency: string;
  trackedCashPaise: number;
  runway: {
    flexiblePaise: number;
    reservedPaise: number;
    dailyLimitPaise: number | null;
    daysRemaining: number | null;
    status: 'comfortable' | 'caution' | 'at_risk';
    reasons: string[];
    explanation: string;
  };
  safetyBufferPaise: number;
  upcomingCommitments: {
    title: string;
    amountPaise: number;
    dueDate: string;
    category: string;
    status: string;
  }[];
  moneyWithFriends: {
    receivablePaise: number;
    payablePaise: number;
    circlesCount: number;
  };
  recentExpenses: {
    title: string;
    amountPaise: number;
    category: string;
    date: string;
  }[];
  trailingDailySpendPaise: number;
  today: string;
}

export interface CoachRecommendation {
  id: string;
  category: 'spending' | 'runway' | 'commitments' | 'shared';
  title: string;
  advice: string;
  impact: string;
}

export interface CoachAnalysis {
  summary: string;
  verdict: 'comfortable' | 'caution' | 'at_risk';
  recommendations: CoachRecommendation[];
  generatedAt: string;
}

export interface CoachOutcome {
  status: number;
  body: Record<string, unknown>;
}

const COACH_SYSTEM_PROMPT = `You are Mesh Money Coach, an empathetic, smart, student-focused financial advisor for university students.
Your task is to analyze the student's authoritative financial data and provide clear, grounded, actionable advice.

RULES:
1. Provide an overall concise assessment (1-2 sentences) of their current situation.
2. Provide exactly 3 to 5 distinct, personalized, high-value recommendations.
3. Every recommendation MUST be directly grounded in the numbers provided (refer to specific expenses, commitments, runway days, or friend debts).
4. Do NOT invent figures, imaginary past transactions, or unrealistic financial products.
5. If data is limited (e.g. few expenses recorded or no circles), explicitly note that limitation in the advice rather than assuming trends.
6. The impact field should quantify the benefit where possible (e.g., "Extends runway by ~2 days", "Prevents buffer dip", "Clears ₹400 in pending receivables", "Saves ₹350 on dining").
7. Categories must be one of: "spending", "runway", "commitments", "shared".
8. Return ONLY a JSON object matching this schema:
{
  "summary": "Concise 1-2 sentence overview of financial runway and position",
  "verdict": "comfortable" | "caution" | "at_risk",
  "recommendations": [
    {
      "id": "1",
      "category": "spending",
      "title": "Short title",
      "advice": "Actionable, student-friendly explanation citing specific figures",
      "impact": "Concrete impact statement"
    }
  ]
}`;

export async function handleCoach(payload: unknown, opts: CoachApiOptions): Promise<CoachOutcome> {
  if (!opts.apiKey) {
    return {
      status: 503,
      body: {
        error: 'not_configured',
        message: 'Money Coach requires an OPENAI_API_KEY on the server. Please configure it in .env or .env.local.',
      },
    };
  }

  const p = payload as FinanceSummaryPayload | null;
  if (!p || typeof p !== 'object' || typeof p.trackedCashPaise !== 'number') {
    return { status: 400, body: { error: 'bad_request', message: 'Send a valid financial summary.' } };
  }

  const model = opts.model || 'gpt-4o-mini';
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 30000);

  const formatPaise = (paise: number) => `${p.currency} ${(paise / 100).toFixed(2)}`;

  const userContent = `Here is the student's actual financial summary (Authoritative figures calculated by Mesh):
- Student Name: ${p.studentName}
- Currency: ${p.currency}
- Tracked Cash: ${formatPaise(p.trackedCashPaise)}
- Daily Spending Limit: ${p.runway.dailyLimitPaise !== null ? `${formatPaise(p.runway.dailyLimitPaise)}/day` : 'None / Not calculated'}
- Remaining Planning Horizon: ${p.runway.daysRemaining !== null ? `${p.runway.daysRemaining} days` : 'Unknown'}
- Flexible Balance: ${formatPaise(p.runway.flexiblePaise)}
- Reserved Safety Buffer: ${formatPaise(p.safetyBufferPaise)}
- Runway Status: ${p.runway.status} (${p.runway.reasons.join('; ') || 'Normal'})
- Trailing Daily Spend: ${p.trailingDailySpendPaise > 0 ? `${formatPaise(p.trailingDailySpendPaise)}/day` : 'Limited / no measured history'}

Unpaid Upcoming Commitments:
${p.upcomingCommitments.length === 0 ? 'None recorded' : p.upcomingCommitments.map((c) => `- ${c.title} (${c.category}): ${formatPaise(c.amountPaise)} due ${c.dueDate}`).join('\n')}

Money With Friends (Circles):
- Friends owe student (Receivables): ${formatPaise(p.moneyWithFriends.receivablePaise)} (Outstanding, not yet cash)
- Student owes friends (Payables): ${formatPaise(p.moneyWithFriends.payablePaise)} (Reserved from flexible cash)
- Active Circles: ${p.moneyWithFriends.circlesCount}

Recent Transactions (last ${p.recentExpenses.length}):
${p.recentExpenses.length === 0 ? 'No transactions recorded yet' : p.recentExpenses.map((e) => `- ${e.date}: ${e.title} (${e.category}) - ${formatPaise(e.amountPaise)}`).join('\n')}

Analyze this real student data and output the required 3-5 grounded recommendations in JSON.`;

  try {
    const res = await (opts.fetchImpl ?? fetch)('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: ctl.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: COACH_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (res.status === 401) {
      return { status: 401, body: { error: 'auth_error', message: 'Invalid OpenAI API key. Please check OPENAI_API_KEY in .env or .env.local.' } };
    }
    if (res.status === 429) {
      return { status: 429, body: { error: 'rate_limited', message: 'OpenAI rate limit or quota exceeded. Please check your account quota or try again in a few moments.' } };
    }
    if (!res.ok) {
      let errDetail = '';
      try {
        const errJson = (await res.json()) as { error?: { message?: string } };
        errDetail = errJson?.error?.message ? ` (${errJson.error.message})` : '';
      } catch {
        /* ignore */
      }
      return { status: 502, body: { error: 'provider_error', message: `OpenAI request failed${errDetail}.` } };
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? '';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { status: 422, body: { error: 'malformed', message: "The model's response could not be parsed as JSON." } };
    }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
      return { status: 422, body: { error: 'malformed', message: 'Recommendations were missing in the response.' } };
    }

    const validRecommendations: CoachRecommendation[] = parsed.recommendations.slice(0, 5).map((r: any, idx: number) => ({
      id: String(r.id || idx + 1),
      category: ['spending', 'runway', 'commitments', 'shared'].includes(r.category) ? r.category : 'spending',
      title: String(r.title || 'Financial Tip').slice(0, 80),
      advice: String(r.advice || '').slice(0, 500),
      impact: String(r.impact || 'Helps manage your student budget').slice(0, 100),
    }));

    const analysis: CoachAnalysis = {
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Here is an assessment of your student finances.',
      verdict: ['comfortable', 'caution', 'at_risk'].includes(parsed.verdict) ? parsed.verdict : p.runway.status,
      recommendations: validRecommendations,
      generatedAt: new Date().toISOString(),
    };

    return { status: 200, body: { ok: true, analysis } };
  } catch (e) {
    const timeout = (e as Error)?.name === 'AbortError';
    return {
      status: timeout ? 504 : 502,
      body: {
        error: timeout ? 'timeout' : 'network',
        message: timeout ? 'The Money Coach analysis took too long to complete. Please try again.' : 'Network error connecting to OpenAI. Check your connection.',
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

function readBody(req: IncomingMessage, limit = 1024 * 1024): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('too_large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('bad_json'));
      }
    });
    req.on('error', reject);
  });
}

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};

export function coachMiddleware(opts: CoachApiOptions) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = (req.url ?? '').split('?')[0];
    if (url === '/api/coach/status' && req.method === 'GET') {
      return send(res, 200, { configured: Boolean(opts.apiKey) });
    }
    if (url !== '/api/coach') return next();
    if (req.method !== 'POST') return send(res, 405, { error: 'method', message: 'Use POST.' });
    try {
      const body = await readBody(req);
      const out = await handleCoach(body, opts);
      send(res, out.status, out.body);
    } catch {
      send(res, 400, { error: 'bad_request', message: 'Invalid JSON payload.' });
    }
  };
}
