import express from "express"
import { getCurrentUser, getUserWebsites } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"

const userRouter = express.Router()

userRouter.get("/current", getCurrentUser)
userRouter.get("/websites", isAuth, getUserWebsites)

export default userRouter