import { useNavigate } from "react-router-dom";

const AddEmbeddingsCard = () => {
  const navigate = useNavigate();

  const handleAddEmbeddings = () => {
    // Navigate to the add embeddings page
    navigate("/add-embeddings");
  };

  return (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 ml-3">
          Add Embeddings
        </h3>
      </div>
      <p className="text-gray-600 mb-4">
        Add and manage embeddings for enhanced job matching and recommendations.
      </p>
      <button
        onClick={handleAddEmbeddings}
        className="w-full bg-red-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-800 transition"
      >
        Add Embeddings
      </button>
    </div>
  );
};

export default AddEmbeddingsCard;