import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import Website from "../models/website.model.js"

export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies?.token
    if (!token) return res.json({ user: null })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    return res.json({ user: user || null })
  } catch (error) {
    return res.json({ user: null })
  }
}

export const getUserWebsites = async (req, res) => {
  try {
    const websites = await Website.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('title latestCode deployed deployUrl slug createdAt updatedAt thumbnailBg thumbnailAccent thumbnailTitle')
    return res.json({ websites })
  } catch (error) {
    return res.status(500).json({ message: `Error: ${error.message}` })
  }
}