import { randomUUID } from 'node:crypto'
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js'

const CASE_IMAGE_FOLDER = 'bird-court/cases'
const PROFILE_IMAGE_FOLDER = 'bird-court/profiles'

// Shared upload_stream wrapper. Resolves { url, publicId } from Cloudinary's
// secure_url/public_id. Rejects with a sanitized Error — never the raw
// Cloudinary error/payload.
function uploadImage(buffer, options) {
  if (!Buffer.isBuffer(buffer)) {
    return Promise.reject(new Error('Image upload requires a file buffer.'))
  }
  if (!isCloudinaryConfigured) {
    return Promise.reject(new Error('Image storage is not configured.'))
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', ...options },
      (error, result) => {
        if (error) {
          console.log('Cloudinary upload error:', error.message)
          return reject(new Error('Image upload failed.'))
        }
        if (!result?.secure_url || !result?.public_id) {
          console.log('Cloudinary upload returned an incomplete result.')
          return reject(new Error('Image upload failed.'))
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

// Uploads a case image buffer to Cloudinary and resolves { url, publicId }.
export function uploadCaseImage(buffer) {
  return uploadImage(buffer, {
    folder: CASE_IMAGE_FOLDER,
    public_id: randomUUID(),
  })
}

// Best-effort cleanup of an orphaned Cloudinary asset. Callers should catch
// and log failures rather than let them mask the original error.
export function deleteCaseImage(publicId) {
  if (!publicId) return Promise.resolve()
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}

// Deterministic per-user path — the same public ID every time, so no
// database column is needed to track it, and re-uploading (overwrite: true)
// replaces the previous avatar at that same path.
function profilePublicId(userId) {
  return `user-${userId}`
}

// Uploads a profile image buffer to Cloudinary at the given user's
// deterministic path, resolving { url, publicId }. overwrite replaces any
// existing asset at that path; invalidate busts the CDN cache so the new
// image is served immediately at the same (stable) secure_url.
export function uploadProfileImage(buffer, userId) {
  return uploadImage(buffer, {
    folder: PROFILE_IMAGE_FOLDER,
    public_id: profilePublicId(userId),
    overwrite: true,
    invalidate: true,
  })
}

// Deletes the given user's profile image, if any. Best-effort — callers
// should catch and log failures rather than let them mask another error.
// Not currently wired into any route — there is no clear-image contract
// from the frontend yet (see the profile-update controller for context).
export function deleteProfileImage(userId) {
  return cloudinary.uploader.destroy(
    `${PROFILE_IMAGE_FOLDER}/${profilePublicId(userId)}`,
    { resource_type: 'image' }
  )
}
