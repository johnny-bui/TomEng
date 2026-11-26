import { createRequire } from 'node:module';
import { accessToken, AuthNeedsLogin } from './auth.mjs';
import { analysisRequestBody, validateAnalysis } from './analysis.mjs';
import { callDeepModel, ProviderAuthError, ProviderLimitError } from './provider.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const requireSyncApi = createRequire(new URL('../../sync-api/package.json', import.meta.url));

export function connection() {
  if (!/^postgres(ql)?:\/\//.test(process.env.TOMENG_WORKER_DATABASE_URL || '')) throw new Error('TOMENG_WORKER_DATABASE_URL missing');
  const { neon } = requireSyncApi('@neondatabase/serverless');
  return neon(process.env.TOMENG_WORKER_DATABASE_URL);
}

export async function claimNext(sql) {
  const rows = await sql`UPDATE public.tomeng_speaking_analysis
    SET status = 'running', attempts = attempts + 1, locked_at = now(), updated_at = now()
    WHERE id = (SELECT id FROM public.tomeng_speaking_analysis
      WHERE status = 'pending' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)
    RETURNING id, phrase_id, transcript, attempts`;
  return rows[0] || null;
}

export async function recoverStale(sql) {
  await sql`UPDATE public.tomeng_speaking_analysis
    SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
      error_code = 'worker_interrupted', locked_at = NULL, updated_at = now()
    WHERE status = 'running' AND locked_at < now() - interval '5 minutes'`;
}

async function askModel(body) {
  try { return await callDeepModel({ accessToken: await accessToken(), body }); }
  catch (error) {
    if (!(error instanceof ProviderAuthError)) throw error;
    return callDeepModel({ accessToken: await accessToken({ force: true }), body });
  }
}

export async function processOne(sql, model = process.env.TOMENG_AI_MODEL || 'gpt-6.2-sol') {
  await recoverStale(sql);
  const job = await claimNext(sql);
  if (!job) return false;
  try {
    const result = validateAnalysis((await askModel(analysisRequestBody(job, model))).output);
    await sql`UPDATE public.tomeng_speaking_analysis
      SET status = 'done', result = ${JSON.stringify(result)}::jsonb, error_code = NULL,
        completed_at = now(), locked_at = NULL, updated_at = now()
      WHERE id = ${job.id} AND status = 'running'`;
  } catch (error) {
    const wait = error instanceof AuthNeedsLogin || error instanceof ProviderLimitError;
    const code = error instanceof AuthNeedsLogin ? 'needs_login' : error instanceof ProviderLimitError ? 'plan_limit' : 'analysis_failed';
    const status = wait || job.attempts < 3 ? 'pending' : 'failed';
    await sql`UPDATE public.tomeng_speaking_analysis
      SET status = ${status}, error_code = ${code}, locked_at = NULL, updated_at = now(),
        attempts = attempts - ${wait ? 1 : 0}
      WHERE id = ${job.id} AND status = 'running'`;
    if (!wait) throw error;
    return 'wait';
  }
  return true;
}

export async function runForever(sql) {
  while (true) {
    try {
      const didWork = await processOne(sql);
      if (didWork === 'wait') await sleep(15 * 60_000);
      else if (!didWork) await sleep(5000);
    } catch (error) {
      console.error('Speaking worker:', error instanceof Error ? error.message : String(error));
      await sleep(15000);
    }
  }
}
