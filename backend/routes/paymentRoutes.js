import express from "express";
import {
  createOrder,
  verifyPayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes start with /api/payments
router.post("/order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

export default router;
