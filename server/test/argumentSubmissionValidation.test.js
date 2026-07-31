import assert from 'node:assert/strict'
import test from 'node:test'

import { createArgumentSubmissionValidator } from '../middleware/submissionValidation.js'

const VALID_CONTENT = 'a'.repeat(20)
const VALID_CASE = {
  phase: 'ARGUMENT',
  phase_end: '2026-07-31T12:00:00.000Z',
  argument_deadline_active: true,
}

async function runValidation(body, rows = [VALID_CASE]) {
  const queryCalls = []
  const query = async (...args) => {
    queryCalls.push(args)
    return { rows }
  }
  const middleware = createArgumentSubmissionValidator(query)
  const req = { body }
  let nextCalled = false
  let statusCode = null
  let responseBody = null

  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(payload) {
      responseBody = payload
      return this
    },
  }

  await middleware(req, res, () => {
    nextCalled = true
  })

  return {
    req,
    nextCalled,
    statusCode,
    responseBody,
    queryCalls,
  }
}

async function assertValidationError(body, expectedError) {
  const result = await runValidation(body)

  assert.equal(result.nextCalled, false)
  assert.equal(result.statusCode, 400)
  assert.deepEqual(result.responseBody, { error: expectedError })
  assert.equal(result.queryCalls.length, 0)
}

test('rejects a missing request body', async () => {
  await assertValidationError(
    undefined,
    'Request body must be a JSON object.',
  )
})

test('rejects a non-object request body', async () => {
  await assertValidationError(
    [],
    'Request body must be a JSON object.',
  )
})

test('requires a case ID', async () => {
  await assertValidationError(
    { content: VALID_CONTENT },
    'Case ID is required.',
  )
})

test('rejects invalid case-ID types', async (t) => {
  for (const value of [1.5, true, {}, []]) {
    await t.test(String(value), async () => {
      await assertValidationError(
        { caseId: value, content: VALID_CONTENT },
        'Case ID must be a positive integer.',
      )
    })
  }
})

test('rejects null and undefined case IDs', async (t) => {
  for (const value of [null, undefined]) {
    await t.test(String(value), async () => {
      await assertValidationError(
        { caseId: value, content: VALID_CONTENT },
        'Case ID is required.',
      )
    })
  }
})

test('accepts id as a numeric string and normalizes it to a number', async () => {
  const result = await runValidation({ id: '5', content: VALID_CONTENT })

  assert.equal(result.nextCalled, true)
  assert.equal(result.req.body.caseId, 5)
  assert.deepEqual(result.queryCalls[0][1], [5])
})

test('trims caseId as a numeric string and normalizes it to a number', async () => {
  const result = await runValidation({ caseId: ' 5 ', content: VALID_CONTENT })

  assert.equal(result.nextCalled, true)
  assert.equal(result.req.body.caseId, 5)
  assert.deepEqual(result.queryCalls[0][1], [5])
})

test('accepts caseId as a number', async () => {
  const result = await runValidation({ caseId: 8, content: VALID_CONTENT })

  assert.equal(result.nextCalled, true)
  assert.equal(result.req.body.caseId, 8)
  assert.deepEqual(result.queryCalls[0][1], [8])
})

test('rejects invalid numeric strings', async (t) => {
  for (const value of ['5.5', '5abc', '0', '-1']) {
    await t.test(value, async () => {
      await assertValidationError(
        { caseId: value, content: VALID_CONTENT },
        'Case ID must be a positive integer.',
      )
    })
  }
})

test('rejects empty and whitespace-only case-ID strings', async (t) => {
  for (const value of ['', '   ']) {
    await t.test(value || 'empty', async () => {
      await assertValidationError(
        { caseId: value, content: VALID_CONTENT },
        'Case ID is required.',
      )
    })
  }
})

test('rejects zero and negative numeric case IDs', async (t) => {
  for (const value of [0, -1]) {
    await t.test(String(value), async () => {
      await assertValidationError(
        { caseId: value, content: VALID_CONTENT },
        'Case ID must be a positive integer.',
      )
    })
  }
})

test('requires content', async () => {
  await assertValidationError(
    { caseId: 1 },
    'Argument content is required.',
  )
})

test('requires content to be a string', async () => {
  await assertValidationError(
    { caseId: 1, content: 123 },
    'Argument content must be a string.',
  )
})

test('rejects whitespace-only content', async () => {
  await assertValidationError(
    { caseId: 1, content: ' \n\t ' },
    'Argument content is required.',
  )
})

test('rejects 19 characters after trimming', async () => {
  await assertValidationError(
    { caseId: 1, content: `  ${'a'.repeat(19)}  ` },
    'Argument must be between 20 and 600 characters.',
  )
})

test('accepts 20 characters', async () => {
  const result = await runValidation({
    caseId: 1,
    content: 'a'.repeat(20),
  })

  assert.equal(result.nextCalled, true)
})

test('accepts 600 characters', async () => {
  const result = await runValidation({
    caseId: 1,
    content: 'a'.repeat(600),
  })

  assert.equal(result.nextCalled, true)
})

test('rejects 601 characters', async () => {
  await assertValidationError(
    { caseId: 1, content: 'a'.repeat(601) },
    'Argument must be between 20 and 600 characters.',
  )
})

test('trims and normalizes a valid request', async () => {
  const result = await runValidation({
    id: 12,
    content: ` \n${VALID_CONTENT}\t `,
  })

  assert.equal(result.nextCalled, true)
  assert.equal(result.req.body.caseId, 12)
  assert.equal(result.req.body.content, VALID_CONTENT)
})

test('returns 404 for a nonexistent case', async () => {
  const result = await runValidation(
    { caseId: 99, content: VALID_CONTENT },
    [],
  )

  assert.equal(result.nextCalled, false)
  assert.equal(result.statusCode, 404)
  assert.deepEqual(result.responseBody, { error: 'Case not found.' })
})

test('rejects terminal case statuses', async (t) => {
  for (const phase of ['WITHDRAWN', 'DISMISSED', 'CLOSED']) {
    await t.test(phase, async () => {
      const result = await runValidation(
        { caseId: 1, content: VALID_CONTENT },
        [{ ...VALID_CASE, phase }],
      )

      assert.equal(result.nextCalled, false)
      assert.equal(result.statusCode, 400)
      assert.deepEqual(result.responseBody, {
        error: 'Case is not eligible for argument submissions.',
      })
    })
  }
})

test('rejects an inactive argument phase', async () => {
  const result = await runValidation(
    { caseId: 1, content: VALID_CONTENT },
    [{ ...VALID_CASE, phase: 'DISCOVERY' }],
  )

  assert.equal(result.nextCalled, false)
  assert.equal(result.statusCode, 400)
  assert.deepEqual(result.responseBody, {
    error: 'Arguments can only be submitted during the argument phase.',
  })
})

test('rejects an expired argument deadline', async () => {
  const result = await runValidation(
    { caseId: 1, content: VALID_CONTENT },
    [{ ...VALID_CASE, argument_deadline_active: false }],
  )

  assert.equal(result.nextCalled, false)
  assert.equal(result.statusCode, 400)
  assert.deepEqual(result.responseBody, {
    error: 'Argument phase has ended.',
  })
})

test('a valid request reaches the controller', async () => {
  const result = await runValidation({
    caseId: 1,
    content: VALID_CONTENT,
  })

  assert.equal(result.nextCalled, true)
  assert.equal(result.statusCode, null)
  assert.equal(result.responseBody, null)
  assert.equal(result.queryCalls.length, 1)
})
