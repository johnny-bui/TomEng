import { accessToken, loadCredentials, login } from './auth.mjs';
import { callDeepModel, ProviderAuthError } from './provider.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const command = process.argv[2] || 'status';

function loadWorkerEnv() {
  const file=path.join(os.homedir(),'.tomeng-chatgpt','worker.env');
  if(!fs.existsSync(file))throw new Error('Thiếu ~/.tomeng-chatgpt/worker.env');
  if(fs.statSync(file).mode & 0o077)throw new Error('worker.env cần quyền 0600');
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const match=/^\s*([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if(match&&['TOMENG_WORKER_DATABASE_URL','TOMENG_AI_MODEL'].includes(match[1]))process.env[match[1]]=match[2].trim().replace(/^(['"])(.*)\1$/,'$2');
  }
}

async function probe() {
  const body = {
    model: process.env.TOMENG_AI_MODEL || 'gpt-6.2-sol',
    store: false,
    stream: true,
    instructions: 'You are checking the TomEng speaking analysis connection. Return only valid JSON. Do not evaluate pronunciation from text.',
    input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ phrase: 'Could you speak a little slower?', said: 'Could you slow down a bit?', context: 'The other person is speaking too fast.' }) }] }],
    text: { format: { type: 'json_schema', name: 'tomeng_connection_probe', strict: true, schema: {
      type: 'object', additionalProperties: false,
      properties: { connected: { type: 'boolean' }, sameIntent: { type: 'boolean' }, reason: { type: 'string' } },
      required: ['connected', 'sameIntent', 'reason'],
    } } },
  };
  let result;
  try { result = await callDeepModel({ accessToken: await accessToken(), body }); }
  catch (error) {
    if (!(error instanceof ProviderAuthError)) throw error;
    result = await callDeepModel({ accessToken: await accessToken({ force: true }), body });
  }
  if (result.output?.connected !== true || result.output?.sameIntent !== true) throw new Error('PROBE_SEMANTIC_CHECK_FAILED');
  console.log(JSON.stringify({ connected: true, sameIntent: true, model: body.model, latencyMs: result.latencyMs }));
}

try {
  if (command === 'login') {
    const account = await login();
    console.log(`TomEng ChatGPT connected: ${account.email}`);
  } else if (command === 'probe') await probe();
  else if (command === 'sample') {
    const { analysisRequestBody, validateAnalysis } = await import('./analysis.mjs');
    let result;
    const body=analysisRequestBody({phrase_id:'p006',transcript:'Can you slow down a bit?'},process.env.TOMENG_AI_MODEL || 'gpt-6.2-sol');
    try{result=await callDeepModel({accessToken:await accessToken(),body});}
    catch(error){if(!(error instanceof ProviderAuthError))throw error;result=await callDeepModel({accessToken:await accessToken({force:true}),body});}
    console.log(JSON.stringify(validateAnalysis(result.output)));
  }
  else if (command === 'once' || command === 'start') {
    loadWorkerEnv();
    const { connection, processOne, runForever } = await import('./queue.mjs');
    const sql=connection();
    if(command==='once')console.log(JSON.stringify({worked:await processOne(sql)}));
    else await runForever(sql);
  }
  else if (command === 'status') {
    const c = loadCredentials();
    console.log(JSON.stringify({ connected: !!c, account: c?.email || null,
      planPermission: c?.scopes?.includes('chatgpt.tokens.use.direct') || false,
      tokenExpiresAt: c?.saved_at && c?.expires_in ? new Date(new Date(c.saved_at).getTime() + c.expires_in * 1000).toISOString() : null,
    }));
  } else throw new Error('Usage: node worker/chatgpt-plan/cli.mjs login|status|probe|sample|once|start');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
