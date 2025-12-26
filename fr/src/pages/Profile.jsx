import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadMessage("Please upload a PDF file only");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    setUploading(true);
    setUploadMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/auth/upload-resume",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update user data in localStorage
      const updatedUser = { ...user, resume: response.data.resume };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setUploadMessage("Resume uploaded successfully!");
    } catch (error) {
      setUploadMessage(
        error.response?.data?.message || "Failed to upload resume"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <nav className="bg-black shadow-lg w-full fixed top-0 left-0 right-0 z-50">
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
                onClick={() => navigate("/dashboard")}
                className="text-white hover:text-red-400 font-medium transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="text-red-400 font-medium"
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

      <main className="flex-1 flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
            <h2 className="text-3xl font-bold text-red-700 mb-6">Profile</h2>
            {user && (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <p className="text-lg text-gray-900">{user.name}</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <p className="text-lg text-gray-900">{user.email}</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <p className="text-lg text-gray-900">{user.phoneNumber}</p>
                </div>

                {/* Resume Upload Section */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Resume
                  </label>
                  {user.resume ? (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <svg
                          className="w-6 h-6 text-red-700 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-gray-700">Resume uploaded</span>
                      </div>
                      <label className="cursor-pointer text-red-700 hover:text-red-800 font-medium">
                        Replace
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-red-700 transition">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">
                        Click to upload resume (PDF only)
                      </span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  {uploading && (
                    <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                  )}
                  {uploadMessage && (
                    <p
                      className={`text-sm mt-2 ${
                        uploadMessage.includes("success")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {uploadMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
