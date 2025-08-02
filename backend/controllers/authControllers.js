import User from "../models/userModels.js";
import bcrypt from "bcryptjs";
import { jwtToken } from "../utils/jsonWebToken.js";

export const userRegister = async (req, res) => {
  try {
    const {
      fullname,
      username,
      email,
      password,
      profilePic,
      gender,
      publicKey,
    } = req.body;

    //Checking user already exists or not
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({
        message: "User already exist",
      });
    }

    //Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);

    //set default profile Pucture
    const defaultProfilePic =
      profilePic ||
      (gender === "male"
        ? "https://cdn-icons-png.flaticon.com/512/219/219970.png"
        : "https://cdn-icons-png.flaticon.com/512/219/219969.png");

    const newUser = new User({
      fullname,
      username,
      email,
      password: hashPassword,
      gender,
      profilePic: defaultProfilePic,
      publicKey,
    });

    if (newUser) {
      await newUser.save();
      jwtToken(newUser._id, res);
    } else {
      res.status(400).json({
        success: false,
        message: "invalid user data",
      });
    }

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      fullname: newUser.fullname,
      profilePic: newUser.profilePic,
      email: newUser.email,
      message: "User register successfull!",
    });
  } catch (error) {
    //console.log("Registration error", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found. Please register first",
      });
    }

    const comparePassword = bcrypt.compareSync(password, user.password || "");
    if (!comparePassword) {
      return res.status(400).json({
        message: "email or password doesnot match",
      });
    }

    jwtToken(user._id, res);

    return res.status(200).json({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      profilePic: user.profilePic,
      email: user.email,
      message: "User login successfull",
    });
  } catch (error) {
    //console.log("error in login", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const userLogout = async (req, res) => {
  try {
    res.clearCookie("jwt", "", {
      maxAge: 0,
    }),
      res.status(200).json({
        message: "User logout successfully",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server errror",
    });
  }
};

export const updatePublicKey = async (req, res) => {
  try {
    const { userId, publicKey } = req.body;

    if (!userId || !publicKey) {
      return res.status(400).send({
        success: false,
        message: "User ID and public key are required.",
      });
    }

    // Find user and update the public key
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found.",
      });
    }

    // Update the user's public key in the database
    user.publicKey = publicKey;
    await user.save();

    res.status(200).send({
      success: true,
      message: "Public key updated successfully.",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Error updating public key.",
    });
  }
};
