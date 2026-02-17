import { useState } from 'react';
import { useResume } from '../context/ResumeContext';

const StudentStatusSelection = ({ onNext, onBack, onSkipEducation }) => {
  const { resumeData, updatePersonal } = useResume();
  const [selectedStatus, setSelectedStatus] = useState(resumeData.personal.isStudent || null);
  
  const statusOptions = [
    { id: 'yes', label: 'Yes', description: 'I am currently a student', icon: '🎓', color: 'from-blue-500 to-indigo-600' },
    { id: 'no', label: 'No', description: 'I am a working professional', icon: '💼', color: 'from-gray-600 to-gray-700' }
  ];

  const handleSelect = (statusId) => {
    setSelectedStatus(statusId);
    // Update the resume context with the selected student status
    updatePersonal({ isStudent: statusId === 'yes' });
  };

  const handleNext = () => {
    if (selectedStatus) {
      if (selectedStatus === 'yes') {
        // If user is a student, go directly to education level selection
        onNext();
      } else {
        // If user is not a student, skip education level and go to main app
        onSkipEducation();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
            <span className="text-3xl">👨‍🎓</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Are you a student?
          </h1>
          <p className="text-gray-600 text-xl max-w-xl mx-auto">
            This helps us prioritize the most relevant sections for your resume
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {statusOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedStatus === option.id
                  ? `border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-xl scale-105`
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 ${
                  selectedStatus === option.id
                    ? 'bg-gradient-to-r ' + option.color + ' text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {option.icon}
                </div>
                <h3 className={`font-bold text-xl mb-2 ${
                  selectedStatus === option.id ? 'text-indigo-700' : 'text-gray-800'
                }`}>
                  {option.label}
                </h3>
                <p className={`text-sm ${
                  selectedStatus === option.id ? 'text-indigo-600' : 'text-gray-600'
                }`}>
                  {option.description}
                </p>
                <div className={`w-6 h-6 rounded-full border-2 mt-4 flex items-center justify-center ${
                  selectedStatus === option.id
                    ? 'border-indigo-500 bg-gradient-to-r ' + option.color
                    : 'border-gray-300'
                }`}>
                  {selectedStatus === option.id && (
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
            disabled={!selectedStatus}
            className={`px-10 py-4 text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
              selectedStatus
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl hover:from-indigo-700 hover:to-purple-700'
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

export default StudentStatusSelection;