import { useResume } from '../../context/ResumeContext';
import TEMPLATES from './TemplateRegistry';

const TemplateSelector = ({ currentTemplateId, templateVariants } = {}) => {
  const { resumeData, currentTemplate } = useResume();
  
  // Use passed props if available, otherwise use context
  const effectiveTemplateId = currentTemplateId || currentTemplate;
  const effectiveTemplateVariants = templateVariants || resumeData.templateVariants[effectiveTemplateId] || {};
  
  // Get template configuration from registry
  const getTemplateConfig = () => {
    const { experienceLevel, isStudent, educationLevel } = resumeData.personal;
    
    // Use effectiveTemplateId to determine which template to use
    const templateId = effectiveTemplateId;
    
    // Get the base configuration from the registry
    const baseConfig = TEMPLATES[templateId]?.defaultConfig || TEMPLATES.classic.defaultConfig;
    
    // Apply user-specific adjustments based on profile
    let config = {
      ...baseConfig,
      experienceLevel: experienceLevel
    };
    
    // Override with profile-based adjustments
    if (isStudent || experienceLevel === 'no-experience' || educationLevel === 'bachelor' || educationLevel === 'master' || educationLevel === 'doctorate') {
      config = {
        ...config,
        educationFirst: true
      };
    } 
    // Skills-focused: for tech roles, skills after summary
    else if (experienceLevel === 'less-than-3' || experienceLevel === '3-5') {
      config = {
        ...config,
        skillsFirst: true
      };
    } 
    // Modern: for mid to senior level professionals
    else if (experienceLevel === '5-10' || experienceLevel === '10-plus') {
      config = {
        ...config,
        spacing: 'spacious'
      };
    }
    
    return config;
  };
  
  const config = getTemplateConfig();
    
  // Get the template variants from context
  const currentTemplateVariants = effectiveTemplateVariants || {};
    
  // Get the template selection state
  const { variant: templateSelectionVariant } = resumeData.templateSelection || { variant: { experience: 'default', photo: false, density: 'standard' } };
  
  // Combine base config with template-specific variants and template selection variants
  const finalConfig = {
    ...config,
    ...currentTemplateVariants,
    // Override with template selection variant if needed
    showPhoto: currentTemplateVariants.showPhoto !== undefined ? currentTemplateVariants.showPhoto : templateSelectionVariant.photo,
    experienceLevel: currentTemplateVariants.experienceLevel || templateSelectionVariant.experience
  };
    
  // Get the template component from the registry
  const TemplateComponent = TEMPLATES[effectiveTemplateId]?.component || TEMPLATES.classic.component;
  
  return <TemplateComponent {...finalConfig} />;
};

export default TemplateSelector;