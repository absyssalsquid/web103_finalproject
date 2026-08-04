import assert from 'node:assert/strict'
import test from 'node:test'

import { createJudgeVerdictValidator } from '../middleware/submissionValidation.js'
import { createSubmitJudgeVerdictController } from '../controllers/cases.js'

const JUDGE_ID = 11
const CASE_ID = 42

// ---------------------------------------------------------------- helpers

function fakeReq({ body, params = { id: String(CASE_ID) }, userId = JUDGE_ID } = {}) {
  return { body, params, token_payload: { user: { user_id: userId } } }
}

function fakeRes() {
  const res = { statusCode: null, body: null }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (payload) => { res.body = payload; return res }
  return res
}

function makeValidatorQuery({ rows = [{ judge_id: JUDGE_ID, phase: 'RULING', verdict: null }] } = {}) {
  const calls = []
  const query = async (text, params) => {
    calls.push({ text, params })
    return { rows }
  }
  query.calls = calls
  return query
}

async function runValidate(body, queryOpts, reqOpts) {
  const query = makeValidatorQuery(queryOpts)
  const validate = createJudgeVerdictValidator(query)
  const req = fakeReq({ body, ...reqOpts })
  const res = fakeRes()
  let nextCalled = false
  await validate(req, res, () => { nextCalled = true })
  return { req, res, nextCalled, query }
}

function makeFakePool({ rows = [] } = {}) {
  const calls = []
  const pool = {
    query: async (text, params) => {
      calls.push({ text, params })
      return { rows }
    },
  }
  pool.calls = calls
  return pool
}

async function runSubmit(body, poolOpts, reqOpts) {
  const fakePool = makeFakePool(poolOpts)
  const controller = createSubmitJudgeVerdictController({ pool: fakePool })
  const req = fakeReq({ body, ...reqOpts })
  const res = fakeRes()
  await controller(req, res)
  return { req, res, pool: fakePool }
}

// ------------------------------------------------------------- validation

test('valid GUILTY verdict by assigned judge in RULING phase passes', async () => {
  const { req, nextCalled } = await runValidate({ verdict: 'GUILTY', judge_ruling: 'clearly guilty' }, {})
  assert.equal(nextCalled, true)
  assert.deepEqual(req.body, { case_id: CASE_ID, verdict: 'GUILTY', judge_ruling: 'clearly guilty' })
})

test('valid NOT_GUILTY verdict passes', async () => {
  const { nextCalled, req } = await runValidate({ verdict: 'NOT_GUILTY' }, {})
  assert.equal(nextCalled, true)
  assert.equal(req.body.verdict, 'NOT_GUILTY')
})

test('valid TB_PECKED_AT verdict passes', async () => {
  const { nextCalled, req } = await runValidate({ verdict: 'TB_PECKED_AT' }, {})
  assert.equal(nextCalled, true)
  assert.equal(req.body.verdict, 'TB_PECKED_AT')
})

test('optional judge_ruling omitted normalizes to null', async () => {
  const { req, nextCalled } = await runValidate({ verdict: 'GUILTY' }, {})
  assert.equal(nextCalled, true)
  assert.equal(req.body.judge_ruling, null)
})

test('empty/whitespace-only judge_ruling normalizes to null', async () => {
  const { req, nextCalled } = await runValidate({ verdict: 'GUILTY', judge_ruling: '   \n\t  ' }, {})
  assert.equal(nextCalled, true)
  assert.equal(req.body.judge_ruling, null)
})

test('judge_ruling is trimmed', async () => {
  const { req, nextCalled } = await runValidate({ verdict: 'GUILTY', judge_ruling: '  guilty as charged  ' }, {})
  assert.equal(nextCalled, true)
  assert.equal(req.body.judge_ruling, 'guilty as charged')
})

test('judge_ruling over 300 characters after trimming is rejected', async () => {
  const { res, nextCalled } = await runValidate({ verdict: 'GUILTY', judge_ruling: `  ${'a'.repeat(301)}  ` }, {})
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /at most 300 characters/)
})

test('judge_ruling exactly 300 characters passes', async () => {
  const { nextCalled, req } = await runValidate({ verdict: 'GUILTY', judge_ruling: 'a'.repeat(300) }, {})
  assert.equal(nextCalled, true)
  assert.equal(req.body.judge_ruling.length, 300)
})

test('invalid verdict value is rejected', async () => {
  const { res, nextCalled } = await runValidate({ verdict: 'MAYBE' }, {})
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
})

test('missing verdict is rejected', async () => {
  const { res, nextCalled } = await runValidate({}, {})
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /Verdict is required/)
})

test('missing/non-object body is rejected', async () => {
  const { res, nextCalled } = await runValidate(undefined, {})
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /JSON object/)
})

test('invalid case ID in route param is rejected', async () => {
  const { res, nextCalled } = await runValidate({ verdict: 'GUILTY' }, {}, { params: { id: 'not-a-number' } })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /Invalid case ID/)
})

test('nonexistent case returns 404', async () => {
  const { res, nextCalled } = await runValidate({ verdict: 'GUILTY' }, { rows: [] })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 404)
})

test('wrong judge is rejected with 403', async () => {
  const { res, nextCalled } = await runValidate(
    { verdict: 'GUILTY' },
    { rows: [{ judge_id: 999, phase: 'RULING', verdict: null }] },
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
})

test('a case with no assigned judge (null judge_id) is rejected with 403, not a crash', async () => {
  const { res, nextCalled } = await runValidate(
    { verdict: 'GUILTY' },
    { rows: [{ judge_id: null, phase: 'RULING', verdict: null }] },
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
})

test('wrong phase is rejected with 400', async () => {
  const { res, nextCalled } = await runValidate(
    { verdict: 'GUILTY' },
    { rows: [{ judge_id: JUDGE_ID, phase: 'JURY_DELIBERATION', verdict: null }] },
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /ruling phase/)
})

test('already-decided case is rejected with 409', async () => {
  const { res, nextCalled } = await runValidate(
    { verdict: 'GUILTY' },
    { rows: [{ judge_id: JUDGE_ID, phase: 'RULING', verdict: 'NOT_GUILTY' }] },
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 409)
})

test('request body judge_id/user_id cannot override authorization', async () => {
  // the case belongs to a different judge; a spoofed body judge_id/user_id must not help
  const { res, nextCalled } = await runValidate(
    { verdict: 'GUILTY', judge_id: JUDGE_ID, user_id: JUDGE_ID },
    { rows: [{ judge_id: 999, phase: 'RULING', verdict: null }] },
    { userId: JUDGE_ID },
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
})

// -------------------------------------------------------------- controller

test('successful submission returns 200 with the updated case, phase CLOSED, phase_end null', async () => {
  const updatedRow = {
    case_id: CASE_ID, user_id: 5, object_name: 'the lamp', accusation: 'flickers',
    image_url: null, verdict: 'GUILTY', judge_id: JUDGE_ID, judge_ruling: 'guilty',
    phase: 'CLOSED', phase_start: '2026-08-03T00:00:00.000Z', phase_end: null,
    created_at: '2026-01-01T00:00:00.000Z',
  }
  const { res, pool } = await runSubmit(
    { case_id: CASE_ID, verdict: 'GUILTY', judge_ruling: 'guilty' },
    { rows: [updatedRow] },
  )
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.phase, 'CLOSED')
  assert.equal(res.body.phase_end, null)
  assert.equal(res.body.verdict, 'GUILTY')

  const call = pool.calls[0]
  assert.match(call.text, /SET[\s\S]*phase = 'CLOSED'[\s\S]*phase_end = NULL/)
  assert.match(call.text, /WHERE[\s\S]*judge_id = \$4[\s\S]*phase = 'RULING'[\s\S]*verdict IS NULL/)
})

test('the authenticated user_id (not the body) is used as the judge_id parameter', async () => {
  const { pool } = await runSubmit(
    { case_id: CASE_ID, verdict: 'GUILTY', judge_ruling: null, user_id: 999999, judge_id: 999999 },
    { rows: [{ case_id: CASE_ID, verdict: 'GUILTY', phase: 'CLOSED', phase_end: null }] },
    { userId: JUDGE_ID },
  )
  const call = pool.calls[0]
  // param order: verdict, judge_ruling, case_id, judge_id(user_id)
  assert.equal(call.params[3], JUDGE_ID)
})

test('two submissions cannot both overwrite the verdict: second guarded UPDATE affects no rows -> 409', async () => {
  // simulates the real WHERE clause no longer matching (verdict already set
  // by the first, concurrent submission) — pg returns zero rows, not an error
  const { res } = await runSubmit(
    { case_id: CASE_ID, verdict: 'NOT_GUILTY', judge_ruling: null },
    { rows: [] },
  )
  assert.equal(res.statusCode, 409)
  assert.match(res.body.error, /already been decided/)
})

test('response excludes sensitive fields', async () => {
  const updatedRow = {
    case_id: CASE_ID, user_id: 5, object_name: 'x', accusation: 'y', image_url: null,
    verdict: 'GUILTY', judge_id: JUDGE_ID, judge_ruling: null, phase: 'CLOSED',
    phase_start: '2026-08-03T00:00:00.000Z', phase_end: null, created_at: '2026-01-01T00:00:00.000Z',
  }
  const { res, pool } = await runSubmit({ case_id: CASE_ID, verdict: 'GUILTY', judge_ruling: null }, { rows: [updatedRow] })
  assert.equal(res.body.pw_hash, undefined)
  assert.equal(res.body.email, undefined)
  assert.doesNotMatch(pool.calls[0].text, /pw_hash|credentials/)
})

test('unexpected database failure returns a controlled 500', async () => {
  const throwingPool = { query: async () => { throw new Error('simulated DB outage — internal detail') } }
  const controller = createSubmitJudgeVerdictController({ pool: throwingPool })
  const req = fakeReq({ body: { case_id: CASE_ID, verdict: 'GUILTY', judge_ruling: null } })
  const res = fakeRes()
  await controller(req, res)
  assert.equal(res.statusCode, 500)
  assert.ok(!JSON.stringify(res.body).includes('simulated DB outage'))
})
