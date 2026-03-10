import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPremiumOrder, verifyPremiumPayment } from "../data/api";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 499,
    description: "Unlimited resume parsing for 1 month",
    badge: "Good for trying",
    features: ["Unlimited resume parses", "Profile strength insights", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 1299,
    description: "Unlimited parsing for 3 months + priority fixes",
    badge: "Popular",
    features: ["Unlimited parses", "Priority support", "Early feature access"],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 3999,
    description: "Year-long access for heavy users",
    badge: "Best value",
    features: ["Unlimited parses", "Dedicated support", "Beta features"],
  },
];

const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
};

const Premium = () => {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadRazorpay().catch(() => {});
  }, []);

  const handleCheckout = async (planId) => {
    try {
      setError("");
      setMessage("");
      setLoadingPlan(planId);

      const orderRes = await createPremiumOrder(planId);
      if (!orderRes?.success) {
        throw new Error(orderRes?.message || "Could not start payment");
      }

      await loadRazorpay();

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Vectora Premium",
        description: `${orderRes.plan?.label || planId} plan`,
        order_id: orderRes.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        handler: async function (response) {
          try {
            const verifyRes = await verifyPremiumPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            });
            if (verifyRes?.success) {
              setMessage("Premium activated! You can parse unlimited resumes now.");
              const updatedUser = { ...user, premiumPlan: planId, premiumExpiresAt: verifyRes.premiumExpiresAt };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setTimeout(() => navigate("/profile"), 800);
            } else {
              setError(verifyRes?.message || "Verification failed");
            }
          } catch (err) {
            setError(err?.message || "Verification failed");
          }
        },
        theme: {
          color: "#ef4444",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setError(resp.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      setError(err?.message || "Something went wrong starting checkout");
    } finally {
      setLoadingPlan("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-slate-50">
      <header className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-red-500 font-semibold">Premium</p>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-2">Unlock unlimited resume parsing</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Free plan offers 3 parses. Upgrade for unlimited parsing plus priority support.
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
        >
          Back
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {message && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg">{message}</div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition relative"
            >
              {plan.badge && (
                <span className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                <span className="text-sm text-gray-500">/plan</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlan === plan.id}
                className="mt-6 w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-60"
              >
                {loadingPlan === plan.id ? "Processing..." : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Premium;
