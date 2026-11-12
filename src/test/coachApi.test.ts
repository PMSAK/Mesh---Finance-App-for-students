import { describe, expect, it } from 'vitest';
import { handleCoach, type FinanceSummaryPayload } from '../../server/coachApi';

const samplePayload: FinanceSummaryPayload = {
  studentName: 'Aarav Sharma',
  currency: '₹',
  trackedCashPaise: 425000,
  runway: {
    flexiblePaise: 250000,
    reservedPaise: 175000,
    dailyLimitPaise: 15600,
    daysRemaining: 16,
    status: 'caution',
    reasons: ['Commitments exceed flexible balance', 'Runway is below target'],
    explanation: '₹2,500 flexible cash remaining across 16 days.',
  },
  safetyBufferPaise: 100000,
  upcomingCommitments: [
    {
      title: 'Hostel Mess Fee',
      amountPaise: 200000,
      dueDate: '2026-10-28',
      category: 'hostel',
      status: 'upcoming',
    },
  ],
  moneyWithFriends: {
    receivablePaise: 85000,
    payablePaise: 30000,
    circlesCount: 2,
  },
  recentExpenses: [
    {
      title: 'Campus Canteen Dinner',
      amountPaise: 18000,
      category: 'food',
      date: '2026-10-23',
    },
  ],
  trailingDailySpendPaise: 22000,
  today: '2026-10-24',
};

const mockOpenAiFetch = (content: string, ok = true, status = 200) =>
  (async () => ({
    ok,
    status,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  })) as unknown as typeof fetch;

describe('coach API handler', () => {
  it('reports not configured without an API key', async () => {
    const r = await handleCoach(samplePayload, {});
    expect(r.status).toBe(503);
    expect(r.body.error).toBe('not_configured');
    expect(r.body.message).toContain('OPENAI_API_KEY');
  });

  it('rejects invalid or empty payloads', async () => {
    expect((await handleCoach(null, { apiKey: 'sk-test' })).status).toBe(400);
    expect((await handleCoach({}, { apiKey: 'sk-test' })).status).toBe(400);
    expect((await handleCoach({ studentName: 'Test' }, { apiKey: 'sk-test' })).status).toBe(400);
  });

  it('returns structured recommendations on successful OpenAI response', async () => {
    const validAiResponse = JSON.stringify({
      summary: 'Your runway is cautious because the hostel mess fee takes up most of your cash.',
      verdict: 'caution',
      recommendations: [
        {
          id: 'rec_1',
          category: 'commitments',
          title: 'Prepare for Hostel Mess payment',
          advice: 'Reserve ₹2,000 for the fee due on Oct 28.',
          impact: 'Avoids dipping into ₹1,000 safety buffer',
        },
        {
          id: 'rec_2',
          category: 'shared',
          title: 'Collect pending friend balances',
          advice: 'Follow up on ₹850 owed to you across your 2 active circles.',
          impact: 'Boosts flexible runway by ~5 days',
        },
        {
          id: 'rec_3',
          category: 'spending',
          title: 'Cap daily canteen spend',
          advice: 'Your trailing spend of ₹220/day exceeds the daily limit of ₹156/day.',
          impact: 'Saves ~₹64/day to protect runway',
        },
      ],
    });

    const r = await handleCoach(samplePayload, {
      apiKey: 'sk-test',
      fetchImpl: mockOpenAiFetch(validAiResponse),
    });

    expect(r.status).toBe(200);
    const analysis = r.body.analysis as any;
    expect(analysis).toBeDefined();
    expect(analysis.verdict).toBe('caution');
    expect(analysis.recommendations.length).toBe(3);
    expect(analysis.recommendations[0].category).toBe('commitments');
    expect(analysis.recommendations[1].impact).toContain('Boosts flexible runway');
  });

  it('handles invalid model output format gracefully (422)', async () => {
    // Malformed JSON
    expect((await handleCoach(samplePayload, { apiKey: 'sk-test', fetchImpl: mockOpenAiFetch('Not json') })).status).toBe(422);

    // Missing recommendations array
    expect((await handleCoach(samplePayload, { apiKey: 'sk-test', fetchImpl: mockOpenAiFetch('{"summary":"hi","recommendations":[]}') })).status).toBe(422);
  });

  it('maps authentication, rate limits, and network errors gracefully', async () => {
    // 401 Auth error
    const authErr = await handleCoach(samplePayload, {
      apiKey: 'sk-bad',
      fetchImpl: mockOpenAiFetch('{"error":{"message":"Incorrect API key"}}', false, 401),
    });
    expect(authErr.status).toBe(401);
    expect(authErr.body.error).toBe('auth_error');

    // 429 Rate limited
    const rateErr = await handleCoach(samplePayload, {
      apiKey: 'sk-test',
      fetchImpl: mockOpenAiFetch('{"error":{"message":"Rate limit exceeded"}}', false, 429),
    });
    expect(rateErr.status).toBe(429);
    expect(rateErr.body.error).toBe('rate_limited');

    // 502 Provider error
    const providerErr = await handleCoach(samplePayload, {
      apiKey: 'sk-test',
      fetchImpl: mockOpenAiFetch('{"error":{"message":"OpenAI is down"}}', false, 500),
    });
    expect(providerErr.status).toBe(502);
    expect(providerErr.body.error).toBe('provider_error');

    // 504 Timeout
    const hangFetch = ((_u: unknown, init: RequestInit) =>
      new Promise((_res, rej) =>
        init.signal!.addEventListener('abort', () =>
          rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        )
      )) as unknown as typeof fetch;

    const timeoutErr = await handleCoach(samplePayload, {
      apiKey: 'sk-test',
      fetchImpl: hangFetch,
      timeoutMs: 20,
    });
    expect(timeoutErr.status).toBe(504);
    expect(timeoutErr.body.error).toBe('timeout');
  });
});
