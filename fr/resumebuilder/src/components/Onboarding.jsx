import { useState } from 'react';

const Onboarding = ({ onStart }) => {
  const steps = [
    {
      title: "Choose a template",
      description: "Select from our professionally designed templates"
    },
    {
      title: "Fill guided details",
      description: "Complete your information in easy steps"
    },
    {
      title: "Download your resume",
      description: "Export as PDF with one click"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
            Create your resume in just a few simple steps
          </h1>
          
          <div className="space-y-6 mb-10">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mt-1">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={onStart}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-transform duration-200"
          >
            Create My Resume
          </button>
        </div>
        
        <div className="hidden md:flex justify-center items-center">
          {/* Minimal decorative illustration */}
          <div className="relative">
            <div className="w-80 h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-xl p-6">
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded mb-1 w-full"></div>
                <div className="h-3 bg-gray-100 rounded mb-1 w-5/6"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded mb-2 w-2/5"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-100 rounded w-16 flex-1"></div>
                  <div className="h-6 bg-gray-100 rounded w-16 flex-1"></div>
                  <div className="h-6 bg-gray-100 rounded w-16 flex-1"></div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;