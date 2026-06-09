import Razorpay from "razorpay"
import crypto from "crypto"
import User from "../models/user.model.js"

let razorpayClient

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env")
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayClient
}

// ─── Credit Packs ─────────────────────────────────────────────────────────────
export const CREDIT_PACKS = {
  starter:    { credits: 100,  amountPaise: 49900,  label: "Starter",    popular: false },
  basic:      { credits: 300,  amountPaise: 99900,  label: "Basic",      popular: false },
  pro:        { credits: 700,  amountPaise: 199900, label: "Pro",        popular: true  },
  growth:     { credits: 1500, amountPaise: 399900, label: "Growth",     popular: false },
  agency:     { credits: 3000, amountPaise: 699900, label: "Agency",     popular: false },
}

// ─── Create Razorpay Order ─────────────────────────────────────────────────────
// POST /api/payment/create-order
// body: { packId }
export const createOrder = async (req, res) => {
  try {
    const { packId } = req.body
    const user = req.user

    const pack = CREDIT_PACKS[packId]
    if (!pack) {
      return res.status(400).json({ success: false, message: "Invalid pack selected" })
    }

    const order = await getRazorpay().orders.create({
      amount:   pack.amountPaise,  // in paise
      currency: "INR",
      receipt:  `rcpt_${Date.now()}`,
      notes: {
        userId:  user._id.toString(),
        packId,
        credits: pack.credits.toString(),
        email:   user.email,
      },
    })

    return res.json({
      success: true,
      order: {
        id:       order.id,
        amount:   order.amount,
        currency: order.currency,
      },
      pack: {
        credits: pack.credits,
        label:   pack.label,
        amount:  pack.amountPaise / 100,
      },
      key: process.env.RAZORPAY_KEY_ID,
      user: {
        name:  user.name,
        email: user.email,
      },
    })
  } catch (e) {
    console.error("[createOrder]", e)
    return res.status(500).json({ success: false, message: e.message })
  }
}

// ─── Verify Payment & Add Credits ─────────────────────────────────────────────
// POST /api/payment/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, packId }
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      packId,
    } = req.body
    const user = req.user

    // ── Cryptographic signature verification ──────────────────────────────────
    // This is the secure way — signature can't be faked without the secret key
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (expectedSig !== razorpay_signature) {
      console.error("[verifyPayment] Signature mismatch — possible fraud attempt")
      return res.status(400).json({ success: false, message: "Payment verification failed" })
    }

    // ── Signature valid — add credits ─────────────────────────────────────────
    const pack = CREDIT_PACKS[packId]
    if (!pack) {
      return res.status(400).json({ success: false, message: "Invalid pack" })
    }

    // Double-check order via Razorpay API to prevent replay attacks
    const order = await getRazorpay().orders.fetch(razorpay_order_id)
    if (order.status !== "paid") {
      return res.status(400).json({ success: false, message: "Order not paid" })
    }

    // Check if this payment was already processed (idempotency)
    const freshUser = await User.findById(user._id)
    if (freshUser.lastPaymentId === razorpay_payment_id) {
      return res.json({
        success:  true,
        message:  "Already processed",
        credits:  freshUser.credits,
        newTotal: freshUser.credits,
      })
    }

    freshUser.credits        += pack.credits
    freshUser.lastPaymentId   = razorpay_payment_id
    freshUser.totalPurchased  = (freshUser.totalPurchased || 0) + pack.credits
    await freshUser.save()

    console.log(`[Payment] ✅ ${freshUser.email} bought ${pack.credits} credits (${pack.label})`)

    return res.json({
      success:      true,
      message:      `${pack.credits} credits added successfully!`,
      credits:      freshUser.credits,
      newTotal:     freshUser.credits,
      creditsAdded: pack.credits,
    })
  } catch (e) {
    console.error("[verifyPayment]", e)
    return res.status(500).json({ success: false, message: e.message })
  }
}

// ─── Get Pack Info (for frontend display) ─────────────────────────────────────
export const getPacks = async (req, res) => {
  const packs = Object.entries(CREDIT_PACKS).map(([id, p]) => ({
    id,
    credits:  p.credits,
    amount:   p.amountPaise / 100,
    label:    p.label,
    popular:  p.popular,
    perCredit: Math.round(p.amountPaise / p.credits) / 100,
  }))
  return res.json({ success: true, packs })
}
