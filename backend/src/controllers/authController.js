import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { readPool, writePool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";

export async function register(req, res) {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Protection: Parameterized queries prevent SQL Injection
    const [existingUser] = await readPool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Email already in use." });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await writePool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, email, passwordHash, role]
    );

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [users] = await readPool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        apiCalls: user.api_calls
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
}