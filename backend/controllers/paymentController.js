import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Proposal from "../models/Proposal.js";
import Project from "../models/Project.js";

// @desc    Create Razorpay order for an accepted/submitted proposal
// @route   POST /api/payments/order
// @access  Private (project owner)
export const createOrder = async (req, res) => {
  try {
    const { proposalId, amount } = req.body;

    if (!proposalId) {
      return res.status(400).json({ message: "proposalId is required" });
    }

    const proposal = await Proposal.findById(proposalId).populate("projectId");
    if (!proposal || !proposal.projectId) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Ensure current user owns the project
    if (proposal.projectId.postedBy.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to pay for this project" });
    }

    // Use expectedCost by default; allow override only if greater than zero
    const payableAmount = Number(amount || proposal.expectedCost);
    if (!payableAmount || payableAmount <= 0) {
      return res.status(400).json({ message: "Invalid payable amount" });
    }

    // Razorpay requires receipt length <= 40; keep it compact
    const shortReceipt = `r_${proposal.projectId._id.toString().slice(-6)}_${proposal._id
      .toString()
      .slice(-6)}_${Date.now().toString().slice(-4)}`;

    const options = {
      amount: Math.round(payableAmount * 100), // INR paise
      currency: "INR",
      receipt: shortReceipt,
      notes: {
        projectId: proposal.projectId._id.toString(),
        proposalId: proposal._id.toString(),
        freelancerId: proposal.freelancerId.toString(),
        clientId: req.userId.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    proposal.paymentStatus = "created";
    proposal.paymentOrderId = order.id;
    proposal.paymentAmount = payableAmount;
    await proposal.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    const msg =
      error?.error?.description || error?.message || "Failed to create order";
    res.status(500).json({ message: msg });
  }
};

// @desc    Verify Razorpay payment signature and mark proposal/project paid
// @route   POST /api/payments/verify
// @access  Private (project owner)
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      proposalId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !proposalId
    ) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const proposal = await Proposal.findById(proposalId).populate("projectId");
    if (!proposal || !proposal.projectId) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Ensure current user owns the project
    if (proposal.projectId.postedBy.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to verify this payment" });
    }

    // Ensure the order being verified matches the one created
    if (
      proposal.paymentOrderId &&
      proposal.paymentOrderId !== razorpay_order_id
    ) {
      return res
        .status(400)
        .json({ message: "Order mismatch for this proposal" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res
        .status(500)
        .json({ message: "Razorpay secret not configured" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    proposal.paymentStatus = "paid";
    proposal.paymentOrderId = razorpay_order_id;
    proposal.paymentId = razorpay_payment_id;
    proposal.paymentSignature = razorpay_signature;
    proposal.status = "Completed";
    await proposal.save();

    // Mark project completed when payment is verified
    if (proposal.projectId.status !== "Completed") {
      proposal.projectId.status = "Completed";
      await proposal.projectId.save();
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      proposal,
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ message: error.message || "Verification failed" });
  }
};
