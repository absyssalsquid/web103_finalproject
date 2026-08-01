import jwt from 'jsonwebtoken'

// requires JWT
export const requireJWT = (req, res, next) => {
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

// optional jwt, for showing likes
export const checkJWT = (req, res, next) => {
  const token = req.cookies.access_token;

  if (token) {
    try {
      req.token_payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {}
  }

  next();
};