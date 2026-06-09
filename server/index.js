import "./env.js"
import express from "express"
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import websiteRouter from "./routes/website.routes.js"
import paymentRouter from "./routes/payment.router.js"
import { serveDeployedSite } from "./controllers/website.controller.js"
import cors from "cors"
import cookieParser from "cookie-parser"

const app  = express()
const port = process.env.PORT || 3002

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}))

// ── Public: serve deployed sites at /s/:slug ─────────────────────────────────
// Must be BEFORE the /api routes so Express doesn't confuse them
app.get("/s/:slug", serveDeployedSite)

app.use("/api/auth",    authRouter)
app.use("/api/user",    userRouter)
app.use("/api/website", websiteRouter)
app.use("/api/payment", paymentRouter)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
  connectDb()
})
