import { useState } from 'react';
import { useResume } from '../context/ResumeContext';

const EducationLevelSelection = ({ onNext, onBack }) => {
  const { resumeData, updatePersonal } = useResume();
  const [selectedLevel, setSelectedLevel] = useState(resumeData.personal.educationLevel || null);
  
  const educationLevels = [
    { id: 'secondary', label: 'Secondary School', description: 'High school or equivalent', icon: '📚' },
    { id: 'vocational', label: 'Vocational Certificate / Diploma', description: 'Trade school or professional certification', icon: '🎓' },
    { id: 'apprenticeship', label: 'Apprenticeship / Internship', description: 'On-the-job training program', icon: '💼' },
    { id: 'associate', label: 'Associate Degree', description: '2-year college degree', icon: '🎓' },
    { id: 'bachelor', label: 'Bachelor’s Degree', description: '4-year college degree', icon: '🎓' },
    { id: 'master', label: 'Master’s Degree', description: 'Graduate degree', icon: '🎓' },
    { id: 'doctorate', label: 'Doctorate / PhD', description: 'Highest academic degree', icon: '🎓' },
    { id: 'prefer-not', label: 'Prefer not to answer', description: 'Skip this question', icon: '❓' }
  ];

  const handleSelect = (levelId) => {
    setSelectedLevel(levelId);
    // Update the resume context with the selected education level
    updatePersonal({ educationLevel: levelId });
  };

  const handleNext = () => {
    if (selectedLevel) {
      onNext();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Select the option that best describes your education level
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            This helps us recommend the best template and organize sections for your background
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {educationLevels.map((level) => (
            <div
              key={level.id}
              onClick={() => handleSelect(level.id)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedLevel === level.id
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl scale-105'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  selectedLevel === level.id
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {level.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 ${
                    selectedLevel === level.id ? 'text-purple-700' : 'text-gray-800'
                  }`}>
                    {level.label}
                  </h3>
                  <p className={`text-sm ${
                    selectedLevel === level.id ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {level.description}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedLevel === level.id
                    ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-indigo-600'
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

        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow"
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={!selectedLevel}
            className={`px-10 py-4 text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
              selectedLevel
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl hover:shadow-3xl hover:from-purple-700 hover:to-indigo-700'
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

export default EducationLevelSelection;