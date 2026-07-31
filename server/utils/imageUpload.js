import { randomUUID } from 'node:crypto'
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js'

const CASE_IMAGE_FOLDER = 'bird-court/cases'

// Uploads a case image buffer to Cloudinary and resolves { url, publicId }.
// Rejects with a sanitized Error — never the raw Cloudinary error/payload.
export function uploadCaseImage(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return Promise.reject(new Error('Image upload requires a file buffer.'))
  }
  if (!isCloudinaryConfigured) {
    return Promise.reject(new Error('Image storage is not configured.'))
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CASE_IMAGE_FOLDER,
        public_id: randomUUID(),
        resource_type: 'image',
      },
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

// Best-effort cleanup of an orphaned Cloudinary asset. Callers should catch
// and log failures rather than let them mask the original error.
export function deleteCaseImage(publicId) {
  if (!publicId) return Promise.resolve()
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}
