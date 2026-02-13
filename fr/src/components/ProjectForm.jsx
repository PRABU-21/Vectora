import React, { useState } from 'react';
import { PROJECT_STATUSES } from '../utils/statusUtils';

const ProjectForm = ({ onSubmit }) => {
  const minDeadlineDate = new Date();
  minDeadlineDate.setDate(minDeadlineDate.getDate() + 1); // Backend requires deadline strictly in the future
  const minDeadline = minDeadlineDate.toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: [],
    minBudget: '',
    maxBudget: '',
    duration: '',
    deadline: '',
    status: PROJECT_STATUSES.OPEN
  });
  const [newSkill, setNewSkill] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (formData.skills.length === 0) {
      newErrors.skills = 'At least one skill is required';
    }

    if (!formData.minBudget) {
      newErrors.minBudget = 'Minimum budget is required';
    }

    if (!formData.maxBudget) {
      newErrors.maxBudget = 'Maximum budget is required';
    }

    if (parseFloat(formData.minBudget) > parseFloat(formData.maxBudget)) {
      newErrors.budget = 'Minimum budget cannot be greater than maximum budget';
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Submission deadline is required';
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = 'Deadline must be after today';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Form is valid, submit the data
      console.log('Form submitted:', formData);
      // Submit the form data to parent component
      if (onSubmit) {
        onSubmit(formData);
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        skills: [],
        minBudget: '',
        maxBudget: '',
        duration: '',
        deadline: '',
        status: PROJECT_STATUSES.OPEN
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Post New Project</h2>
          <p className="text-gray-600 mt-1">Create a new project to attract talented freelancers</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'}`}
              placeholder="Enter project title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'}`}
              placeholder="Describe your project in detail"
              rows="5"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills *</label>
            <div className="mb-2">
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-red-100 to-rose-100 text-red-800">
                    {skill}
                    <button 
                      type="button" 
                      className="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`flex-grow px-4 py-3 border rounded-l-xl focus:outline-none focus:ring-2 ${errors.skills ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'}`}
                placeholder="Add a skill (press Enter to add)"
              />
              <button 
                type="button" 
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-4 py-3 rounded-r-xl transition duration-200"
                onClick={handleAddSkill}
              >
                Add
              </button>
            </div>
            {errors.skills && <p className="mt-1 text-sm text-red-600">{errors.skills}</p>}
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="minBudget" className="block text-sm font-medium text-gray-700 mb-1">Min Budget ($)</label>
              <input
                type="number"
                id="minBudget"
                name="minBudget"
                value={formData.minBudget}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.minBudget || errors.budget ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'}`}
                placeholder="0"
              />
              {errors.minBudget && <p className="mt-1 text-sm text-red-600">{errors.minBudget}</p>}
            </div>
            <div>
              <label htmlFor="maxBudget" className="block text-sm font-medium text-gray-700 mb-1">Max Budget ($)</label>
              <input
                type="number"
                id="maxBudget"
                name="maxBudget"
                value={formData.maxBudget}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.maxBudget || errors.budget ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'}`}
                placeholder="0"
              />
              {errors.maxBudget && <p className="mt-1 text-sm text-red-600">{errors.maxBudget}</p>}
              {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
            </div>
          </div>

          {/* Duration and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.duration ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'}`}
                placeholder="Number of weeks"
              />
              {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
            </div>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Submission Deadline *</label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={minDeadline}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.deadline ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'}`}
              />
              <p className="mt-1 text-xs text-gray-500">Pick a date after today (server rejects same-day deadlines).</p>
              {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Project Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value={PROJECT_STATUSES.OPEN}>{PROJECT_STATUSES.OPEN}</option>
              <option value={PROJECT_STATUSES.IN_PROGRESS}>{PROJECT_STATUSES.IN_PROGRESS}</option>
              <option value={PROJECT_STATUSES.COMPLETED}>{PROJECT_STATUSES.COMPLETED}</option>
              <option value={PROJECT_STATUSES.CLOSED}>{PROJECT_STATUSES.CLOSED}</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md hover:shadow-lg">
              Post Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;