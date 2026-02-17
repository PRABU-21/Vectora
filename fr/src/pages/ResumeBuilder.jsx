import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ParticlesBackground from "../components/ParticlesBackground";
import GoogleTranslate from "../components/GoogleTranslate";
import ResumeBuilderApp from "../resumeBuilder/App.jsx";
import { ResumeProvider } from "../resumeBuilder/context/ResumeContext.jsx";

const ResumeBuilder = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h8M8 11h5m-6 7h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v11"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vectora</p>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 bg-clip-text text-transparent">
                  Resume Builder
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <GoogleTranslate />
              <button
                onClick={() => navigate("/profile")}
                className="text-gray-700 hover:text-indigo-700 font-medium transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 text-white">
        <ParticlesBackground id="resume-builder-hero" className="opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Craft a standout resume</h2>
            <p className="text-lg text-indigo-100">
              Build, preview, and export resumes without leaving Vectora.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <ResumeProvider>
            <ResumeBuilderApp />
          </ResumeProvider>
        </div>
      </main>
    </div>
  );
};

export default ResumeBuilder;
