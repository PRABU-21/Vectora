import { useResume } from '../context/ResumeContext';

const ExportableResume = () => {
  const { resumeData } = useResume();

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white text-black">
      {/* Name and Contact Details */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-1 preview-name">{resumeData.personal.fullName || 'Your Name'}</h3>
        <p className="text-lg italic mb-2 preview-title">{resumeData.personal.title || 'Your Title'}</p>
        <p className="text-sm preview-contact">
          {resumeData.personal.email || 'Email'} | 
          {resumeData.personal.phone || 'Phone'} | 
          {resumeData.personal.github && `${resumeData.personal.github} | `}
          {resumeData.personal.portfolio && `${resumeData.personal.portfolio} | `}
          {resumeData.personal.linkedIn || 'LinkedIn'}
        </p>
      </div>
      
      {/* Professional Summary */}
      {resumeData.summary && (
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 border-b pb-1">PROFESSIONAL SUMMARY</h4>
          <p>{resumeData.summary}</p>
        </div>
      )}
      
      {/* Skills */}
      {resumeData.skills.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 border-b pb-1">SKILLS</h4>
          <ul className="list-disc list-inside">
            {resumeData.skills.map((skill, index) => (
              <li key={index} className="mb-1">{skill}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Experience */}
      {resumeData.experience.filter(exp => exp.company || exp.jobTitle).length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 border-b pb-1">EXPERIENCE</h4>
          {resumeData.experience.filter(exp => exp.company || exp.jobTitle).map((exp, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between">
                <h5 className="font-bold">{exp.jobTitle || 'Job Title'}</h5>
                <span>{exp.startDate || ''} - {exp.endDate || 'Present'}</span>
              </div>
              <p className="font-medium mb-2">{exp.company || 'Company'}</p>
              <p>{exp.description || 'Description of responsibilities and achievements...'}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Education */}
      {resumeData.education.filter(edu => edu.school || edu.degree).length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 border-b pb-1">EDUCATION</h4>
          {resumeData.education.filter(edu => edu.school || edu.degree).map((edu, index) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between">
                <h5 className="font-bold">{edu.degree || 'Degree'} in {edu.field || 'Field of Study'}</h5>
                <span>{edu.graduationDate || 'Year'}</span>
              </div>
              <p>{edu.school || 'School'}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Projects */}
      {resumeData.projects.filter(proj => proj.name).length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 border-b pb-1">PROJECTS</h4>
          {resumeData.projects.filter(proj => proj.name).map((proj, index) => (
            <div key={index} className="mb-3">
              <h5 className="font-bold">{proj.name}</h5>
              <p className="mb-1">{proj.technologies}</p>
              <p>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Leadership */}
      {resumeData.leadership.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 border-b pb-1">LEADERSHIP</h4>
          <ul className="list-disc list-inside">
            {resumeData.leadership.map((leadership, index) => (
              <li key={index} className="mb-1">{leadership}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Achievements */}
      {resumeData.achievements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 border-b pb-1">ACHIEVEMENTS</h4>
          <ul className="list-disc list-inside">
            {resumeData.achievements.map((achievement, index) => (
              <li key={index} className="mb-1">{achievement}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Area of Interest */}
      {resumeData.interests.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold mb-3 border-b pb-1">AREA OF INTEREST</h4>
          <ul className="list-disc list-inside">
            {resumeData.interests.map((interest, index) => (
              <li key={index} className="mb-1">{interest}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExportableResume;