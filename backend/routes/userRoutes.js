import express from "express";
const router = express.Router();
import { isLogin } from "../middleware/isLogin.js";
import {
  getUserBySearch,
  getCurrentChatters,
  getUserById,
} from "../controllers/userControllers.js";

router.get("/search", isLogin, getUserBySearch);
router.get("/currentChatters", isLogin, getCurrentChatters);
router.get("/:id", isLogin, getUserById);

export default router;
