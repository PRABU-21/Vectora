import { useState, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';

const TemplateRecommendationModal = ({ onSkip, onRecommend }) => {
  const { resumeData } = useResume();
  const [isVisible, setIsVisible] = useState(true);

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onSkip, 300); // Allow for fade out animation
  };

  const handleRecommend = () => {
    setIsVisible(false);
    setTimeout(() => onRecommend(resumeData), 300); // Allow for fade out animation
  };

  // Auto-close after 10 seconds if user doesn't interact
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isVisible) {
        handleSkip();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <span className="text-2xl">💡</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Need help choosing a template?
          </h2>
          <p className="text-gray-600 text-base mb-8">
            We'll recommend the best templates based on your experience and background.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 text-base font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow"
            >
              Skip
            </button>
            
            <button
              onClick={handleRecommend}
              className="flex-1 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Let's go
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateRecommendationModal;