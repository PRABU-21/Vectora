import { useState } from 'react';
import { useResume } from '../context/ResumeContext';

const ExperienceLevelSelection = ({ onNext }) => {
  const { resumeData, updatePersonal } = useResume();
  const [selectedLevel, setSelectedLevel] = useState(resumeData.personal.experienceLevel || null);
  
  const experienceLevels = [
    { id: 'no-experience', label: 'No Experience', description: 'Fresh graduate or career changer', icon: '🎓' },
    { id: 'less-than-3', label: 'Less than 3 Years', description: 'Early career professional', icon: '🚀' },
    { id: '3-5', label: '3–5 Years', description: 'Mid-level professional', icon: '💼' },
    { id: '5-10', label: '5–10 Years', description: 'Senior professional', icon: '🏆' },
    { id: '10-plus', label: '10+ Years', description: 'Executive or expert level', icon: '👑' }
  ];

  const handleSelect = (levelId) => {
    setSelectedLevel(levelId);
    // Update the resume context with the selected experience level
    updatePersonal({ experienceLevel: levelId });
  };

  const handleNext = () => {
    if (selectedLevel) {
      onNext();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <span className="text-2xl">📊</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            How long have you been working?
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            This helps us recommend the best template for your experience level
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {experienceLevels.map((level) => (
            <div
              key={level.id}
              onClick={() => handleSelect(level.id)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedLevel === level.id
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  selectedLevel === level.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {level.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-2 ${
                    selectedLevel === level.id ? 'text-blue-700' : 'text-gray-800'
                  }`}>
                    {level.label}
                  </h3>
                  <p className={`text-sm ${
                    selectedLevel === level.id ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {level.description}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedLevel === level.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedLevel === level.id && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleNext}
            disabled={!selectedLevel}
            className={`px-10 py-4 text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
              selectedLevel
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:to-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow'
            }`}
          >
            Continue to Resume Builder
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperienceLevelSelection;