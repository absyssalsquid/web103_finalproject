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

export const validateJWT = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.token_payload = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// requires validateJWT to have already run; only allows the request to
// proceed if the :id route param matches the authenticated user's own id
export const requireOwnUser = (req, res, next) => {
  const { user_id } = req.token_payload.user;

  if (String(req.params.id) !== String(user_id)) {
    return res.status(403).json({ message: "You may only update your own profile." });
  }

  next();
};