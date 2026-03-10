import React, { useState } from 'react';
import { PROJECT_STATUSES } from '../utils/statusUtils';
import {
  Type,
  FileText,
  DollarSign,
  Clock,
  Calendar,
  Plus,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-8 py-6">
          <h2 className="text-3xl font-bold text-white">Post New Project</h2>
          <p className="text-red-100 mt-2 text-lg">Create a compelling project to attract top-tier freelancers.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Core Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Type className="w-4 h-4 text-red-500" /> Project Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all ${errors.title ? 'border-red-500' : 'border-gray-100'}`}
                    placeholder="e.g. Full-Stack E-commerce Platform Development"
                  />
                  {errors.title && <p className="absolute -bottom-6 left-0 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-red-500" /> Project Description
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="8"
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all resize-none ${errors.description ? 'border-red-500' : 'border-gray-100'}`}
                    placeholder="Describe the project scope, requirements, and deliverables..."
                  />
                  {errors.description && <p className="absolute -bottom-6 left-0 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>}
                </div>
              </div>

              {/* Skills */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <CheckCircle className="w-4 h-4 text-red-500" /> Required Skills
                </label>
                <div className={`p-2 bg-gray-50 border-2 rounded-xl focus-within:bg-white focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10 transition-all ${errors.skills ? 'border-red-500' : 'border-gray-100'}`}>
                  <div className="flex flex-wrap gap-2 mb-3 px-2 pt-2">
                    {formData.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-2 hover:bg-white/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-2 pb-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a skill and press Enter..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400"
                    />
                    <button type="button" onClick={handleAddSkill} className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-600 transition-colors"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                {errors.skills && <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.skills}</p>}
              </div>
            </div>

            {/* Right Column: Logistics */}
            <div className="space-y-8">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" /> Budget & Timeline
                </h3>

                {/* Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Min Budget</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        name="minBudget"
                        value={formData.minBudget}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all ${errors.minBudget ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Max Budget</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        name="maxBudget"
                        value={formData.maxBudget}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all ${errors.maxBudget ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                {errors.budget && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.budget}</p>}

                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duration (Weeks)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all ${errors.duration ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      min={minDeadline}
                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all ${errors.deadline ? 'border-red-500' : 'border-gray-200'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Post Project Now <span className="text-xl">→</span>
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">By posting, you agree to our Terms of Service.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;