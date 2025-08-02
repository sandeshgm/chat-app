import jwt from "jsonwebtoken";
import User from "../models/userModels.js";

export const isLogin = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    //console.log(token);

    if (!token)
      return res.status(500).json({
        success: false,
        message: "User unauthorized",
      });

    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decode)
      return res.status(500).json({
        success: false,
        message: "User Unauthorized -Invalid Token!",
      });

    const user = await User.findById(decode.userId).select("-password");
    if (!user)
      return res.status(500).json({
        success: false,
        message: "User not found!",
      });

    (req.user = user), next();
  } catch (error) {
    console.log("error in middlewate ", error.message);
    res.status(500).json({
      success: false,
      message: error,
    });
  }
};
