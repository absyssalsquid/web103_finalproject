import { v2 as cloudinary } from 'cloudinary'

const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

// CLOUDINARY_URL (if present) is read automatically by cloudinary.config()
// from process.env, so only the separate-variable form needs to be passed in.
export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_URL || (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
)

if (isCloudinaryConfigured) {
  cloudinary.config(
    CLOUDINARY_URL
      ? { secure: true }
      : {
          cloud_name: CLOUDINARY_CLOUD_NAME,
          api_key: CLOUDINARY_API_KEY,
          api_secret: CLOUDINARY_API_SECRET,
          secure: true,
        }
  )
}

export default cloudinary
