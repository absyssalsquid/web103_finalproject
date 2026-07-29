export const validateCreateUser = (req, res, next) => {
  const { email, username, password, password2 } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({
      error: "email, username, and password are required"
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      error: "Username must be at least 3 characters."
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters."
    });
  }

  if (password != password2) {
    return res.status(400).json({
      error: "Password does not match."
    });
  }

  next();
};

export function validateCaseSubmission(req, res, next) {
  const { object_name, accusation, image} = req.body
  if (object_name.length < 3 || object_name.length > 60) {
    return res.status(400).json({
      error: "Object name must be between 3 and 60 characters."
    });
  }

  if (accusation.length < 20 || accusation.length > 250) {
    return res.status(400).json({
      error: "Accusation must be between 20 and 250 characters."
    });
  }
  next();
}