import express from "express"
import { createOrder, verifyPayment, getPacks } from "../controllers/payment.controller.js"
import isAuth from "../middlewares/isAuth.js"

const paymentRouter = express.Router()

paymentRouter.get("/packs",         getPacks)                    // public
paymentRouter.post("/create-order", isAuth, createOrder)        // protected
paymentRouter.post("/verify",       isAuth, verifyPayment)      // protected

export default paymentRouter
