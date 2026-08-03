import { pool } from '../config/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import {newToken, TOKEN_COOKIE_OPTIONS} from '../utils/jwt.js'

const createUser = async (req, res) => {
  console.log('createUser')
  const { email, username, password, password2 } = req.body;

  try {
    // Check existing account
    const emailExists = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );

    if (emailExists.rowCount > 0) {
      return res.status(409).json({
        field: "email",
        error: "Email already exists"
      });
    }

    const usernameExists = await pool.query(
      "SELECT 1 FROM users WHERE username = $1",
      [username]
    );

    if (usernameExists.rowCount > 0) {
      return res.status(409).json({
        field: "username",
        error: "Username already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(`
      WITH new_row AS (
        INSERT INTO users (username)
        VALUES ($1)
        RETURNING user_id, username
      )
      INSERT INTO credentials (user_id, email, pw_hash)
      SELECT new_row.user_id, $2, $3
      FROM new_row
      RETURNING user_id
    `, [username, email, passwordHash]);

    const user = result.rows[0];
    const token = newToken(user)
    res.cookie("access_token", token, TOKEN_COOKIE_OPTIONS);
    return res.status(201).json({
      user: {
        user_id: user.user_id,
        username: user.username,
      }
    });

  } catch (error) {
    // Handle race condition if DB unique constraint catches duplicate
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Email or username already exists"
      });
    }

    console.error(error.message);
    return res.status(500).json({error: "Internal server error"});
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body
    // Authenticate user and return token/session

    const result = await pool.query(`
      SELECT 
        u.user_id, u.username, c.pw_hash
        FROM users AS u
      JOIN credentials AS c
        ON u.user_id = c.user_id
      WHERE username = $1
    `, [username]);

    if (result.rowCount === 0) {
      return res.status(409).json({
        field: "username",
        error: "Username not found"
      });
    }

    var user = result.rows[0]

    // compare hash
    const valid = await bcrypt.compare(password, user.pw_hash);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    delete user.pw_hash
    const token = newToken(user);

    res.cookie("access_token", token, TOKEN_COOKIE_OPTIONS);

    return res.status(200).json({user});
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const logout = async (req, res) => {
  // Invalidate session/token
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.status(200).json({ message: "Logged out" });
}

export default { createUser, login, logout }
