import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "test_secret_placeholder";

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default razorpay;
