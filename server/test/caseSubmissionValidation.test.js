import assert from 'node:assert/strict'
import test from 'node:test'

import { validateCaseSubmission } from '../middleware/submissionValidation.js'

function runValidation(body) {
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

  validateCaseSubmission(req, res, () => {
    nextCalled = true
  })

  return { req, nextCalled, statusCode, responseBody }
}

function assertValidationError(body, expectedError) {
  const result = runValidation(body)

  assert.equal(result.nextCalled, false)
  assert.equal(result.statusCode, 400)
  assert.deepEqual(result.responseBody, { error: expectedError })
}

test('accepts boundary-length values and trims them before continuing', () => {
  const objectName = 'o'.repeat(3)
  const accusation = 'a'.repeat(250)
  const result = runValidation({
    object_name: `  ${objectName}  `,
    accusation: `\n${accusation}\t`,
  })

  assert.equal(result.nextCalled, true)
  assert.equal(result.statusCode, null)
  assert.equal(result.responseBody, null)
  assert.equal(result.req.body.object_name, objectName)
  assert.equal(result.req.body.accusation, accusation)
})

test('rejects a missing request body without throwing', () => {
  assertValidationError(undefined, 'Object name is required.')
})

test('requires object_name', () => {
  assertValidationError(
    { accusation: 'A valid accusation' },
    'Object name is required.',
  )
})

test('requires accusation', () => {
  assertValidationError(
    { object_name: 'Object' },
    'Accusation is required.',
  )
})

test('requires object_name to be a string', () => {
  assertValidationError(
    { object_name: 123, accusation: 'A valid accusation' },
    'Object name must be a string.',
  )
})

test('requires accusation to be a string', () => {
  assertValidationError(
    { object_name: 'Object', accusation: ['not', 'a', 'string'] },
    'Accusation must be a string.',
  )
})

test('rejects a whitespace-only object_name', () => {
  assertValidationError(
    { object_name: ' \n\t ', accusation: 'A valid accusation' },
    'Object name is required.',
  )
})

test('rejects a whitespace-only accusation', () => {
  assertValidationError(
    { object_name: 'Object', accusation: ' \n\t ' },
    'Accusation is required.',
  )
})

test('validates object_name length after trimming', () => {
  const expectedError = 'Object name must be between 3 and 60 characters.'

  assertValidationError(
    { object_name: '  ab  ', accusation: 'A valid accusation' },
    expectedError,
  )
  assertValidationError(
    { object_name: `  ${'o'.repeat(61)}  `, accusation: 'A valid accusation' },
    expectedError,
  )
})

test('validates accusation length after trimming', () => {
  const expectedError = 'Accusation must be between 10 and 250 characters.'

  assertValidationError(
    { object_name: 'Object', accusation: '  too short  ' },
    expectedError,
  )
  assertValidationError(
    { object_name: 'Object', accusation: `  ${'a'.repeat(251)}  ` },
    expectedError,
  )
})
