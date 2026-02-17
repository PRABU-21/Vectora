import React, { useState, useEffect } from 'react';

const ProposalForm = ({ project, onSubmit, onCancel, userSubmittedProposals = [] }) => {
  const [formData, setFormData] = useState({
    proposalText: '',
    expectedCost: '',
    expectedDelivery: '',
    portfolioLink: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const MAX_CHARS = 1000;

  useEffect(() => {
    const userHasSubmitted = userSubmittedProposals.some(
      (proposal) => (proposal.projectId?._id || proposal.projectId) === (project?._id || project?.id)
    );
    setHasSubmitted(userHasSubmitted);
  }, [userSubmittedProposals, project]);

  const isDeadlinePassed = project?.deadline ? new Date(project.deadline) < new Date() : false;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'proposalText') {
      if (value.length <= MAX_CHARS) {
        setFormData({ ...formData, [name]: value });
        setCharCount(value.length);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.proposalText.trim()) {
      newErrors.proposalText = 'Proposal text is required';
    } else if (formData.proposalText.length < 50) {
      newErrors.proposalText = 'Proposal must be at least 50 characters';
    }

    if (!formData.expectedCost) {
      newErrors.expectedCost = 'Expected cost is required';
    } else if (parseFloat(formData.expectedCost) <= 0) {
      newErrors.expectedCost = 'Expected cost must be greater than 0';
    } else if (project?.maxBudget && parseFloat(formData.expectedCost) > project.maxBudget) {
      newErrors.expectedCost = `Cost exceeds project maximum budget of $${project.maxBudget}`;
    }

    if (!formData.expectedDelivery) {
      newErrors.expectedDelivery = 'Expected delivery time is required';
    } else if (parseInt(formData.expectedDelivery, 10) <= 0) {
      newErrors.expectedDelivery = 'Delivery time must be greater than 0';
    } else if (project?.duration && parseInt(formData.expectedDelivery, 10) > project.duration) {
      newErrors.expectedDelivery = `Delivery time exceeds project duration of ${project.duration} weeks`;
    }

    if (formData.portfolioLink && !/^(ftp|http|https):\/\/[^ "']+$/.test(formData.portfolioLink)) {
      newErrors.portfolioLink = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (hasSubmitted) {
      setErrors({ submit: 'You have already submitted a proposal for this project' });
      return;
    }
    if (isDeadlinePassed) {
      setErrors({ submit: 'This project deadline has passed' });
      return;
    }

    setIsSubmitting(true);
    try {
      const proposalData = {
        ...formData,
        projectId: project?._id || project?.id,
        description: formData.proposalText,
        submittedAt: new Date().toISOString()
      };
      await onSubmit(proposalData);
      setFormData({ proposalText: '', expectedCost: '', expectedDelivery: '', portfolioLink: '' });
      setCharCount(0);
    } catch (err) {
      setErrors({ submit: 'Failed to submit proposal. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center py-8">
          <div className="text-green-600 text-2xl mb-2">✓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Proposal Submitted</h3>
          <p className="text-gray-600 mb-4">You have already submitted a proposal for this project.</p>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  if (isDeadlinePassed) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center py-8">
          <div className="text-red-600 text-2xl mb-2">✗</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Deadline Passed</h3>
          <p className="text-gray-600 mb-4">This project is no longer accepting proposals.</p>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Submit Your Proposal</h2>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="proposalText" className="block text-sm font-medium text-gray-700 mb-2">
            Proposal Text *
          </label>
          <textarea
            id="proposalText"
            name="proposalText"
            value={formData.proposalText}
            onChange={handleChange}
            rows="6"
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.proposalText ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
            }`}
            placeholder="Describe your approach, experience, and why you're the best fit for this project..."
          />
          <div className="flex justify-between items-center mt-1">
            <div className="text-sm text-gray-500">{charCount}/{MAX_CHARS} characters</div>
            {errors.proposalText && <div className="text-sm text-red-600">{errors.proposalText}</div>}
          </div>
          {charCount > MAX_CHARS - 100 && (
            <div className="text-sm text-red-600">{MAX_CHARS - charCount} characters remaining</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="expectedCost" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Cost ($) *
            </label>
            <input
              type="number"
              id="expectedCost"
              name="expectedCost"
              value={formData.expectedCost}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.expectedCost ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
              }`}
              placeholder="0"
              min="1"
            />
            {errors.expectedCost && <p className="mt-1 text-sm text-red-600">{errors.expectedCost}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Project budget: ${project?.minBudget ?? 0} - ${project?.maxBudget ?? 0}
            </p>
          </div>

          <div>
            <label htmlFor="expectedDelivery" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery (weeks) *
            </label>
            <input
              type="number"
              id="expectedDelivery"
              name="expectedDelivery"
              value={formData.expectedDelivery}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.expectedDelivery ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
              }`}
              placeholder="0"
              min="1"
            />
            {errors.expectedDelivery && <p className="mt-1 text-sm text-red-600">{errors.expectedDelivery}</p>}
            <p className="mt-1 text-xs text-gray-500">Project duration: {project?.duration ?? 0} weeks</p>
          </div>
        </div>

        <div>
          <label htmlFor="portfolioLink" className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio or PDF Link (Optional)
          </label>
          <input
            type="url"
            id="portfolioLink"
            name="portfolioLink"
            value={formData.portfolioLink}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.portfolioLink ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
            }`}
            placeholder="https://your-portfolio.com"
          />
          {errors.portfolioLink && <p className="mt-1 text-sm text-red-600">{errors.portfolioLink}</p>}
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProposalForm;
