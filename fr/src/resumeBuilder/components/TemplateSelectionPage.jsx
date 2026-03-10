import { useState, useEffect } from 'react';
import { useResume, ResumeContext } from '../context/ResumeContext';
import TemplateSelector from './templates/TemplateSelector';
import TEMPLATES from './templates/TemplateRegistry';
import { Suspense } from 'react';

const TemplateSelectionPage = ({ onBack, onSelectTemplate }) => {
  const { resumeData, currentTemplate, updateTemplate, updateTemplateVariant, updateTemplateSelection, updateTemplateVariantDirect } = useResume();
  const [selectedFilters, setSelectedFilters] = useState({
    experienceLevel: '',
    layout: 'ats-safe',
    style: 'professional',
    photo: 'any' // 'any', 'with', 'without'
  });
  const [showAll, setShowAll] = useState(false);
  
  // Initialize template variants from resumeData
  useEffect(() => {
    if (resumeData.templateVariants) {
      setTemplateVariants(resumeData.templateVariants);
    }
  }, [resumeData.templateVariants]);
  
  const [templateVariants, setTemplateVariants] = useState({});

  const templates = Object.values(TEMPLATES).map((template) => {
    const exp = resumeData.personal.experienceLevel;
    const isStudent = resumeData.personal.isStudent;
    const recommended =
      (isStudent && template.id.includes('academic')) ||
      (!isStudent && (exp === 'less-than-3' || exp === '3-5') && template.id.includes('skills')) ||
      ((exp === '5-10' || exp === '10-plus') && template.id.includes('modern')) ||
      template.id === currentTemplate;

    return {
      ...template,
      isRecommended: Boolean(recommended)
    };
  });

  const experienceLevels = [
    { id: 'all', label: 'All Levels' },
    { id: 'no-experience', label: 'No Experience' },
    { id: 'less-than-3', label: 'Less than 3 Years' },
    { id: '3-5', label: '3-5 Years' },
    { id: '5-10', label: '5-10 Years' },
    { id: '10-plus', label: '10+ Years' }
  ];

  const layouts = [
    { id: 'ats-safe', label: 'ATS Safe' },
    { id: 'one-column', label: 'One Column Only' }
  ];

  const styles = [
    { id: 'professional', label: 'Professional' },
    { id: 'minimal', label: 'Minimal' }
  ];

  const photos = [
    { id: 'any', label: 'Any Photo' },
    { id: 'with', label: 'With Photo' },
    { id: 'without', label: 'Without Photo' }
  ];

  const filteredTemplates = templates.map(template => {
    // Calculate if template matches filters for highlighting
    const matchesExperience = !selectedFilters.experienceLevel || 
      selectedFilters.experienceLevel === 'all' || 
      template.experienceLevels.includes(selectedFilters.experienceLevel) ||
      template.experienceLevels.includes('all');
    
    // For layout filter - all templates are ATS-safe and single column
    const matchesLayout = !selectedFilters.layout || selectedFilters.layout === 'ats-safe' || selectedFilters.layout === 'one-column';
    
    // For style filter - match based on template type
    const isProfessionalStyle = template.name.includes('Modern');
    const isMinimalStyle = template.name.includes('Skills') || template.name.includes('Academic');
    const isClassicStyle = template.name.includes('Classic');
    
    const matchesStyle = !selectedFilters.style || 
      selectedFilters.style === 'professional' && (isProfessionalStyle || isClassicStyle) ||
      selectedFilters.style === 'minimal' && (isMinimalStyle);
    
    // For photo filter - match based on current template variant
    const currentVariant = templateVariants[template.id] || {};
    const hasPhoto = currentVariant.showPhoto === true;
    
    const matchesPhoto = !selectedFilters.photo || 
      selectedFilters.photo === 'any' ||
      selectedFilters.photo === 'with' && hasPhoto ||
      selectedFilters.photo === 'without' && !hasPhoto;
    
    // Template matches if it matches experience level, layout, style, and photo preferences
    const matchesFilters = matchesExperience && matchesLayout && matchesStyle && matchesPhoto;
    
    // Add match status to template for highlighting
    return {
      ...template,
      matchesFilters: matchesFilters
    };
  });

  const visibleTemplates = showAll ? filteredTemplates : filteredTemplates.slice(0, 12);

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleTemplateSelect = (templateId) => {
    updateTemplate(templateId);
    // Update template variant if there are variants for this template
    if (templateVariants[templateId]) {
      Object.entries(templateVariants[templateId]).forEach(([variant, value]) => {
        updateTemplateVariant(templateId, variant, value);
      });
    }
    onSelectTemplate(templateId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Choose Your Template</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Select from our professionally designed templates to create your perfect resume</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:w-1/4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Filters</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-0.5 bg-blue-500"></span>
                  Experience Level
                </h3>
                <div className="space-y-3">
                  {experienceLevels.map(level => (
                    <label key={level.id} className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="experienceLevel"
                        value={level.id}
                        checked={selectedFilters.experienceLevel === level.id}
                        onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-3 text-gray-700 font-medium">{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-0.5 bg-indigo-500"></span>
                  Layout
                </h3>
                <div className="space-y-3">
                  {layouts.map(layout => (
                    <label key={layout.id} className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="layout"
                        value={layout.id}
                        checked={selectedFilters.layout === layout.id}
                        onChange={(e) => handleFilterChange('layout', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-3 text-gray-700 font-medium">{layout.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-0.5 bg-purple-500"></span>
                  Style
                </h3>
                <div className="space-y-3">
                  {styles.map(style => (
                    <label key={style.id} className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="style"
                        value={style.id}
                        checked={selectedFilters.style === style.id}
                        onChange={(e) => handleFilterChange('style', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-3 text-gray-700 font-medium">{style.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-0.5 bg-yellow-500"></span>
                  Photo
                </h3>
                <div className="space-y-3">
                  {photos.map(photo => (
                    <label key={photo.id} className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="photo"
                        value={photo.id}
                        checked={selectedFilters.photo === photo.id}
                        onChange={(e) => handleFilterChange('photo', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-3 text-gray-700 font-medium">{photo.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Area - Template Cards */}
          <div className="lg:w-3/4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {visibleTemplates.map(template => {
                const variant = templateVariants[template.id] || {};
                const userBlurb = [
                  resumeData.personal.fullName || 'Your Name',
                  resumeData.personal.title || 'Role',
                  resumeData.personal.educationLevel || 'Profile'
                ].filter(Boolean).slice(0, 3).join(' • ');
                return (
                <div key={template.id} className={`bg-white rounded-2xl shadow-md border ${template.matchesFilters ? 'border-blue-200 shadow-lg' : 'border-gray-200'} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden`}>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{template.name}</h3>
                        <p className="text-gray-600 text-xs">{template.description}</p>
                        <p className="text-gray-500 text-[11px] mt-1 font-medium">{userBlurb}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {template.isRecommended && (
                          <span className="px-2 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-medium rounded-full shadow-sm">
                            Recommended
                          </span>
                        )}
                        {!template.matchesFilters && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                            Less Relevant
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="h-80 overflow-hidden flex items-start justify-center">
                        <div className="transform scale-[0.55] origin-top">
                          <Suspense fallback={<div className="text-xs text-center py-8 text-gray-500">Loading preview...</div>}>
                            <ResumeContext.Provider value={{ resumeData, currentTemplate }}>
                              <div className="max-w-[210mm] bg-white text-black text-xs">
                                <TemplateSelector 
                                  currentTemplateId={template.id}
                                  templateVariants={templateVariants[template.id] || {}}
                                />
                              </div>
                            </ResumeContext.Provider>
                          </Suspense>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                        ATS Safe
                      </span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                        Single Column
                      </span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                        {template.name.includes('Modern') ? 'Professional' : 
                         template.name.includes('Skills') ? 'Tech-Focused' : 
                         template.name.includes('Academic') ? 'Entry-Level' : 'Universal'}
                      </span>
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">
                        Photo: {variant.showPhoto ? 'On' : 'Off'}
                      </span>
                    </div>
                    
                    {/* Variant Selectors */}
                    <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">Variants</div>
                      
                      {/* Experience Level Selector */}
                      <div className="mb-2">
                        <label className="text-xs text-gray-600 mb-1 block">Experience</label>
                        <select 
                          value={variant.experienceLevel || ''}
                          onChange={(e) => {
                            updateTemplateVariant(template.id, 'experienceLevel', e.target.value);
                          }}
                          className="w-full p-1.5 text-xs border border-gray-300 rounded bg-white"
                        >
                          <option value="">Default</option>
                          <option value="no-experience">No Experience</option>
                          <option value="less-than-3">Less than 3 Years</option>
                          <option value="3-5">3-5 Years</option>
                          <option value="5-10">5-10 Years</option>
                          <option value="10-plus">10+ Years</option>
                        </select>
                      </div>
                      
                      {/* Photo Toggle */}
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Photo</label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              updateTemplateVariant(template.id, 'showPhoto', true);
                            }}
                            className={`flex-1 py-1 px-2 text-xs rounded border transition-colors ${
                              variant.showPhoto === true 
                                ? 'bg-blue-100 border-blue-500 text-blue-700' 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            On
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateTemplateVariant(template.id, 'showPhoto', false);
                            }}
                            className={`flex-1 py-1 px-2 text-xs rounded border transition-colors ${
                              variant.showPhoto === false 
                                ? 'bg-blue-100 border-blue-500 text-blue-700' 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Off
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`w-full py-2.5 px-3 rounded-lg font-medium transition-all ${
                        currentTemplate === template.id
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {currentTemplate === template.id ? 'Selected' : 'Use Template'}
                    </button>
                  </div>
                </div>
                )})}
            </div>
            {filteredTemplates.length > 12 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-5 py-3 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:text-indigo-700 transition-all"
                >
                  {showAll ? 'Show fewer templates' : `Show all ${filteredTemplates.length} ATS templates`}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Trust Messaging */}
        <div className="mt-10 text-center">
          <p className="text-gray-700 text-sm max-w-2xl mx-auto font-medium">
            All templates are single-column and optimized for ATS systems.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionPage;