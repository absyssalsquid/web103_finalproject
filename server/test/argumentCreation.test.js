import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeArgumentSubmission, createArgumentSubmissionValidator } from '../middleware/submissionValidation.js'
import { createArgumentController } from '../controllers/arguments.js'
import { pool } from '../config/database.js'

const USER_ID = 7
const VALID_TEXT = 'a'.repeat(20)
const VALID_CASE = { phase: 'ARGUMENT', phase_end: '2026-07-31T12:00:00.000Z' }

// ---------------------------------------------------------------- helpers

function fakeReq({ body, params = {} } = {}) {
  return { body, params, token_payload: { user: { user_id: USER_ID } } }
}

function fakeRes() {
  const res = { statusCode: null, body: null }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (payload) => { res.body = payload; return res }
  return res
}

function runNormalize(reqOpts) {
  const req = fakeReq(reqOpts)
  const res = fakeRes()
  let nextCalled = false
  normalizeArgumentSubmission(req, res, () => { nextCalled = true })
  return { req, res, nextCalled }
}

// query stub for validateArgumentSubmission: resolves canned rows per query
// shape, or throws when `failOn(text)` matches.
function makeValidatorQuery({
  caseRows = [VALID_CASE],
  caseCitationCount = null, // null = "match whatever was asked for"
  evidenceCitationCount = null,
  failOn = () => false,
} = {}) {
  const calls = []
  const query = async (text, params) => {
    calls.push({ text, params })
    if (failOn(text)) throw new Error('simulated DB failure')
    if (/SELECT\s+phase,\s+phase_end/.test(text))
      return { rows: caseRows }
    if (/SELECT COUNT\(\*\) FROM cases WHERE case_id = ANY/.test(text))
      return { rows: [{ count: caseCitationCount ?? params[0].length }] }
    if (/SELECT COUNT\(\*\) FROM evidence WHERE evidence_id = ANY/.test(text))
      return { rows: [{ count: evidenceCitationCount ?? params[0].length }] }
    return { rows: [] }
  }
  query.calls = calls
  return query
}

// isBelowSubmissionLimit (the daily-limit check) is a separate helper that
// always calls the real `pool.query` directly — it isn't part of the
// injected `query` parameter. Stub the real pool just for that COUNT(*)
// call so the participation-limit check always passes, without touching
// isBelowSubmissionLimit's signature (shared by other, untouched validators).
const realPoolQuery = pool.query.bind(pool)
async function runValidate(body, queryOpts) {
  const query = makeValidatorQuery(queryOpts)
  const validate = createArgumentSubmissionValidator(query)
  const req = fakeReq({ body })
  const res = fakeRes()
  let nextCalled = false
  pool.query = async () => ({ rows: [{ count: 0 }] })
  try {
    await validate(req, res, () => { nextCalled = true })
  } finally {
    pool.query = realPoolQuery
  }
  return { req, res, nextCalled, query }
}

// fake transaction client for createArgument's controller tests
function makeFakeClient({ nextNum = 1, onQuery } = {}) {
  const calls = []
  const client = { released: false }
  client.query = async (text, params) => {
    calls.push({ text, params })
    if (onQuery) {
      const result = await onQuery(text, params, calls)
      if (result !== undefined) return result
    }
    if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(text)) return {}
    if (/FOR UPDATE/.test(text)) return { rows: [{ case_id: params[0] }] }
    if (/COALESCE\(MAX\(arg_num\)/.test(text)) return { rows: [{ next_num: nextNum }] }
    if (/INSERT INTO arguments/.test(text)) {
      const [case_id, user_id, arg_num, text_val, argument_tag] = params
      return { rows: [{ arg_id: 100, case_id, user_id, arg_num, text: text_val, argument_tag, created_at: '2026-01-01T00:00:00.000Z', up_votes: 0, down_votes: 0 }] }
    }
    if (/INSERT INTO argument_evidence_refs/.test(text)) return {}
    if (/INSERT INTO argument_case_refs/.test(text)) return {}
    return { rows: [] }
  }
  client.release = () => { client.released = true }
  client.calls = calls
  return client
}

async function runCreateArgument(body, client) {
  const controller = createArgumentController({ pool: { connect: async () => client } })
  const req = fakeReq({ body })
  const res = fakeRes()
  await controller(req, res)
  return res
}

// ------------------------------------------------------- normalization

test('canonical nested request: case_id comes from req.params.id', () => {
  const { req, nextCalled } = runNormalize({
    params: { id: '5' },
    body: { text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [] },
  })
  assert.equal(nextCalled, true)
  assert.equal(req.body.case_id, 5)
})

test('currently deployed frontend payload on the flat route', () => {
  const { req, nextCalled } = runNormalize({
    params: {},
    body: { id: '5', content: VALID_TEXT, argument_tag: 'DEFENSE', case_ids: [1, 2], evidence_ids: [3] },
  })
  assert.equal(nextCalled, true)
  assert.equal(req.body.case_id, 5)
  assert.equal(req.body.text, VALID_TEXT)
  assert.deepEqual(req.body.case_citations, [1, 2])
  assert.deepEqual(req.body.evidence_citations, [3])
})

test('legacy flat route with canonical case_id field name', () => {
  const { req, nextCalled } = runNormalize({
    params: {},
    body: { case_id: '9', text: VALID_TEXT, argument_tag: 'PROSECUTION' },
  })
  assert.equal(nextCalled, true)
  assert.equal(req.body.case_id, 9)
})

test('conflicting route and body case IDs return 400', () => {
  const { res, nextCalled } = runNormalize({
    params: { id: '5' },
    body: { case_id: '9', text: VALID_TEXT, argument_tag: 'PROSECUTION' },
  })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /does not match the route/)
})

test('matching route and body case IDs are not a conflict', () => {
  const { req, nextCalled } = runNormalize({
    params: { id: '5' },
    body: { id: '5', text: VALID_TEXT, argument_tag: 'PROSECUTION' },
  })
  assert.equal(nextCalled, true)
  assert.equal(req.body.case_id, 5)
})

test('conflicting text and content return 400', () => {
  const { res, nextCalled } = runNormalize({
    body: { text: 'one thing', content: 'a totally different thing', argument_tag: 'PROSECUTION', case_id: 1 },
  })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /text and content/)
})

test('matching text and content (aside from whitespace) is not a conflict', () => {
  const { req, nextCalled } = runNormalize({
    body: { text: '  hello world  ', content: 'hello world', argument_tag: 'PROSECUTION', case_id: 1 },
  })
  assert.equal(nextCalled, true)
  assert.equal(req.body.text, '  hello world  ') // canonical field's raw value wins
})

test('citation alias normalization: equivalent sets in different order are not a conflict', () => {
  const { req, nextCalled } = runNormalize({
    body: {
      case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION',
      case_citations: [1, 2], case_ids: [2, 1],
      evidence_citations: [5], evidence_ids: [5],
    },
  })
  assert.equal(nextCalled, true)
  assert.deepEqual(req.body.case_citations, [1, 2])
  assert.deepEqual(req.body.evidence_citations, [5])
})

test('citation alias conflict returns 400', () => {
  const { res, nextCalled } = runNormalize({
    body: { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [1], case_ids: [2] },
  })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /case_citations and case_ids/)
})

test('omitted citation fields default to empty arrays', () => {
  const { req, nextCalled } = runNormalize({
    body: { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION' },
  })
  assert.equal(nextCalled, true)
  assert.deepEqual(req.body.case_citations, [])
  assert.deepEqual(req.body.evidence_citations, [])
})

// ------------------------------------------------------- citation validation

test('nonexistent case citation is rejected', async () => {
  const { res, nextCalled } = await runValidate(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [999], evidence_citations: [] },
    { caseCitationCount: 0 },
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /cited cases do not exist/)
})

test('nonexistent evidence citation is rejected', async () => {
  const { res, nextCalled } = await runValidate(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [999] },
    { evidenceCitationCount: 0 },
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /cited evidence items do not exist/)
})

test('evidence belonging to a different case is rejected', async () => {
  // simulate: 2 evidence IDs supplied, only 1 actually belongs to case_id 1
  const { res, nextCalled } = await runValidate(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [10, 11] },
    { evidenceCitationCount: 1 },
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /cited evidence items do not exist/)
})

test('no citations passes', async () => {
  const { nextCalled, req } = await runValidate(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [] },
    {},
  )
  assert.equal(nextCalled, true)
  assert.deepEqual(req.body.case_citations, [])
  assert.deepEqual(req.body.evidence_citations, [])
})

test('up to five total citations passes', async () => {
  const { nextCalled } = await runValidate(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [1, 2], evidence_citations: [3, 4, 5] },
    {},
  )
  assert.equal(nextCalled, true)
})

test('more than five total citations is rejected', async () => {
  const { res, nextCalled } = await runValidate(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [1, 2, 3], evidence_citations: [4, 5, 6] },
    {},
  )
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /at most 5/)
})

test('duplicate citation IDs are deduplicated before the cap and existence checks', async () => {
  const { nextCalled, req, query } = await runValidate(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [1, 1, 1], evidence_citations: [2, 2] },
    {},
  )
  assert.equal(nextCalled, true)
  assert.deepEqual(req.body.case_citations, [1])
  assert.deepEqual(req.body.evidence_citations, [2])
  // the existence-check queries should have run against the deduped arrays
  const caseCitationCall = query.calls.find((c) => /cases WHERE case_id = ANY/.test(c.text))
  assert.deepEqual(caseCitationCall.params[0], [1])
})

// ------------------------------------------------------------ controller

test('successful transaction returns 201 with the created argument', async () => {
  const client = makeFakeClient({ nextNum: 1 })
  const res = await runCreateArgument(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [] },
    client,
  )
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.arg_num, 1)
  assert.equal(res.body.case_id, 1)
  assert.deepEqual(res.body.case_citations, [])
  assert.deepEqual(res.body.evidence_citations, [])
  assert.ok(client.calls.some((c) => c.text === 'COMMIT'))
  assert.equal(client.released, true)
})

test('the authenticated user_id is used, never a body value', async () => {
  const client = makeFakeClient({ nextNum: 1 })
  await runCreateArgument(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [], user_id: 999999 },
    client,
  )
  const insertCall = client.calls.find((c) => /INSERT INTO arguments/.test(c.text))
  assert.equal(insertCall.params[1], USER_ID) // param order: case_id, user_id, arg_num, text, argument_tag
})

test('arg_num is assigned sequentially per case, after locking the case row', async () => {
  const client = makeFakeClient({ nextNum: 4 })
  const res = await runCreateArgument(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [] },
    client,
  )
  assert.equal(res.body.arg_num, 4)
  const lockIdx = client.calls.findIndex((c) => /FOR UPDATE/.test(c.text))
  const numIdx = client.calls.findIndex((c) => /COALESCE\(MAX\(arg_num\)/.test(c.text))
  assert.ok(lockIdx !== -1 && numIdx !== -1 && lockIdx < numIdx)
})

test('citations are inserted for the created argument', async () => {
  const client = makeFakeClient({ nextNum: 1 })
  await runCreateArgument(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [2], evidence_citations: [3, 4] },
    client,
  )
  const evRefCall = client.calls.find((c) => /INSERT INTO argument_evidence_refs/.test(c.text))
  const caseRefCall = client.calls.find((c) => /INSERT INTO argument_case_refs/.test(c.text))
  assert.deepEqual(evRefCall.params, [100, [3, 4]])
  assert.deepEqual(caseRefCall.params, [100, [2]])
})

test('rollback after citation insertion failure returns a controlled 500', async () => {
  const client = makeFakeClient({
    nextNum: 1,
    onQuery: (text) => {
      if (/INSERT INTO argument_evidence_refs/.test(text)) throw new Error('simulated ref insert failure')
    },
  })
  const res = await runCreateArgument(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [3] },
    client,
  )
  assert.equal(res.statusCode, 500)
  assert.ok(client.calls.some((c) => c.text === 'ROLLBACK'))
  assert.equal(client.released, true)
  // the argument insert must not have been left committed
  assert.ok(!client.calls.some((c) => c.text === 'COMMIT'))
})

test('a primary-key violation on citation insert is a controlled 400, not a raw 500', async () => {
  const client = makeFakeClient({
    nextNum: 1,
    onQuery: (text) => {
      if (/INSERT INTO argument_case_refs/.test(text)) {
        const err = new Error('duplicate key value violates unique constraint "argument_case_refs_pkey"')
        err.code = '23505'
        err.constraint = 'argument_case_refs_pkey'
        throw err
      }
    },
  })
  const res = await runCreateArgument(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [2], evidence_citations: [] },
    client,
  )
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.error, 'Duplicate citation.')
  assert.ok(client.calls.some((c) => c.text === 'ROLLBACK'))
})

test('a 23505 on an unrelated constraint (e.g. arg_num collision) is NOT reported as a duplicate citation', async () => {
  const client = makeFakeClient({
    nextNum: 1,
    onQuery: (text) => {
      if (/INSERT INTO arguments/.test(text)) {
        const err = new Error('duplicate key value violates unique constraint "arguments_case_id_arg_num_key"')
        err.code = '23505'
        err.constraint = 'arguments_case_id_arg_num_key'
        throw err
      }
    },
  })
  const res = await runCreateArgument(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [] },
    client,
  )
  assert.equal(res.statusCode, 500)
  assert.notEqual(res.body.error, 'Duplicate citation.')
  assert.deepEqual(res.body, { error: 'Internal server error.' })
  assert.ok(client.calls.some((c) => c.text === 'ROLLBACK'))
})

test('the client is always released, even on failure', async () => {
  const client = makeFakeClient({
    nextNum: 1,
    onQuery: (text) => {
      if (/INSERT INTO arguments/.test(text)) throw new Error('simulated insert failure')
    },
  })
  const res = await runCreateArgument(
    { case_id: 1, text: VALID_TEXT, argument_tag: 'PROSECUTION', case_citations: [], evidence_citations: [] },
    client,
  )
  assert.equal(res.statusCode, 500)
  assert.equal(client.released, true)
})
