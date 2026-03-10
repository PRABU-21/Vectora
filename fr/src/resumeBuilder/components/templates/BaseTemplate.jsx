import React from 'react';
import { useResume } from '../../context/ResumeContext';
import ResumeCanvas from './ResumeCanvas';

const BaseTemplate = ({ 
  variant = 'classic', 
  spacing = 'normal',
  experienceLevel = 'any',
  educationFirst = false,
  skillsFirst = false,
  showPhoto = false
}) => {
  const { resumeData } = useResume();
  
  // Define spacing classes based on variant
  const getSpacingClass = () => {
    switch(spacing) {
      case 'compact':
        return 'mb-4';
      case 'spacious':
        return 'mb-8';
      default:
        // Different default spacing for each variant
        switch(variant) {
          case 'modern':
            return 'mb-6';
          case 'skills':
            return 'mb-3';
          case 'academic':
            return 'mb-6';
          case 'classic':
            return 'mb-6';
          default:
            return 'mb-6';
        }
    }
  };
  
  // Define section header styles based on variant
  const getHeaderStyle = () => {
    switch(variant) {
      case 'modern':
        return 'text-[14px] font-medium mb-4 border-b border-gray-400 uppercase tracking-wide';
      case 'academic':
        return 'text-[14px] font-bold mb-3 border-b-2 border-black';
      case 'skills':
        return 'text-[14px] font-bold mb-2';
      default:
        return 'text-[14px] font-bold mb-3 border-b-2 border-black';
    }
  };
  
  // Define skill display style based on variant
  const renderSkills = () => {
    if (resumeData.skills.length === 0) return null;
    
    const spacingClass = getSpacingClass();
    const headerClass = getHeaderStyle();
    
    if (variant === 'skills' || skillsFirst) {
      // Display skills as a single line for tech-focused roles
      return (
        <div className={spacingClass}>
          <h4 className={headerClass}>SKILLS</h4>
          <p className="text-sm">
            {resumeData.skills.join(', ')}
          </p>
        </div>
      );
    } else {
      // Display skills as individual items
      return (
        <div className={spacingClass}>
          <h4 className={headerClass}>SKILLS</h4>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <span 
                key={index} 
                className={variant === 'modern' ? "px-3 py-1 text-sm border-b border-gray-400" : "px-2 py-1 border border-black text-sm"}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      );
    }
  };
  
  // Define interest display style based on variant
  const renderInterests = () => {
    if (resumeData.interests.length === 0) return null;
    
    const spacingClass = getSpacingClass();
    const headerClass = getHeaderStyle();
    
    if (variant === 'skills') {
      // Display interests as a single line
      return (
        <div className={spacingClass}>
          <h4 className={headerClass}>AREA OF INTEREST</h4>
          <p className="text-sm">
            {resumeData.interests.join(', ')}
          </p>
        </div>
      );
    } else {
      // Display interests as individual items
      return (
        <div className={spacingClass}>
          <h4 className={headerClass}>AREA OF INTEREST</h4>
          <div className="flex flex-wrap gap-2">
            {resumeData.interests.map((interest, index) => (
              <span 
                key={index} 
                className={variant === 'modern' ? "px-3 py-1 text-[11px] border-b border-gray-400" : variant === 'skills' ? "px-2 py-0.5 text-[10.5px]" : "px-2 py-1 border border-black text-[11px]"}
                style={{ lineHeight: '1.4' }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      );
    }
  };
  
  // Get the appropriate font family based on variant
  const getFontFamily = () => {
    switch(variant) {
      case 'academic':
        return 'font-serif';
      case 'modern':
        return 'font-sans';
      case 'skills':
        return 'font-sans';
      case 'classic':
        return 'font-sans';
      default:
        return 'font-sans';
    }
  };
  
  // Define section order based on variant
  const renderSections = () => {
    const sections = [];
    
    // Add sections in the appropriate order based on variant
    if (educationFirst || variant === 'academic') {
      // For academic/entry-level, education comes first
      if (resumeData.education.filter(edu => edu.school || edu.degree).length > 0) {
        sections.push(
          <div key="education" className={getSpacingClass()}>
            <h4 className={getHeaderStyle()}>EDUCATION</h4>
            {resumeData.education.filter(edu => edu.school || edu.degree).map((edu, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between" style={{ lineHeight: '1.4' }}>
                  <h5 className="font-bold text-[12px]">{edu.degree || 'Degree'} in {edu.field || 'Field of Study'}</h5>
                  <span className="text-[11px]">{edu.graduationDate || 'Year'}</span>
                </div>
                <p className="text-[12px]" style={{ lineHeight: '1.4' }}>{edu.school || 'School'}</p>
                
                {/* Coursework section for academic focus */}
                {variant === 'academic' && (
                  <div className="mt-2">
                    <p className="font-medium text-[11px]" style={{ lineHeight: '1.4' }}>Relevant Coursework:</p>
                    <p className="text-[11px]" style={{ lineHeight: '1.4' }}>{edu.coursework || 'Coursework will appear here'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
    }
    
    if (resumeData.summary) {
      sections.push(
        <div key="summary" className={getSpacingClass()}>
          <h4 className={getHeaderStyle()}>SUMMARY</h4>
          <p className="text-[11px]" style={{ lineHeight: '1.4' }}>{resumeData.summary}</p>
        </div>
      );
    }
    
    if (skillsFirst || variant === 'skills') {
      sections.push(renderSkills());
    }
    
    if (resumeData.experience.filter(exp => exp.company || exp.jobTitle).length > 0) {
      sections.push(
        <div key="experience" className={getSpacingClass()}>
          <h4 className={getHeaderStyle()}>EXPERIENCE</h4>
          {resumeData.experience.filter(exp => exp.company || exp.jobTitle).map((exp, index) => (
            <div key={index} className={variant === 'modern' ? 'mb-5' : 'mb-4'}>
              <div className="flex justify-between mb-1" style={{ lineHeight: '1.4' }}>
                <h5 className={variant === 'modern' ? 'font-medium text-[12px]' : 'font-bold text-[12px]'}>{exp.jobTitle || 'Job Title'}</h5>
                <span className={variant === 'modern' ? 'text-[11px] text-gray-600' : 'text-[11px]'}>{exp.startDate || ''} - {exp.endDate || 'Present'}</span>
              </div>
              <p className={variant === 'modern' ? 'font-normal text-[12px] mb-2 text-gray-700' : 'font-medium text-[12px] mb-1'}>{exp.company || 'Company'}</p>
              <p className={variant === 'modern' ? 'text-[11px] text-gray-600' : variant === 'skills' ? 'text-[11px]' : 'text-[11px]'} style={{ lineHeight: '1.4' }}>{exp.description || 'Description of responsibilities and achievements...'}</p>
            </div>
          ))}
        </div>
      );
    }
    
    if (resumeData.projects.filter(proj => proj.name).length > 0) {
      sections.push(
        <div key="projects" className={getSpacingClass()}>
          <h4 className={getHeaderStyle()}>PROJECTS</h4>
          {resumeData.projects.filter(proj => proj.name).map((proj, index) => (
            <div key={index} className={variant === 'modern' ? 'mb-4' : 'mb-3'}>
              <h5 className={variant === 'modern' ? 'font-medium text-[12px]' : variant === 'skills' ? 'font-bold text-[11px]' : 'font-bold text-[12px]'} style={{ lineHeight: '1.4' }}>{proj.name}</h5>
              <p className={variant === 'modern' ? 'text-[11px] font-normal mb-1 text-gray-600' : variant === 'skills' ? 'text-[10.5px] font-medium mb-0.5' : 'text-[11px] font-medium mb-1'} style={{ lineHeight: '1.4' }}>{proj.technologies}</p>
              <p className={variant === 'modern' ? 'text-[11px] text-gray-600' : variant === 'skills' ? 'text-[10.5px]' : 'text-[11px]'} style={{ lineHeight: '1.4' }}>{proj.description}</p>
            </div>
          ))}
        </div>
      );
    }
    
    if (!skillsFirst && variant !== 'skills') {
      sections.push(renderSkills());
    }
    
    if (!educationFirst && variant !== 'academic' && resumeData.education.filter(edu => edu.school || edu.degree).length > 0) {
      sections.push(
        <div key="education" className={getSpacingClass()}>
          <h4 className={getHeaderStyle()}>EDUCATION</h4>
          {resumeData.education.filter(edu => edu.school || edu.degree).map((edu, index) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between" style={{ lineHeight: '1.4' }}>
                <h5 className="font-bold text-[12px]">{edu.degree || 'Degree'} in {edu.field || 'Field of Study'}</h5>
                <span className="text-[11px]">{edu.graduationDate || 'Year'}</span>
              </div>
              <p className="text-[12px]" style={{ lineHeight: '1.4' }}>{edu.school || 'School'}</p>
            </div>
          ))}
        </div>
      );
    }
    
    if (resumeData.achievements.length > 0) {
      sections.push(
        <div key="achievements" className={getSpacingClass()}>
          <h4 className={getHeaderStyle()}>ACHIEVEMENTS</h4>
          <ul className={variant === 'skills' ? 'list-disc list-inside text-[10.5px]' : 'list-disc list-inside text-[11px]'}>
            {resumeData.achievements.map((achievement, index) => (
              <li key={index} className={variant === 'skills' ? 'mb-0.5 text-[10.5px]' : 'mb-1 text-[11px]'} style={{ lineHeight: '1.4' }}>{achievement}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    if (resumeData.leadership.length > 0) {
      sections.push(
        <div key="leadership" className={getSpacingClass()}>
          <h4 className={getHeaderStyle()}>LEADERSHIP</h4>
          <ul className={variant === 'skills' ? 'list-disc list-inside text-[10.5px]' : 'list-disc list-inside text-[11px]'}>
            {resumeData.leadership.map((leadership, index) => (
              <li key={index} className={variant === 'skills' ? 'mb-0.5 text-[10.5px]' : 'mb-1 text-[11px]'} style={{ lineHeight: '1.4' }}>{leadership}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    if (!skillsFirst && variant !== 'skills') {
      sections.push(renderInterests());
    }
    
    if (resumeData.personal.languages.length > 0) {
      sections.push(
        <div key="languages" className={getSpacingClass()}>
          <h4 className={getHeaderStyle()}>LANGUAGES</h4>
          <div className="flex flex-wrap gap-2">
            {resumeData.personal.languages.map((language, index) => (
              <span 
                key={index} 
                className={variant === 'modern' ? "px-3 py-1 text-[11px] border-b border-gray-400" : variant === 'skills' ? "px-2 py-0.5 text-[10.5px]" : "px-2 py-1 border border-black text-[11px]"}
                style={{ lineHeight: '1.4' }}
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      );
    }
    
    return sections;
  };

  return (
    <ResumeCanvas>
      <div id="resume-preview-content" className={`w-full min-h-full bg-white text-black ${getFontFamily()}`}>
        
        {/* Name and Contact Details with Optional Photo */}
        <div className={`flex flex-col items-center ${variant === 'modern' ? 'gap-4' : variant === 'skills' ? 'gap-2' : 'gap-6'}`}>
          {/* Photo Section - Only show if enabled */}
          {showPhoto && (
            <div className="flex-shrink-0">
              <div className={variant === 'modern' ? 'w-20 h-28 border-b-2 border-gray-300 bg-gray-50 flex items-center justify-center' : 
                   variant === 'skills' ? 'w-16 h-24 border border-gray-300 bg-gray-50 flex items-center justify-center' : 
                   'w-24 h-32 border border-gray-300 bg-gray-50 flex items-center justify-center'}>
                <span className="text-gray-500 text-xs text-center px-1">[Photo]</span>
              </div>
            </div>
          )}
          
          {/* Name and Contact Details */}
          <div className={`${showPhoto ? 'text-left' : 'text-center'} w-full`}>
            <h3 className={variant === 'modern' ? 'text-[22px] font-bold mb-1 preview-name' : variant === 'skills' ? 'text-[20px] font-bold mb-0.5 preview-name' : 'text-[22px] font-bold mb-1 preview-name'} style={{ lineHeight: '1.4' }}>{resumeData.personal.fullName || 'Your Name'}</h3>
            <p className={variant === 'modern' ? 'text-[12px] italic mb-1 preview-title' : variant === 'skills' ? 'text-[11px] italic mb-1 preview-title' : 'text-[12px] italic mb-2 preview-title'} style={{ lineHeight: '1.4' }}>{resumeData.personal.title || 'Your Title'}</p>
            <p className={variant === 'modern' ? 'text-[11px] preview-contact' : variant === 'skills' ? 'text-[10.5px] preview-contact' : 'text-[11px] preview-contact'} style={{ lineHeight: '1.4' }}>
              {resumeData.personal.email || 'Email'} | 
              {resumeData.personal.phone || 'Phone'} | 
              {resumeData.personal.github && `${resumeData.personal.github} | `}
              {resumeData.personal.portfolio && `${resumeData.personal.portfolio} | `}
              {resumeData.personal.linkedIn || 'LinkedIn'}
            </p>
          </div>
        </div>
        
        {/* Render sections in appropriate order */}
        {renderSections()}
      </div>
    </ResumeCanvas>
  );
};

export default BaseTemplate;