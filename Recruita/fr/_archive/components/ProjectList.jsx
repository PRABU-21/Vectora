import React, { useState, useMemo } from 'react';
import ProjectCard from './ProjectCard';

const ProjectList = ({ projects, onStatusChange, onViewDetail, showStatusControls = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [durationFilter, setDurationFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy, setSortBy] = useState('latest'); // latest, highest-budget, ending-soon

  // Get all unique skills from projects for filter options
  const allSkills = useMemo(() => {
    const skillsSet = new Set();
    projects.forEach(project => {
      (project.skills || []).forEach(skill => skillsSet.add(skill));
    });
    return Array.from(skillsSet);
  }, [projects]);

  // Filter projects based on search term, budget, duration, and skills
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter (title or skills)
      const matchesSearch = !searchTerm || 
        project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.skills || []).some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Budget filter
      const matchesBudget = 
        (!budgetRange.min || (project.minBudget ?? 0) >= parseInt(budgetRange.min)) &&
        (!budgetRange.max || (project.maxBudget ?? 0) <= parseInt(budgetRange.max));

      // Duration filter
      const matchesDuration = !durationFilter || (project.duration ?? 0) <= parseInt(durationFilter);

      // Skills filter
      const matchesSkills = selectedSkills.length === 0 || 
        selectedSkills.every(skill => (project.skills || []).includes(skill));

      return matchesSearch && matchesBudget && matchesDuration && matchesSkills;
    });
  }, [projects, searchTerm, budgetRange, durationFilter, selectedSkills]);

  // Sort projects based on selected option
  const sortedProjects = useMemo(() => {
    const projectsToSort = [...filteredProjects];
    
    switch (sortBy) {
      case 'latest':
        return projectsToSort.sort((a, b) => new Date(b.postedDate || b.createdAt || 0) - new Date(a.postedDate || a.createdAt || 0));
      case 'highest-budget':
        return projectsToSort.sort(
          (a, b) => ((b.maxBudget ?? 0) + (b.minBudget ?? 0)) - ((a.maxBudget ?? 0) + (a.minBudget ?? 0))
        );
      case 'ending-soon':
        return projectsToSort.sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));
      default:
        return projectsToSort;
    }
  }, [filteredProjects, sortBy]);

  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setBudgetRange({ min: '', max: '' });
    setDurationFilter('');
    setSelectedSkills([]);
    setSortBy('latest');
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Search Bar */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Projects
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or skills..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={budgetRange.min}
                onChange={(e) => setBudgetRange({ ...budgetRange, min: e.target.value })}
                placeholder="Min"
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="number"
                value={budgetRange.max}
                onChange={(e) => setBudgetRange({ ...budgetRange, max: e.target.value })}
                placeholder="Max"
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Duration Filter */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Max Duration (weeks)
            </label>
            <input
              type="number"
              id="duration"
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              placeholder="Weeks"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        {/* Skills Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                  selectedSkills.includes(skill)
                    ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting and Clear Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="latest">Latest Projects</option>
              <option value="highest-budget">Highest Budget</option>
              <option value="ending-soon">Ending Soon</option>
            </select>
          </div>
          
          <button
            onClick={clearFilters}
            className="px-4 py-3 text-sm font-medium text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {sortedProjects.length} Project{sortedProjects.length !== 1 ? 's' : ''} Found
        </h2>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {sortedProjects.length > 0 ? (
          sortedProjects.map((project) => (
            <ProjectCard 
              key={project._id} 
              project={project} 
              onStatusChange={onStatusChange}
              showStatusControls={showStatusControls}
              onViewDetail={onViewDetail}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
            <p className="text-gray-500 text-lg">No projects found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-colors shadow-md"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;