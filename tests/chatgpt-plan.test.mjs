import assert from 'node:assert/strict';
import { test } from 'node:test';
import { phraseById, analysisRequestBody, validateAnalysis } from '../worker/chatgpt-plan/analysis.mjs';
import { tokenNeedsRefresh, isPlanLimitError } from '../worker/chatgpt-plan/policy.mjs';
import { callDeepModel, ProviderLimitError } from '../worker/chatgpt-plan/provider.mjs';

test('worker uses canonical phrase data and never accepts an unknown phrase', () => {
  assert.equal(phraseById('p001').en, "I'm concerned about it.");
  assert.equal(phraseById('p1200')?.id, 'p1200');
  assert.equal(phraseById('p1201'), null);
  const body=analysisRequestBody({phrase_id:'p006',transcript:'Can you slow down a bit?'});
  const context=JSON.parse(body.input[0].content[0].text);
  assert.equal(context.phraseId,'p006');
  assert.equal(context.learnerSaid,'Can you slow down a bit?');
  assert.ok(context.situation);
  assert.match(body.instructions,/Do not judge pronunciation/);
  assert.throws(()=>analysisRequestBody({phrase_id:'p9999',transcript:'hello'}),/UNKNOWN_PHRASE_ID/);
});

test('analysis output rejects malformed verdicts and oversized claims', () => {
  const valid={verdict:'usable',intent:'Cùng mục đích',contextFit:'Hợp',grammarIssues:[],naturalness:'Tự nhiên',revisedSentence:'Could you slow down a bit?',alternative:'Could you speak a little slower?',uncertainty:''};
  assert.equal(validateAnalysis(valid),valid);
  assert.throws(()=>validateAnalysis({...valid,verdict:'perfect'}),/INVALID_VERDICT/);
  assert.throws(()=>validateAnalysis({...valid,grammarIssues:[{spoken:'x',correction:'y'}]}),/INVALID_GRAMMAR_ISSUE/);
});

test('token refresh and plan limit classification stay explicit', () => {
  const now=new Date('2026-11-26T00:00:00Z');
  assert.equal(tokenNeedsRefresh('2026-11-25T23:00:00Z',3600,now),true);
  assert.equal(tokenNeedsRefresh('2026-11-25T23:50:00Z',3600,now),false);
  assert.equal(isPlanLimitError('subscription_sharing_usage_limit_exceeded'),true);
});

test('provider parses a structured streamed answer and classifies plan limit', async () => {
  const original=globalThis.fetch;
  try {
    const events=[{type:'response.output_text.delta',delta:'{"connected":true}'},{type:'response.completed',response:{usage:{input_tokens:1}}}];
    globalThis.fetch=async()=>new Response(events.map(x=>`data: ${JSON.stringify(x)}\n\n`).join(''),{status:200,headers:{'content-type':'text/event-stream'}});
    const result=await callDeepModel({accessToken:'test-only',body:{store:false,stream:true}});
    assert.deepEqual(result.output,{connected:true});
    globalThis.fetch=async()=>new Response('subscription_sharing_usage_limit_exceeded',{status:429});
    await assert.rejects(callDeepModel({accessToken:'test-only',body:{}}),ProviderLimitError);
  } finally { globalThis.fetch=original; }
});
