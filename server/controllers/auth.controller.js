import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

const issueTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure:   true,
    sameSite: "none",
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
};

export const googleAuth = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    if (!email) return res.status(400).json({ message: "email is required" });

    let user = await User.findOne({ email });
    let isNewUser = false;
    if (!user) {
      user = await User.create({ name, email, avatar });
      isNewUser = true;
    }

    issueTokenCookie(res, user._id);
    return res.status(200).json({ user, isNewUser });

  } catch (error) {
    return res.status(500).json({ message: `google auth error: ${error.message}` });
  }
};

export const emailAuth = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    if (!email) return res.status(400).json({ message: "email is required" });

    let user = await User.findOne({ email });
    let isNewUser = false;
    if (!user) {
      user = await User.create({
        name:   name || email.split("@")[0],
        email,
        avatar: avatar || "",
      });
      isNewUser = true;
    }

    issueTokenCookie(res, user._id);
    return res.status(200).json({ user, isNewUser });

  } catch (error) {
    return res.status(500).json({ message: `email auth error: ${error.message}` });
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .clearCookie("token", {
        httpOnly: true,
        secure:   true,
        sameSite: "none",
      })
      .status(200)
      .json({ message: "logout success" });
  } catch (error) {
    return res.status(500).json({ message: `logout error: ${error.message}` });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) return res.json({ user: null });
    return res.json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ message: `Error fetching user: ${error.message}` });
  }
};