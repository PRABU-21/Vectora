import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddEmbeddingsCard from "../components/AddEmbeddingsCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <nav className="bg-black shadow-lg w-full flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Madathon</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-white font-medium">
                  Welcome, {user.name}
                </span>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="text-white hover:text-red-400 font-medium transition"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="bg-white text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full">
            <h2 className="text-3xl font-bold text-red-700 mb-8">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Job Recommendations Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg
                    className="w-6 h-6 text-red-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 ml-3">
                  Job Recommendations
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Discover personalized job opportunities tailored to your skills
                and experience.
              </p>
              <button
                onClick={() => navigate("/job-recommendations")}
                className="w-full bg-red-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-800 transition"
              >
                View Jobs
              </button>
            </div>

            {/* Update Profile Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg
                    className="w-6 h-6 text-red-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 ml-3">
                  Update Profile
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Upload your resume to enhance your profile and get better job
                matches.
              </p>
              <button
                onClick={() => navigate("/profile")}
                className="w-full bg-red-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-800 transition"
              >
                Upload Resume
              </button>
            </div>

            {/* Freelancers Module Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg
                    className="w-6 h-6 text-red-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 ml-3">
                  Freelancers Module
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Connect with talented freelancers or offer your services to
                clients.
              </p>
              <button className="w-full bg-red-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-800 transition">
                Explore Freelancers
              </button>
            </div>
            
            {/* Add Embeddings Card */}
            <AddEmbeddingsCard />
          </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;