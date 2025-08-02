import express from "express";
import {
  userLogin,
  userRegister,
  userLogout,
  updatePublicKey,
} from "../controllers/authControllers.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/logout", userLogout);
router.post("/updatePublicKey", updatePublicKey);

export default router;
