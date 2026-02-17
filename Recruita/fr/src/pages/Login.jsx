import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../data/api";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 text-slate-100">
      <div className="w-full max-w-md bg-zinc-900/80 border border-pink-200/20 shadow-2xl rounded-2xl p-8 space-y-6">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-pink-200 to-green-300 shadow-lg mb-4">
            <span className="text-2xl font-bold text-black">R</span>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-green-300 font-semibold">Recruita</p>
          <h1 className="text-3xl font-bold text-pink-200 mt-2">Welcome Back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to manage your talent pipeline</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg px-4 py-3 bg-black border border-zinc-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-pink-200/30 focus:border-pink-200 transition-colors outline-none"
              placeholder="recruiter@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl px-4 py-3 bg-slate-950/50 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-400/50 focus:border-green-400 focus:bg-slate-900/70 transition-all duration-300 outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-linear-to-r from-pink-200 to-pink-300 text-black rounded-lg font-bold hover:from-pink-300 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-sm text-center text-slate-400">
          New here? <Link to="/signup" className="text-green-300 hover:text-green-200 font-semibold transition-colors">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
