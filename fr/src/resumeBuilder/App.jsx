import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useResume } from './context/ResumeContext';
import { User, Briefcase, GraduationCap, Code, FileText, Award, Users, FolderOpen, Eye, Plus, Palette } from 'lucide-react';
import Onboarding from './components/Onboarding';
import ExperienceLevelSelection from './components/ExperienceLevelSelection';
import StudentStatusSelection from './components/StudentStatusSelection';
import EducationLevelSelection from './components/EducationLevelSelection';
import TemplateRecommendationModal from './components/TemplateRecommendationModal';
import TemplateSelectionPage from './components/TemplateSelectionPage';

function App() {
  const [onboardingStep, setOnboardingStep] = useState(0); // 0: welcome, 1: experience level, 2: student status, 3: education level, 4: template selection, 5: main app
  const [activeSection, setActiveSection] = useState('personal');
  
  const { resumeData, updateTemplate } = useResume();
  
  // Get icons for each section
  const sectionIcons = {
    personal: User,
    experience: Briefcase,
    education: GraduationCap,
    skills: Code,
    summary: FileText,
    achievements: Award,
    interests: Users,
    leadership: Users,
    projects: FolderOpen,
    preview: Eye
  };
  
  const getIcon = (section) => {
    const IconComponent = sectionIcons[section];
    return <IconComponent size={20} />;
  };

  const handleStartResume = () => {
    setOnboardingStep(1); // Move to experience level selection
  };

  const handleExperienceLevelNext = () => {
    setOnboardingStep(2); // Move to student status selection
  };

  const handleStudentStatusNext = () => {
    setOnboardingStep(3); // Move to education level selection
  };

  const handleStudentStatusBack = () => {
    setOnboardingStep(1); // Go back to experience level selection
  };

  const handleStudentStatusSkipEducation = () => {
    setOnboardingStep(4); // Skip education level and go to template selection
  };

  const handleEducationLevelNext = () => {
    setOnboardingStep(4); // Move to template selection
  };

  const handleEducationLevelBack = () => {
    setOnboardingStep(2); // Go back to student status selection
  };

  const handleTemplateSelection = (templateId) => {
    // Update the template in the context
    updateTemplate(templateId);
    setOnboardingStep(5); // Go to main application
  };

  const handleTemplateSelectionBack = () => {
    setOnboardingStep(3); // Go back to education level selection
  };

  if (onboardingStep === 0) {
    return <Onboarding onStart={handleStartResume} />;
  }

  if (onboardingStep === 1) {
    return <ExperienceLevelSelection onNext={handleExperienceLevelNext} />;
  }

  if (onboardingStep === 2) {
    return <StudentStatusSelection 
      onNext={handleStudentStatusNext} 
      onBack={handleStudentStatusBack} 
      onSkipEducation={handleStudentStatusSkipEducation} 
    />;
  }

  if (onboardingStep === 3) {
    return <EducationLevelSelection onNext={handleEducationLevelNext} onBack={handleEducationLevelBack} />;
  }

  if (onboardingStep === 4) {
    return <TemplateSelectionPage 
      onBack={handleTemplateSelectionBack} 
      onSelectTemplate={handleTemplateSelection} 
    />;
  }

  const calculateCompletion = () => {
    const { personal, summary, skills, education, experience, projects, achievements, interests, leadership } = resumeData;
    let completedSections = 0;
    const totalSections = 9;
    
    // Personal info (required fields)
    if (personal.fullName && personal.email && personal.phone) completedSections++;
    
    // Summary
    if (summary) completedSections++;
    
    // Skills
    if (skills.length > 0) completedSections++;
    
    // Education
    if (education.some(edu => edu.school || edu.degree)) completedSections++;
    
    // Experience
    if (experience.some(exp => exp.company || exp.jobTitle)) completedSections++;
    
    // Projects
    if (projects.some(proj => proj.name)) completedSections++;
    
    // Achievements
    if (achievements.length > 0) completedSections++;
    
    // Interests
    if (interests.length > 0) completedSections++;
    
    // Leadership
    if (leadership.length > 0) completedSections++;
    
    return Math.round((completedSections / totalSections) * 100);
  };
  
  const getOrderedSections = () => {
    const { experienceLevel, isStudent, educationLevel } = resumeData.personal;
    
    // Base sections
    const baseSections = [
      { id: 'personal', label: 'Personal Info', icon: User },
      { id: 'summary', label: 'Summary', icon: FileText },
      { id: 'skills', label: 'Skills', icon: Code },
      { id: 'experience', label: 'Experience', icon: Briefcase },
      { id: 'education', label: 'Education', icon: GraduationCap },
      { id: 'projects', label: 'Projects', icon: FolderOpen },
      { id: 'achievements', label: 'Achievements', icon: Award },
      { id: 'interests', label: 'Interests', icon: Users },
      { id: 'leadership', label: 'Leadership', icon: Users },
      { id: 'finalize', label: 'Finalize', icon: Eye }
    ];
    
    // Determine section order based on user profile
    if (isStudent || experienceLevel === 'no-experience' || educationLevel === 'bachelor' || educationLevel === 'master' || educationLevel === 'doctorate') {
      // Freshers/Students: Education + Projects first, Skills after summary
      return [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'summary', label: 'Summary', icon: FileText },
        { id: 'skills', label: 'Skills', icon: Code }, // Tech roles: Skills immediately after summary
        { id: 'education', label: 'Education', icon: GraduationCap }, // Education emphasized for students
        { id: 'projects', label: 'Projects', icon: FolderOpen }, // Projects first for freshers
        { id: 'experience', label: 'Experience', icon: Briefcase },
        { id: 'achievements', label: 'Achievements', icon: Award },
        { id: 'interests', label: 'Interests', icon: Users },
        { id: 'leadership', label: 'Leadership', icon: Users },
        { id: 'finalize', label: 'Finalize', icon: Eye }
      ];
    } else if (experienceLevel === '5-10' || experienceLevel === '10-plus') {
      // Experienced professionals: Experience first
      return [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'summary', label: 'Summary', icon: FileText },
        { id: 'experience', label: 'Experience', icon: Briefcase }, // Experience first for experienced professionals
        { id: 'skills', label: 'Skills', icon: Code },
        { id: 'education', label: 'Education', icon: GraduationCap },
        { id: 'projects', label: 'Projects', icon: FolderOpen },
        { id: 'achievements', label: 'Achievements', icon: Award },
        { id: 'interests', label: 'Interests', icon: Users },
        { id: 'leadership', label: 'Leadership', icon: Users },
        { id: 'finalize', label: 'Finalize', icon: Eye }
      ];
    } else {
      // Default order for others (e.g., less than 3 years, 3-5 years)
      return [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'summary', label: 'Summary', icon: FileText },
        { id: 'skills', label: 'Skills', icon: Code },
        { id: 'experience', label: 'Experience', icon: Briefcase },
        { id: 'education', label: 'Education', icon: GraduationCap },
        { id: 'projects', label: 'Projects', icon: FolderOpen },
        { id: 'achievements', label: 'Achievements', icon: Award },
        { id: 'interests', label: 'Interests', icon: Users },
        { id: 'leadership', label: 'Leadership', icon: Users },
        { id: 'finalize', label: 'Finalize', icon: Eye }
      ];
    }
  };
  
  const stepSections = getOrderedSections();
  
  // Navigation functions
  const goToNextSection = () => {
    const currentIndex = stepSections.findIndex(step => step.id === activeSection);
    if (currentIndex < stepSections.length - 1) {
      setActiveSection(stepSections[currentIndex + 1].id);
    }
  };

  const goToPreviousSection = () => {
    const currentIndex = stepSections.findIndex(step => step.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(stepSections[currentIndex - 1].id);
    }
  };

  // For finalize section, we'll show the preview
  const renderActiveSection = () => {
    const currentIndex = stepSections.findIndex(step => step.id === activeSection);
    const canGoNext = currentIndex < stepSections.length - 1;
    const canGoPrevious = currentIndex > 0;
    
    let sectionContent;
    switch(activeSection) {
      case 'personal':
        sectionContent = <PersonalInfoSection />;
        break;
      case 'experience':
        sectionContent = <ExperienceSection />;
        break;
      case 'education':
        sectionContent = <EducationSection />;
        break;
      case 'skills':
        sectionContent = <SkillsSection />;
        break;
      case 'summary':
        sectionContent = <SummarySection />;
        break;
      case 'achievements':
        sectionContent = <AchievementsSection />;
        break;
      case 'interests':
        sectionContent = <InterestsSection />;
        break;
      case 'leadership':
        sectionContent = <LeadershipSection />;
        break;
      case 'projects':
        sectionContent = <ProjectsSection />;
        break;
      case 'finalize':
        sectionContent = <PreviewSection />;
        break;
      default:
        sectionContent = <PersonalInfoSection />;
    }
    
    return (
      <div className="space-y-8">
        {sectionContent}
        
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Go back to template selection page (step 4 in onboarding)
                setOnboardingStep(4);
              }}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              ← Back to Templates
            </button>
            
            <button
              onClick={goToPreviousSection}
              disabled={!canGoPrevious}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                canGoPrevious
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              ← Previous
            </button>
          </div>
          
          <button
            onClick={goToNextSection}
            disabled={!canGoNext}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              canGoNext
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      
      <div className="flex min-h-[calc(100vh-70px)]">
        {/* Left: Step indicator */}
        <nav className="w-64 bg-white/80 backdrop-blur-sm p-4 border-r border-gray-200 shadow-sm">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-1">Completion</div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-700">{calculateCompletion()}%</span>
              <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${calculateCompletion()}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <ul className="space-y-2">
            {stepSections.map((step) => {
              const IconComponent = step.icon;
              return (
                <li key={step.id}>
                  <button 
                    onClick={() => setActiveSection(step.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center gap-3 font-medium ${activeSection === step.id ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <IconComponent size={20} />
                    <span className="capitalize">{step.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Center: Active form section */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50 transition-all duration-300">
          <div className="max-w-2xl mx-auto transition-opacity duration-300">
            {renderActiveSection()}
          </div>
        </main>
        
        {/* Right: Live resume preview */}
        <aside className="w-96 bg-white/80 backdrop-blur-sm p-4 border-l border-gray-200 overflow-y-auto">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Live Preview</h3>
            <button 
              onClick={() => setActiveSection('finalize')}
              className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Change Template
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <PreviewSection />
          </div>
        </aside>
      </div>
    </div>
  );
}

const PersonalInfoSection = () => {
  const { resumeData, updatePersonal, addLanguage, removeLanguage } = useResume();
  
  const [languageInput, setLanguageInput] = useState('');
  
  const handleChange = (e) => {
    const { id, value } = e.target;
    updatePersonal({ [id]: value });
  };
  
  const handleAddLanguage = () => {
    if (languageInput.trim()) {
      addLanguage(languageInput.trim());
      setLanguageInput('');
    }
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <User className="text-blue-500" size={28} />
        Personal Information
      </h2>
      <div className="mb-8">
        <label htmlFor="fullName" className="block mb-3 font-semibold text-gray-700">Full Name</label>
        <input 
          type="text" 
          id="fullName" 
          value={resumeData.personal.fullName}
          onChange={handleChange}
          placeholder="John Doe" 
          className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        />
      </div>
      <div className="mb-8">
        <label htmlFor="email" className="block mb-3 font-semibold text-gray-700">Email</label>
        <input 
          type="email" 
          id="email" 
          value={resumeData.personal.email}
          onChange={handleChange}
          placeholder="john.doe@example.com" 
          className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        />
      </div>
      <div className="mb-8">
        <label htmlFor="phone" className="block mb-3 font-semibold text-gray-700">Phone</label>
        <input 
          type="tel" 
          id="phone" 
          value={resumeData.personal.phone}
          onChange={handleChange}
          placeholder="(123) 456-7890" 
          className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        />
      </div>
      <div className="mb-8">
        <label htmlFor="github" className="block mb-3 font-semibold text-gray-700">GitHub URL</label>
        <input 
          type="url" 
          id="github" 
          value={resumeData.personal.github}
          onChange={handleChange}
          placeholder="https://github.com/username" 
          className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        />
      </div>
      <div className="mb-8">
        <label htmlFor="portfolio" className="block mb-3 font-semibold text-gray-700">Portfolio URL</label>
        <input 
          type="url" 
          id="portfolio" 
          value={resumeData.personal.portfolio}
          onChange={handleChange}
          placeholder="https://yourportfolio.com" 
          className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        />
      </div>
      <div className="mb-8">
        <label htmlFor="title" className="block mb-3 font-semibold text-gray-700">Professional Title</label>
        <input 
          type="text" 
          id="title" 
          value={resumeData.personal.title}
          onChange={handleChange}
          placeholder="Software Engineer" 
          className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        />
      </div>
      <div className="mb-8">
        <label htmlFor="linkedIn" className="block mb-3 font-semibold text-gray-700">LinkedIn Profile</label>
        <input 
          type="text" 
          id="linkedIn" 
          value={resumeData.personal.linkedIn}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/yourprofile" 
          className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        />
      </div>
      <div className="mb-8">
        <label className="block mb-3 font-semibold text-gray-700">Languages</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {resumeData.personal.languages.map((language, index) => (
            <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <span>{language}</span>
              <button 
                type="button" 
                onClick={() => removeLanguage(index)}
                className="text-red-500 hover:text-red-700 text-sm font-bold ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={languageInput}
            onChange={(e) => setLanguageInput(e.target.value)}
            className="flex-1 p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            placeholder="Enter language"
            onKeyDown={(e) => e.key === 'Enter' && handleAddLanguage()}
          />
          <button 
            type="button" 
            onClick={handleAddLanguage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const ExperienceSection = () => {
  const { resumeData, addExperience, updateExperience, removeExperience } = useResume();
  
  const handleExperienceChange = (id, field, value) => {
    updateExperience(id, { [field]: value });
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <Briefcase className="text-blue-500" size={28} />
        Work Experience
      </h2>
      
      {resumeData.experience.map((exp) => (
        <div key={exp.id} className="mb-10 p-6 border border-gray-200 rounded-xl shadow-sm bg-gray-50/50 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Experience #{exp.id}</h3>
            {resumeData.experience.length > 1 && (
              <button 
                onClick={() => removeExperience(exp.id)}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 transition-colors rounded-lg font-medium shadow-sm border border-red-200"
              >
                Remove
              </button>
            )}
          </div>
          <div className="mb-8">
            <label htmlFor={`jobTitle-${exp.id}`} className="block mb-3 font-semibold text-gray-700">Job Title</label>
            <input 
              type="text" 
              id={`jobTitle-${exp.id}`}
              value={exp.jobTitle}
              onChange={(e) => handleExperienceChange(exp.id, 'jobTitle', e.target.value)}
              placeholder="Software Engineer" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <div className="mb-8">
            <label htmlFor={`company-${exp.id}`} className="block mb-3 font-semibold text-gray-700">Company</label>
            <input 
              type="text" 
              id={`company-${exp.id}`}
              value={exp.company}
              onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
              placeholder="ABC Company" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <label htmlFor={`startDate-${exp.id}`} className="block mb-3 font-semibold text-gray-700">Start Date</label>
              <input 
                type="text" 
                id={`startDate-${exp.id}`}
                value={exp.startDate}
                onChange={(e) => handleExperienceChange(exp.id, 'startDate', e.target.value)}
                placeholder="Jan 2020" 
                className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor={`endDate-${exp.id}`} className="block mb-3 font-semibold text-gray-700">End Date</label>
              <input 
                type="text" 
                id={`endDate-${exp.id}`}
                value={exp.endDate}
                onChange={(e) => handleExperienceChange(exp.id, 'endDate', e.target.value)}
                placeholder="Dec 2023" 
                className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
          <div className="mb-8">
            <label htmlFor={`description-${exp.id}`} className="block mb-3 font-semibold text-gray-700">Job Description</label>
            <textarea 
              id={`description-${exp.id}`}
              value={exp.description}
              onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)}
              placeholder="Describe your responsibilities and achievements..." 
              rows="4" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            ></textarea>
          </div>
        </div>
      ))}
      
      <button 
        onClick={addExperience}
        className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-md flex items-center gap-2"
      >
        <Plus size={20} />
        Add Experience
      </button>
    </div>
  );
};

const EducationSection = () => {
  const { resumeData, addEducation, updateEducation, removeEducation } = useResume();
  
  const handleEducationChange = (id, field, value) => {
    updateEducation(id, { [field]: value });
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <GraduationCap className="text-blue-500" size={28} />
        Education
      </h2>
      
      {resumeData.education.map((edu) => (
        <div key={edu.id} className="mb-10 p-6 border border-gray-200 rounded-xl shadow-sm bg-gray-50/50 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Education #{edu.id}</h3>
            {resumeData.education.length > 1 && (
              <button 
                onClick={() => removeEducation(edu.id)}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 transition-colors rounded-lg font-medium shadow-sm border border-red-200"
              >
                Remove
              </button>
            )}
          </div>
          <div className="mb-8">
            <label htmlFor={`school-${edu.id}`} className="block mb-3 font-semibold text-gray-700">School</label>
            <input 
              type="text" 
              id={`school-${edu.id}`}
              value={edu.school}
              onChange={(e) => handleEducationChange(edu.id, 'school', e.target.value)}
              placeholder="University Name" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <div className="mb-8">
            <label htmlFor={`degree-${edu.id}`} className="block mb-3 font-semibold text-gray-700">Degree</label>
            <input 
              type="text" 
              id={`degree-${edu.id}`}
              value={edu.degree}
              onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
              placeholder="Bachelor of Science" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <div className="mb-8">
            <label htmlFor={`field-${edu.id}`} className="block mb-3 font-semibold text-gray-700">Field of Study</label>
            <input 
              type="text" 
              id={`field-${edu.id}`}
              value={edu.field}
              onChange={(e) => handleEducationChange(edu.id, 'field', e.target.value)}
              placeholder="Computer Science" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <div className="mb-8">
            <label htmlFor={`graduationDate-${edu.id}`} className="block mb-3 font-semibold text-gray-700">Graduation Date</label>
            <input 
              type="text" 
              id={`graduationDate-${edu.id}`}
              value={edu.graduationDate}
              onChange={(e) => handleEducationChange(edu.id, 'graduationDate', e.target.value)}
              placeholder="May 2020" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <div className="mb-8">
            <label htmlFor={`coursework-${edu.id}`} className="block mb-3 font-semibold text-gray-700">Relevant Coursework</label>
            <input 
              type="text" 
              id={`coursework-${edu.id}`}
              value={edu.coursework}
              onChange={(e) => handleEducationChange(edu.id, 'coursework', e.target.value)}
              placeholder="Data Structures, Algorithms, Software Engineering" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
        </div>
      ))}
      
      <button 
        onClick={addEducation}
        className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-md flex items-center gap-2"
      >
        <Plus size={20} />
        Add Education
      </button>
    </div>
  );
};

const SkillsSection = () => {
  const { resumeData, addSkill, removeSkill, addLanguage, removeLanguage } = useResume();
  
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  
  const handleAddSkill = () => {
    if (newSkill.trim()) {
      addSkill(newSkill);
      setNewSkill('');
    }
  };
  
  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      addLanguage(newLanguage);
      setNewLanguage('');
    }
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <Code className="text-blue-500" size={28} />
        Skills
      </h2>
      
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <Code size={18} className="text-blue-500" />
          Skills
        </h3>
        <div className="flex gap-4 mb-4">
          <input 
            type="text" 
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill" 
            className="flex-1 p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
          />
          <button 
            onClick={handleAddSkill}
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-md flex items-center gap-2"
          >
            <Plus size={20} />
            Add Skill
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {resumeData.skills.map((skill, index) => (
            <div key={index} className="flex items-center bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
              <span>{skill}</span>
              <button 
                onClick={() => removeSkill(index)}
                className="ml-3 text-red-600 hover:text-red-800 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          Languages
        </h3>
        <div className="flex gap-4 mb-4">
          <input 
            type="text" 
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="Add a language" 
            className="flex-1 p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
          />
          <button 
            onClick={handleAddLanguage}
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-md flex items-center gap-2"
          >
            <Plus size={20} />
            Add Language
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {resumeData.personal.languages.map((language, index) => (
            <div key={index} className="flex items-center bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
              <span>{language}</span>
              <button 
                onClick={() => removeLanguage(index)}
                className="ml-3 text-red-600 hover:text-red-800 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AchievementsSection = () => {
  const { resumeData, addAchievement, removeAchievement } = useResume();
  
  const [newAchievement, setNewAchievement] = useState('');
  
  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      addAchievement(newAchievement);
      setNewAchievement('');
    }
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <Award className="text-blue-500" size={28} />
        Achievements
      </h2>
      
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <Award size={18} className="text-blue-500" />
          Add New Achievement
        </h3>
        <div className="flex gap-4 mb-6">
          <input 
            type="text" 
            value={newAchievement}
            onChange={(e) => setNewAchievement(e.target.value)}
            placeholder="Add an achievement" 
            className="flex-1 p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddAchievement()}
          />
          <button 
            onClick={handleAddAchievement}
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-md flex items-center gap-2"
          >
            <Plus size={20} />
            Add Achievement
          </button>
        </div>
        
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <Award size={18} className="text-blue-500" />
          Current Achievements
        </h3>
        <div className="space-y-3">
          {resumeData.achievements.map((achievement, index) => (
            <div key={index} className="flex justify-between items-center bg-blue-50 text-blue-800 border border-blue-200 p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
              <span>{achievement}</span>
              <button 
                onClick={() => removeAchievement(index)}
                className="text-red-600 hover:text-red-800 font-bold text-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const InterestsSection = () => {
  const { resumeData, addInterest, removeInterest } = useResume();
  
  const [newInterest, setNewInterest] = useState('');
  
  const handleAddInterest = () => {
    if (newInterest.trim()) {
      addInterest(newInterest);
      setNewInterest('');
    }
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <Users className="text-blue-500" size={28} />
        Area of Interest
      </h2>
      
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          Add New Interest
        </h3>
        <div className="flex gap-4 mb-6">
          <input 
            type="text" 
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Add an interest" 
            className="flex-1 p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
          />
          <button 
            onClick={handleAddInterest}
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-md flex items-center gap-2"
          >
            <Plus size={20} />
            Add Interest
          </button>
        </div>
        
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          Current Interests
        </h3>
        <div className="flex flex-wrap gap-3">
          {resumeData.interests.map((interest, index) => (
            <div key={index} className="flex items-center bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
              <span>{interest}</span>
              <button 
                onClick={() => removeInterest(index)}
                className="ml-3 text-red-600 hover:text-red-800 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LeadershipSection = () => {
  const { resumeData, addLeadership, removeLeadership } = useResume();
  
  const [newLeadership, setNewLeadership] = useState('');
  
  const handleAddLeadership = () => {
    if (newLeadership.trim()) {
      addLeadership(newLeadership);
      setNewLeadership('');
    }
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <Users className="text-blue-500" size={28} />
        Leadership Experience
      </h2>
      
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          Add New Leadership Experience
        </h3>
        <div className="flex gap-4 mb-6">
          <input 
            type="text" 
            value={newLeadership}
            onChange={(e) => setNewLeadership(e.target.value)}
            placeholder="Add a leadership experience" 
            className="flex-1 p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddLeadership()}
          />
          <button 
            onClick={handleAddLeadership}
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-md flex items-center gap-2"
          >
            <Plus size={20} />
            Add Leadership
          </button>
        </div>
        
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          Current Leadership Experiences
        </h3>
        <div className="space-y-3">
          {resumeData.leadership.map((leadership, index) => (
            <div key={index} className="flex justify-between items-center bg-blue-50 text-blue-800 border border-blue-200 p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
              <span>{leadership}</span>
              <button 
                onClick={() => removeLeadership(index)}
                className="text-red-600 hover:text-red-800 font-bold text-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProjectsSection = () => {
  const { resumeData, addProject, updateProject, removeProject } = useResume();
  
  const handleProjectChange = (id, field, value) => {
    updateProject(id, { [field]: value });
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <FolderOpen className="text-blue-500" size={28} />
        Projects
      </h2>
      
      {resumeData.projects.map((project) => (
        <div key={project.id} className="mb-10 p-6 border border-gray-200 rounded-xl shadow-sm bg-gray-50/50 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Project #{project.id}</h3>
            {resumeData.projects.length > 1 && (
              <button 
                onClick={() => removeProject(project.id)}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 transition-colors rounded-lg font-medium shadow-sm border border-red-200"
              >
                Remove
              </button>
            )}
          </div>
          <div className="mb-8">
            <label htmlFor={`projectName-${project.id}`} className="block mb-3 font-semibold text-gray-700">Project Name</label>
            <input 
              type="text" 
              id={`projectName-${project.id}`}
              value={project.name}
              onChange={(e) => handleProjectChange(project.id, 'name', e.target.value)}
              placeholder="Project Name" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <div className="mb-8">
            <label htmlFor={`projectDescription-${project.id}`} className="block mb-3 font-semibold text-gray-700">Description</label>
            <textarea 
              id={`projectDescription-${project.id}`}
              value={project.description}
              onChange={(e) => handleProjectChange(project.id, 'description', e.target.value)}
              placeholder="Describe the project..." 
              rows="4" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            ></textarea>
          </div>
          <div className="mb-8">
            <label htmlFor={`projectTechnologies-${project.id}`} className="block mb-3 font-semibold text-gray-700">Technologies Used</label>
            <input 
              type="text" 
              id={`projectTechnologies-${project.id}`}
              value={project.technologies}
              onChange={(e) => handleProjectChange(project.id, 'technologies', e.target.value)}
              placeholder="React, Node.js, MongoDB" 
              className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
        </div>
      ))}
      
      <button 
        onClick={addProject}
        className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-md flex items-center gap-2"
      >
        <Plus size={20} />
        Add Project
      </button>
    </div>
  );
};

const SummarySection = () => {
  const { resumeData, updateSummary } = useResume();
  
  const handleChange = (e) => {
    updateSummary(e.target.value);
  };
  
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
      <h2 className="text-2xl md:text-3xl font-bold mb-10 pb-4 border-b border-gray-200 text-gray-800 flex items-center gap-3">
        <FileText className="text-blue-500" size={28} />
        Professional Summary
      </h2>
      <div className="mb-8">
        <label htmlFor="summary" className="block mb-3 font-semibold text-gray-700">Summary</label>
        <textarea 
          id="summary" 
          value={resumeData.summary}
          onChange={handleChange}
          placeholder="Write a brief professional summary highlighting your key skills and experience..." 
          rows="6"
          className="w-full p-4 border border-gray-300 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        ></textarea>
      </div>
    </div>
  );
};

const PreviewSection = () => {
  const { resumeData, currentTemplate, updateTemplate } = useResume();
  
  const TemplateSelector = React.lazy(() => import('./components/templates/TemplateSelector'));
  
  const handleExportPDF = () => {
   
    import('html2pdf.js').then((module) => {
      const html2pdf = module.default;
      
      const element = document.getElementById('resume-preview-content');
      
      const options = {
        margin: 10,
        filename: `${resumeData.personal.fullName || 'Resume'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(options).from(element).save();
    });
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold pb-2 border-b-2 border-black flex items-center gap-3">
          <Eye className="text-blue-500" size={24} />
          Resume Preview
        </h2>
        <button 
          onClick={handleExportPDF}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <FileText size={20} />
          Export PDF
        </button>
      </div>
      
      <Suspense fallback={<div>Loading resume template...</div>}>
        <TemplateSelector />
      </Suspense>
    </div>
  );
};

export default App;
