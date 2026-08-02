import assert from 'node:assert/strict'
import test from 'node:test'

import { createUpdateUserController } from '../controllers/me.js'

const USER_ID = 42
const UPDATED_ROW = {
  user_id: USER_ID,
  username: 'guiltygoose',
  image_url: 'https://res.cloudinary.com/demo/image/upload/bird-court/profiles/user-42.jpg',
  bio: 'a bird enjoyer',
  flair: null,
  created_at: '2026-01-01T00:00:00.000Z',
}

function fakeRes() {
  const res = { statusCode: null, body: null }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (payload) => { res.body = payload; return res }
  return res
}

function fakeReq({ body = {}, file = undefined } = {}) {
  return {
    body,
    file,
    token_payload: { user: { user_id: USER_ID } },
  }
}

// query stub: resolves with `rows` for every call, or throws when
// `failOn(text)` returns true for that call's SQL text.
function makeQuery({ rows = [UPDATED_ROW], failOn = () => false } = {}) {
  const calls = []
  const query = async (text, params) => {
    calls.push({ text, params })
    if (failOn(text)) throw new Error('simulated DB failure')
    return { rows }
  }
  query.calls = calls
  return query
}

async function run({ body, file, query, uploadProfileImage }) {
  const controller = createUpdateUserController({ query, uploadProfileImage })
  const req = fakeReq({ body, file })
  const res = fakeRes()
  await controller(req, res)
  return { req, res }
}

test('bio-only update still works', async () => {
  const query = makeQuery()
  const { res } = await run({ body: { bio: 'new bio', flair: null }, query })

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, UPDATED_ROW)
  assert.equal(query.calls.length, 1)
  assert.match(query.calls[0].text, /SET bio = \$1, flair = \$2\s+WHERE/)
  assert.deepEqual(query.calls[0].params, ['new bio', null, USER_ID])
})

test('flair-only update still works (ownership check runs first)', async () => {
  const query = makeQuery({ rows: [UPDATED_ROW] })
  const { res } = await run({ body: { bio: null, flair: 7 }, query })

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, UPDATED_ROW)
  // first call is the ownership check, second is the UPDATE
  assert.equal(query.calls.length, 2)
  assert.match(query.calls[0].text, /user_achievements/)
  assert.deepEqual(query.calls[0].params, [USER_ID, 7])
})

test('flair the user has not earned is rejected before any UPDATE', async () => {
  const query = makeQuery({ rows: [] }) // ownership check finds nothing
  const { res } = await run({ body: { bio: null, flair: 99 }, query })

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { error: 'You have not earned that achievement.' })
  assert.equal(query.calls.length, 1) // never reached the UPDATE
})

for (const mimeLabel of ['JPEG', 'PNG', 'WebP']) {
  test(`valid ${mimeLabel} upload updates image_url`, async () => {
    const query = makeQuery()
    const uploadProfileImage = async (buffer, userId) => {
      assert.equal(userId, USER_ID)
      assert.ok(Buffer.isBuffer(buffer))
      return { url: UPDATED_ROW.image_url, publicId: `bird-court/profiles/user-${userId}` }
    }
    const { res } = await run({
      body: { bio: 'hi', flair: null },
      file: { buffer: Buffer.from('fake-bytes') },
      query,
      uploadProfileImage,
    })

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.image_url, UPDATED_ROW.image_url)
    assert.match(query.calls.at(-1).text, /image_url = \$4/)
  })
}

test('image-only update (no bio/flair change) still sends image_url', async () => {
  const query = makeQuery()
  const uploadProfileImage = async () => ({ url: UPDATED_ROW.image_url, publicId: 'x' })
  const { res } = await run({
    body: { bio: null, flair: null },
    file: { buffer: Buffer.from('fake-bytes') },
    query,
    uploadProfileImage,
  })

  assert.equal(res.statusCode, 200)
  assert.deepEqual(query.calls.at(-1).params, [null, null, USER_ID, UPDATED_ROW.image_url])
})

test('image plus bio/flair update sends all fields together', async () => {
  const query = makeQuery({ rows: [UPDATED_ROW] })
  const uploadProfileImage = async () => ({ url: UPDATED_ROW.image_url, publicId: 'x' })
  const { res } = await run({
    body: { bio: 'updated bio', flair: 7 },
    file: { buffer: Buffer.from('fake-bytes') },
    query,
    uploadProfileImage,
  })

  assert.equal(res.statusCode, 200)
  const updateCall = query.calls.at(-1)
  assert.match(updateCall.text, /image_url = \$4/)
  assert.deepEqual(updateCall.params, ['updated bio', 7, USER_ID, UPDATED_ROW.image_url])
})

test('Cloudinary upload failure leaves the database unchanged', async () => {
  const query = makeQuery()
  const uploadProfileImage = async () => { throw new Error('simulated provider outage — sensitive detail') }
  const { res } = await run({
    body: { bio: 'hi', flair: null },
    file: { buffer: Buffer.from('fake-bytes') },
    query,
    uploadProfileImage,
  })

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { error: 'Image upload failed.' })
  assert.equal(query.calls.length, 0) // UPDATE never ran
  assert.ok(!JSON.stringify(res.body).includes('sensitive detail'))
})

test('database failure after a successful upload returns a controlled 500', async () => {
  const query = makeQuery({ failOn: (text) => /UPDATE users/.test(text) })
  const uploadProfileImage = async () => ({ url: UPDATED_ROW.image_url, publicId: 'x' })
  const { res } = await run({
    body: { bio: 'hi', flair: null },
    file: { buffer: Buffer.from('fake-bytes') },
    query,
    uploadProfileImage,
  })

  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { error: 'Internal server error.' })
})

test('no image preserves the current image_url (column omitted from SET)', async () => {
  const query = makeQuery()
  const { res } = await run({ body: { bio: 'hi', flair: null }, query })

  assert.equal(res.statusCode, 200)
  const updateCall = query.calls.at(-1)
  // image_url still appears in RETURNING; it must not appear in SET
  assert.doesNotMatch(updateCall.text, /image_url = \$/)
  assert.equal(updateCall.params.length, 3)
})

test('the authenticated user id determines the upload target, never the body', async () => {
  const query = makeQuery()
  let uploadedUserId = null
  const uploadProfileImage = async (buffer, userId) => {
    uploadedUserId = userId
    return { url: UPDATED_ROW.image_url, publicId: 'x' }
  }
  await run({
    // an attacker-supplied user_id in the body must be ignored entirely
    body: { bio: 'hi', flair: null, user_id: 999999 },
    file: { buffer: Buffer.from('fake-bytes') },
    query,
    uploadProfileImage,
  })

  assert.equal(uploadedUserId, USER_ID)
})

test('response excludes pw_hash', async () => {
  const query = makeQuery() // UPDATED_ROW has no pw_hash key, matching a real RETURNING projection
  const { res } = await run({ body: { bio: 'hi', flair: null }, query })

  assert.equal(res.body.pw_hash, undefined)
  // guards the actual contract: the RETURNING clause itself must never
  // request pw_hash, so a future accidental `RETURNING *` would be caught.
  assert.doesNotMatch(query.calls.at(-1).text, /pw_hash/)
})
