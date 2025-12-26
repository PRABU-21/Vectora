import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadEmbedding } from "../data/api";

const AddEmbeddings = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      setUploadMessage("Please upload a .txt file only");
      setSelectedFile(null);
      setFileContent("");
      return;
    }

    setSelectedFile(file);
    setUploadMessage("");

    // Read the file content
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await uploadEmbedding(formData);
      
      setUploadMessage(response.message || "File uploaded and processed successfully!");
      setIsUploading(false);
    } catch (error) {
      setUploadMessage(error.response?.data?.error || "Failed to upload file");
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <nav className="bg-black shadow-lg w-full h-16 flex-shrink-0">
        <div className="h-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Madathon</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-white hover:text-red-400 font-medium transition"
              >
                Dashboard
              </button>
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

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-red-700 mb-2">
              Add Embeddings
            </h2>
            <p className="text-gray-600">
              Upload a text file to generate embeddings for enhanced job matching
            </p>
          </div>

          {/* File Upload Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Text File
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload a .txt file containing your text data for embedding generation
            </p>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 w-full">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-red-700 transition w-full">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-4"
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
                  <span className="text-sm text-gray-600 text-center">
                    {selectedFile
                      ? selectedFile.name
                      : "Click to upload .txt file"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Only .txt files allowed
                  </span>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isUploading}
                  className="px-6 py-3 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
                
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFileContent("");
                      setUploadMessage("");
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition w-full"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {uploadMessage && (
              <p
                className={`text-sm mt-3 ${
                  uploadMessage.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {uploadMessage}
              </p>
            )}
          </div>

          {/* File Content Preview */}
          {fileContent && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                File Content Preview
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {fileContent}
                </pre>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {fileContent.length} characters in file
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddEmbeddings;