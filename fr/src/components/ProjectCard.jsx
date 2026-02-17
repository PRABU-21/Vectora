import React from 'react';
import { getStatusColor } from '../utils/statusUtils';

const ProjectCard = ({ project, onStatusChange, onViewDetail, showStatusControls = false }) => {
  const projectId = project._id || project.id;
  const postedDate = project.postedDate || project.createdAt || project.updatedAt;

  return (
    <div
      className="group relative bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
      onClick={() => onViewDetail && onViewDetail(project)}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
          <p className="text-gray-600 mb-3">{project.description}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {project.skills?.map((skill, index) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {skill}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Budget:</span> ${project.minBudget} - ${project.maxBudget}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {project.duration} weeks
            </div>
            <div>
              <span className="font-medium">Deadline:</span> {new Date(project.deadline).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Applicants:</span> {project.applicants ?? 0}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="text-sm text-gray-500">
            Posted: {postedDate ? new Date(postedDate).toLocaleDateString() : '—'}
          </div>
          {onStatusChange && showStatusControls && (
            <div className="flex space-x-2">
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(projectId, 'Open'); }}
                className={`px-3 py-1 text-xs rounded-md ${project.status === 'Open'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
              >
                Open
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(projectId, 'In Progress'); }}
                className={`px-3 py-1 text-xs rounded-md ${project.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
              >
                Progress
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(projectId, 'Completed'); }}
                className={`px-3 py-1 text-xs rounded-md ${project.status === 'Completed'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
              >
                Complete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;