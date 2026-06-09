import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const isAuth = async (req, res, next) => {
  try {
    // get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Token not found",
      });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // attach user to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Invalid token",
    });
  }
};

export default isAuth;