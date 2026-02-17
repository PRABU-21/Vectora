import { useState } from 'react';
import { useResume } from '../context/ResumeContext';

const TemplateSelector = ({ currentTemplate, onTemplateChange }) => {
  const { resumeData } = useResume();
  
  const templates = [
    {
      id: 'classic',
      name: 'Classic Professional',
      description: 'Safe choice for all job roles. Best for freshers, service companies, campus placements',
      preview: (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="text-sm font-bold mb-2">[Name]</div>
          <div className="text-xs text-gray-600 mb-1">[Email] | [Phone] | [LinkedIn]</div>
          <div className="h-px bg-gray-300 my-2"></div>
          <div className="text-xs font-bold mb-1">SUMMARY</div>
          <div className="text-xs mb-2">[Summary text]</div>
          <div className="text-xs font-bold mb-1">SKILLS</div>
          <div className="text-xs mb-2">[Skills list]</div>
          <div className="text-xs font-bold mb-1">EXPERIENCE</div>
          <div className="text-xs mb-2">[Job details]</div>
        </div>
      )
    },
    {
      id: 'modern',
      name: 'Modern Minimal',
      description: 'Clean and contemporary without ATS risk. Best for tech roles, startups',
      preview: (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="text-base font-bold mb-2">[NAME]</div>
          <div className="text-xs text-gray-600 mb-1">[Email] | [Phone] | [LinkedIn]</div>
          <div className="h-px bg-gray-300 my-2"></div>
          <div className="text-xs font-bold mb-1 uppercase tracking-wide">SUMMARY</div>
          <div className="text-xs mb-2">[Summary text]</div>
          <div className="text-xs font-bold mb-1 uppercase tracking-wide">SKILLS</div>
          <div className="text-xs mb-2">[Skills list]</div>
        </div>
      )
    },
    {
      id: 'skills',
      name: 'Skills-First (Tech Focused)',
      description: 'Highlight skills and projects early. Best for AI, Data Science, Full Stack roles',
      preview: (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="text-sm font-bold mb-2">[Name]</div>
          <div className="text-xs text-gray-600 mb-1">[Email] | [Phone] | [LinkedIn]</div>
          <div className="h-px bg-gray-300 my-2"></div>
          <div className="text-xs font-bold mb-1">SKILLS</div>
          <div className="text-xs mb-2">[Skills list]</div>
          <div className="text-xs font-bold mb-1">PROJECTS</div>
          <div className="text-xs mb-2">[Project details]</div>
        </div>
      )
    },
    {
      id: 'academic',
      name: 'Academic / Entry-Level',
      description: 'Students with limited experience. Best for students, fresh graduates, research roles',
      preview: (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="text-sm font-bold mb-2">[Name]</div>
          <div className="text-xs text-gray-600 mb-1">[Email] | [Phone] | [LinkedIn]</div>
          <div className="h-px bg-gray-300 my-2"></div>
          <div className="text-xs font-bold mb-1">EDUCATION</div>
          <div className="text-xs mb-2">[Education details]</div>
          <div className="text-xs font-bold mb-1">COURSEWORK</div>
          <div className="text-xs mb-2">[Coursework list]</div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Select Resume Template</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div 
            key={template.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              currentTemplate === template.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onTemplateChange(template.id)}
          >
            <div className="font-semibold text-gray-800 mb-1">{template.name}</div>
            <div className="text-xs text-gray-600 mb-2">{template.description}</div>
            <div className="text-xs font-medium text-gray-700 mb-2">Preview:</div>
            {template.preview}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;