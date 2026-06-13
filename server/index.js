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
  origin: [
    'http://localhost:5173',
    'https://genweb-ai-delta.vercel.app',
    'https://genwebai-dca16.web.app',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}))

app.get("/s/:slug", serveDeployedSite)

app.use("/api/auth",    authRouter)
app.use("/api/user",    userRouter)
app.use("/api/website", websiteRouter)
app.use("/api/payment", paymentRouter)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
  connectDb()
})