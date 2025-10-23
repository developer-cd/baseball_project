import express from "express";
import {
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only login and auth-related routes, no public registration
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Example protected route
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
