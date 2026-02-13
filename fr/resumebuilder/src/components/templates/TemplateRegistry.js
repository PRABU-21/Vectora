import BaseTemplate from './BaseTemplate';

// Single template registry that maps templateId to template configuration
const TEMPLATES = {
  "classic": {
    id: "classic",
    name: "Classic Professional",
    description: "Safe choice for all job roles. Best for freshers, service companies, campus placements",
    component: BaseTemplate,
    defaultConfig: {
      variant: 'classic',
      spacing: 'normal',
      experienceLevel: 'any',
      educationFirst: false,
      skillsFirst: false,
      showPhoto: false
    }
  },
  "modern": {
    id: "modern",
    name: "Modern Minimal",
    description: "Clean, contemporary design with clear section dividers",
    component: BaseTemplate,
    defaultConfig: {
      variant: 'modern',
      spacing: 'spacious',
      experienceLevel: 'any',
      educationFirst: false,
      skillsFirst: false,
      showPhoto: false
    }
  },
  "skills": {
    id: "skills",
    name: "Skills-First",
    description: "Highlights skills and projects, perfect for technical roles",
    component: BaseTemplate,
    defaultConfig: {
      variant: 'skills',
      spacing: 'normal',
      experienceLevel: 'any',
      educationFirst: false,
      skillsFirst: true,
      showPhoto: false
    }
  },
  "academic": {
    id: "academic",
    name: "Academic / Entry-Level",
    description: "Prioritizes education and coursework, ideal for students and fresh graduates",
    component: BaseTemplate,
    defaultConfig: {
      variant: 'academic',
      spacing: 'normal',
      experienceLevel: 'any',
      educationFirst: true,
      skillsFirst: false,
      showPhoto: false
    }
  }
};

export default TEMPLATES;