import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

// ── Helper: sign a JWT and set it as an httpOnly cookie ──────
const issueTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production", // true in prod, false in dev
    sameSite: "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

// ── Google OAuth ──────────────────────────────────────────────
export const googleAuth = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user      = await User.create({ name, email, avatar });
      isNewUser = true;
    }

    issueTokenCookie(res, user._id);

    return res.status(200).json({
      user,
      isNewUser,
    });

  } catch (error) {
    return res.status(500).json({ message: `google auth error: ${error.message}` });
  }
};

// ── Email / Password Auth ─────────────────────────────────────
// Firebase handles password hashing & verification on the client.
// We just trust the Firebase auth flow and create/fetch the MongoDB
// user, then issue our own JWT cookie so isAuth middleware works.
export const emailAuth = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // New user — create with provided name, default 100 credits
      user = await User.create({
        name:   name || email.split("@")[0], // fallback to email prefix if no name
        email,
        avatar: avatar || "",
      });
      isNewUser = true;
    }

    // Issue JWT cookie — same as Google auth flow
    issueTokenCookie(res, user._id);

    return res.status(200).json({
      user,
      isNewUser,
    });

  } catch (error) {
    return res.status(500).json({ message: `email auth error: ${error.message}` });
  }
};

// ── Logout ────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    return res
      .clearCookie("token", {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({ message: "logout success" });
  } catch (error) {
    return res.status(500).json({ message: `logout error: ${error.message}` });
  }
};

// ── Get current user ──────────────────────────────────────────
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ user: null });
    }
    return res.json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ message: `Error fetching user: ${error.message}` });
  }
};
