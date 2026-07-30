import jwt from 'jsonwebtoken'

export const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24
}

export function newToken(user){
  return jwt.sign(
    { user },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}
