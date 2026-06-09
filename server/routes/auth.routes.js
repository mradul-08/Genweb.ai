import express from "express"
import { googleAuth, emailAuth, logout } from "../controllers/auth.controller.js"

const authRouter = express.Router()

authRouter.post("/google", googleAuth)
authRouter.post("/email", emailAuth)   // ← NEW: email/password auth
authRouter.get("/logout", logout)

export default authRouter
