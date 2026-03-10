import BaseTemplate from './BaseTemplate';

// Generate ATS-friendly template presets programmatically so we can offer 100+ options
const baseFamilies = [
  {
    id: 'classic',
    name: 'Classic Professional',
    description: 'Balanced, ATS-safe layout for most roles',
    variant: 'classic',
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean dividers and white space for tech roles',
    variant: 'modern',
  },
  {
    id: 'skills',
    name: 'Skills-First',
    description: 'Skills and projects take the spotlight',
    variant: 'skills',
  },
  {
    id: 'academic',
    name: 'Academic / Entry-Level',
    description: 'Education-forward for students and fresh grads',
    variant: 'academic',
  },
];

const experienceBands = [
  { id: 'entry', label: 'Entry / 0-2y', educationFirst: true },
  { id: 'mid', label: 'Mid / 3-5y', skillsFirst: true },
  { id: 'senior', label: 'Senior / 6-10y', spacing: 'spacious' },
  { id: 'executive', label: 'Exec / 10y+', spacing: 'spacious', showPhoto: true },
];

const densities = [
  { id: 'compact', spacing: 'compact' },
  { id: 'standard', spacing: 'normal' },
  { id: 'spacious', spacing: 'spacious' },
];

const photoToggles = [
  { id: 'photo', showPhoto: true },
  { id: 'no-photo', showPhoto: false },
];

// Build 100+ templates by combining dimensions
const TEMPLATES = {};

let counter = 0;
baseFamilies.forEach((family) => {
  experienceBands.forEach((band) => {
    densities.forEach((density) => {
      photoToggles.forEach((photo) => {
        // Keep variant within the supported set (classic/modern/skills/academic)
        const id = `${family.id}-${band.id}-${density.id}-${photo.id}`;
        const name = `${family.name} • ${band.label} • ${density.id}${photo.showPhoto ? ' • Photo' : ''}`;

        TEMPLATES[id] = {
          id,
          name,
          description: `${family.description}. Tuned for ${band.label.toLowerCase()} profiles with ${density.id} spacing${photo.showPhoto ? ' and photo slot' : ''}.`,
          experienceLevels: ['all', 'no-experience', 'less-than-3', '3-5', '5-10', '10-plus'],
          component: BaseTemplate,
          defaultConfig: {
            variant: family.variant,
            spacing: density.spacing,
            experienceLevel: band.id,
            educationFirst: Boolean(band.educationFirst),
            skillsFirst: Boolean(band.skillsFirst || family.id === 'skills'),
            showPhoto: Boolean(photo.showPhoto),
          },
        };

        counter += 1;
      });
    });
  });
});

// Ensure we cross the 100 mark; current combination count = 4*4*3*2 = 96.
// Add a small set of specialty presets to push past 100.
const specialtyPresets = [
  {
    id: 'modern-remote-compact',
    name: 'Modern Remote Compact',
    description: 'Remote-friendly compact layout with skills upfront',
    base: 'modern',
    config: { variant: 'modern', spacing: 'compact', skillsFirst: true, showPhoto: false },
  },
  {
    id: 'modern-remote-photo',
    name: 'Modern Remote Photo',
    description: 'Clean layout with optional photo block for executive profiles',
    base: 'modern',
    config: { variant: 'modern', spacing: 'spacious', skillsFirst: false, showPhoto: true },
  },
  {
    id: 'classic-ats-dense',
    name: 'Classic ATS Dense',
    description: 'Single-column dense layout optimized for parsing',
    base: 'classic',
    config: { variant: 'classic', spacing: 'compact', educationFirst: false, skillsFirst: false, showPhoto: false },
  },
  {
    id: 'classic-ats-balanced',
    name: 'Classic ATS Balanced',
    description: 'Balanced ATS-safe ordering with modest whitespace',
    base: 'classic',
    config: { variant: 'classic', spacing: 'normal', educationFirst: false, skillsFirst: true, showPhoto: false },
  },
  {
    id: 'academic-research',
    name: 'Academic Research',
    description: 'Coursework-forward for research internships and labs',
    base: 'academic',
    config: { variant: 'academic', spacing: 'spacious', educationFirst: true, skillsFirst: false, showPhoto: false },
  },
  {
    id: 'skills-data',
    name: 'Skills-First Data',
    description: 'Data/AI oriented variant with skills and projects prioritized',
    base: 'skills',
    config: { variant: 'skills', spacing: 'normal', educationFirst: false, skillsFirst: true, showPhoto: false },
  },
  {
    id: 'skills-engineering-photo',
    name: 'Skills Engineering + Photo',
    description: 'Engineering-focused with photo slot and tight spacing',
    base: 'skills',
    config: { variant: 'skills', spacing: 'compact', educationFirst: false, skillsFirst: true, showPhoto: true },
  },
  {
    id: 'modern-product',
    name: 'Modern Product',
    description: 'Product/PM oriented with balanced spacing and optional photo',
    base: 'modern',
    config: { variant: 'modern', spacing: 'normal', educationFirst: false, skillsFirst: false, showPhoto: true },
  },
];

specialtyPresets.forEach((preset) => {
  TEMPLATES[preset.id] = {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    experienceLevels: ['all', 'no-experience', 'less-than-3', '3-5', '5-10', '10-plus'],
    component: BaseTemplate,
    defaultConfig: {
      experienceLevel: 'any',
      ...preset.config,
    },
  };
});

export default TEMPLATES;