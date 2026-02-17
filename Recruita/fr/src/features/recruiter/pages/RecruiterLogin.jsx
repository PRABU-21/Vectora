import { useState } from 'react';
import { recruiterAPI } from '../../../utils/api';
import { useNavigate, Link } from 'react-router-dom';

const RecruiterLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await recruiterAPI.login(formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'recruiter');
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/recruiter/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 sm:p-7 text-white">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Recruiter Login</h1>
          <p className="mt-1 text-sm text-white/70">Welcome back! Manage your job postings.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@company.com"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm text-white/70">
          <p>
            Don&apos;t have an account?{' '}
            <Link className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white/70" to="/recruiter/signup">
              Sign up
            </Link>
          </p>
          <p>
            <Link className="text-white/80 underline decoration-white/20 underline-offset-4 hover:text-white" to="/">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecruiterLogin;
