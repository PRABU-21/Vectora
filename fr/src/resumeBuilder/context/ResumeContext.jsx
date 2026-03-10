import { createContext, useContext, useState } from 'react';

export const ResumeContext = createContext();

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider = ({ children }) => {
  const [resumeData, setResumeData] = useState({
    personal: {
      fullName: '',
      email: '',
      phone: '',
      github: '',
      portfolio: '',
      title: '',
      linkedIn: '',
      languages: [],
      experienceLevel: '',
      isStudent: null,
      educationLevel: ''
    },
    templateSelection: {
      templateId: 'classic', // selectedTemplateId
      variant: { // selectedVariant (experience, photo, density)
        experience: 'default',
        photo: false,
        density: 'standard'
      }
    },
    templateVariants: {}, // Store template variants (experience level, photo toggle, etc.)
    summary: '',
    achievements: [],
    interests: [],
    leadership: [],
    skills: [],
    education: [
      {
        id: 1,
        school: '',
        degree: '',
        field: '',
        graduationDate: '',
        coursework: ''
      }
    ],
    experience: [
      {
        id: 1,
        jobTitle: '',
        company: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    ],
    projects: [
      {
        id: 1,
        name: '',
        description: '',
        technologies: ''
      }
    ]
  });

  const updatePersonal = (data) => {
    setResumeData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        ...data
      }
    }));
  };

  const updateSummary = (summary) => {
    setResumeData(prev => ({
      ...prev,
      summary
    }));
  };

  const updateTemplate = (templateId) => {
    setResumeData(prev => ({
      ...prev,
      templateSelection: {
        ...prev.templateSelection,
        templateId
      }
    }));
  };
  
  const updateTemplateVariant = (templateId, variant, value) => {
    setResumeData(prev => ({
      ...prev,
      templateVariants: {
        ...prev.templateVariants,
        [templateId]: {
          ...prev.templateVariants[templateId],
          [variant]: value
        }
      }
    }));
  };
  
  const updateTemplateSelection = (templateId, variantKey, variantValue) => {
    setResumeData(prev => ({
      ...prev,
      templateSelection: {
        ...prev.templateSelection,
        templateId,
        variant: {
          ...prev.templateSelection.variant,
          [variantKey]: variantValue
        }
      }
    }));
  };
  
  const updateTemplateVariantDirect = (variantKey, variantValue) => {
    setResumeData(prev => ({
      ...prev,
      templateSelection: {
        ...prev.templateSelection,
        variant: {
          ...prev.templateSelection.variant,
          [variantKey]: variantValue
        }
      }
    }));
  };

  const updateAchievements = (achievements) => {
    setResumeData(prev => ({
      ...prev,
      achievements: Array.isArray(achievements) ? achievements : achievements.split('\n').map(ach => ach.trim()).filter(ach => ach)
    }));
  };

  const addAchievement = (achievement) => {
    setResumeData(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievement.trim()]
    }));
  };

  const removeAchievement = (index) => {
    setResumeData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const updateInterests = (interests) => {
    setResumeData(prev => ({
      ...prev,
      interests: Array.isArray(interests) ? interests : interests.split(',').map(int => int.trim()).filter(int => int)
    }));
  };

  const addInterest = (interest) => {
    setResumeData(prev => ({
      ...prev,
      interests: [...prev.interests, interest.trim()]
    }));
  };

  const removeInterest = (index) => {
    setResumeData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const updateLeadership = (leadership) => {
    setResumeData(prev => ({
      ...prev,
      leadership: Array.isArray(leadership) ? leadership : leadership.split('\n').map(lead => lead.trim()).filter(lead => lead)
    }));
  };

  const addLeadership = (leadership) => {
    setResumeData(prev => ({
      ...prev,
      leadership: [...prev.leadership, leadership.trim()]
    }));
  };

  const removeLeadership = (index) => {
    setResumeData(prev => ({
      ...prev,
      leadership: prev.leadership.filter((_, i) => i !== index)
    }));
  };

  const updateSkills = (skills) => {
    setResumeData(prev => ({
      ...prev,
      skills: Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim())
    }));
  };

  const addSkill = (skill) => {
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, skill.trim()]
    }));
  };

  const removeSkill = (index) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = (language) => {
    setResumeData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        languages: [...prev.personal.languages, language.trim()]
      }
    }));
  };

  const removeLanguage = (index) => {
    setResumeData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        languages: prev.personal.languages.filter((_, i) => i !== index)
      }
    }));
  };


  const addEducation = () => {
    const newId = Math.max(...resumeData.education.map(edu => edu.id), 0) + 1;
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: newId,
          school: '',
          degree: '',
          field: '',
          graduationDate: ''
        }
      ]
    }));
  };

  const updateEducation = (id, data) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, ...data } : edu
      )
    }));
  };

  const removeEducation = (id) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addExperience = () => {
    const newId = Math.max(...resumeData.experience.map(exp => exp.id), 0) + 1;
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: newId,
          jobTitle: '',
          company: '',
          startDate: '',
          endDate: '',
          description: ''
        }
      ]
    }));
  };

  const updateExperience = (id, data) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, ...data } : exp
      )
    }));
  };

  const removeExperience = (id) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addProject = () => {
    const newId = Math.max(...resumeData.projects.map(proj => proj.id), 0) + 1;
    setResumeData(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: newId,
          name: '',
          description: '',
          technologies: ''
        }
      ]
    }));
  };

  const updateProject = (id, data) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj =>
        proj.id === id ? { ...proj, ...data } : proj
      )
    }));
  };

  const removeProject = (id) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  const value = {
    resumeData,
    currentTemplate: resumeData.templateSelection.templateId,
    updatePersonal,
    updateSummary,
    updateTemplate,
    updateTemplateVariant,
    updateTemplateSelection,
    updateTemplateVariantDirect,
    updateAchievements,
    addAchievement,
    removeAchievement,
    updateInterests,
    addInterest,
    removeInterest,
    updateLeadership,
    addLeadership,
    removeLeadership,
    updateSkills,
    addSkill,
    removeSkill,
    addLanguage,
    removeLanguage,
    addEducation,
    updateEducation,
    removeEducation,
    addExperience,
    updateExperience,
    removeExperience,
    addProject,
    updateProject,
    removeProject
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};