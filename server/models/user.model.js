import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, unique: true, required: true },
  avatar:   { type: String },
  credits:  { type: Number, default: 100, min: 0 },
  plan:     { type: String, enum: ["free"], default: "free" },

  // ── Payment tracking ───────────────────────────────────────
  lastPaymentId:   { type: String, default: null },  // idempotency
  totalPurchased:  { type: Number, default: 0 },     // lifetime credits bought
  totalSpent:      { type: Number, default: 0 },     // lifetime INR spent
}, { timestamps: true })

const User = mongoose.model("User", userSchema)
export default User
