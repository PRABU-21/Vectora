import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFreelancerProfile,
  createFreelancerProfile,
  updateFreelancerProfile
} from '../data/api';
import {
  MapPin,
  Mail,
  DollarSign,
  Briefcase,
  Globe,
  Award,
  Clock,
  Edit2,
  Save,
  X,
  User,
  Code,
  Layout,
  ChevronLeft
} from 'lucide-react';

const FreelancerProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    title: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    experience: { level: '', years: '' },
    languages: '',
    location: { country: '', city: '' },
    portfolio: []
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getFreelancerProfile();
      setProfile({
        ...response,
        skills: response.skills?.join(', ') || '',
        languages: response.languages?.join(', ') || '',
      });
    } catch (error) {
      setProfile({
        ...profile,
        name: JSON.parse(localStorage.getItem('user'))?.name || '',
        email: JSON.parse(localStorage.getItem('user'))?.email || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const profileData = {
        ...profile,
        skills: profile.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        languages: profile.languages.split(',').map(lang => lang.trim()).filter(lang => lang),
      };

      const response = profile._id
        ? await updateFreelancerProfile(profileData)
        : await createFreelancerProfile(profileData);

      setProfile({
        ...response,
        skills: response.skills?.join(', ') || '',
        languages: response.languages?.join(', ') || '',
      });
      setIsEditing(false);
    } catch (error) {
      setError('Failed to save profile');
      console.error('Error saving profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="p-2 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                Vectora
              </h1>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-rose-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-rose-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Freelancer Profile</h1>
            <p className="text-gray-500 mt-1">Manage your professional presence and rates</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-xl mb-8 flex items-center gap-3 animate-fade-in">
            <div className="p-1 bg-rose-100 rounded-full">
              <X className="w-4 h-4" />
            </div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column - Sticky Profile Card */}
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-28 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-rose-500 to-red-600 opacity-90 transition-opacity group-hover:opacity-100"></div>
                <div className="relative flex flex-col items-center text-center pt-8">
                  <div className="w-28 h-28 rounded-2xl bg-white p-1.5 shadow-xl mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-rose-100 to-red-50 flex items-center justify-center text-rose-600 font-bold text-4xl overflow-hidden relative">
                      {profile.name?.charAt(0).toUpperCase()}
                      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="w-full space-y-3">
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full text-center px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent font-bold text-gray-900"
                        placeholder="Your Name"
                      />
                      <input
                        type="text"
                        value={profile.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full text-center px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm text-gray-600"
                        placeholder="Professional Title"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                      <p className="text-rose-600 font-medium">{profile.title || 'Add a title'}</p>
                    </>
                  )}

                  <div className="mt-6 w-full space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group/item hover:bg-rose-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-gray-500 group-hover/item:text-rose-500 transition-colors">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Rate</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="number"
                          value={profile.hourlyRate}
                          onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                          className="w-20 text-right px-2 py-1 border border-gray-200 rounded text-sm"
                          placeholder="0"
                        />
                      ) : (
                        <span className="font-bold text-gray-900">${profile.hourlyRate || 0}/hr</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group/item hover:bg-rose-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-gray-500 group-hover/item:text-rose-500 transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Location</span>
                      </div>
                      {isEditing ? (
                        <div className="flex gap-1 w-32">
                          <input
                            type="text"
                            value={profile.location?.city}
                            onChange={(e) => handleInputChange('location.city', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                            placeholder="City"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900 text-sm truncate max-w-[120px]">
                          {profile.location?.city || 'Remote'}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="mt-8 pt-6 border-t border-gray-100 w-full flex justify-center gap-4 text-gray-400">
                      <div className="p-2 hover:bg-gray-50 rounded-full cursor-pointer hover:text-rose-600 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="p-2 hover:bg-gray-50 rounded-full cursor-pointer hover:text-rose-600 transition-colors">
                        <Globe className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Scrollable Content */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">

              {/* About Section */}
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">About Me</h3>
                </div>

                {isEditing ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent min-h-[150px] bg-gray-50/50"
                    placeholder="Tell clients about your expertise, passion, and what you bring to the table..."
                  />
                ) : (
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {profile.bio || "No bio added yet. Click edit to tell your story."}
                  </p>
                )}
              </div>

              {/* Skills & Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <Code className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Skills</h3>
                  </div>

                  {isEditing ? (
                    <div className="flex-1">
                      <textarea
                        value={profile.skills}
                        onChange={(e) => handleInputChange('skills', e.target.value)}
                        className="w-full h-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50 resize-none"
                        placeholder="React, Node.js, Design (comma separated)"
                      />
                      <p className="text-xs text-gray-400 mt-2">Separate skills with commas</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills ? (
                        profile.skills.split(',').map((skill, index) => (
                          <span key={index} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-default">
                            {skill.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No skills listed</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Experience & Langs */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                        <Award className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Experience</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Level</label>
                        {isEditing ? (
                          <select
                            value={profile.experience?.level}
                            onChange={(e) => handleInputChange('experience.level', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="">Select</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Expert">Expert</option>
                          </select>
                        ) : (
                          <p className="text-gray-900 font-medium text-lg">{profile.experience?.level || 'Not specified'}</p>
                        )}
                      </div>
                      <div className="pt-4 border-t border-gray-100">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Years Active</label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={profile.experience?.years}
                            onChange={(e) => handleInputChange('experience.years', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                            placeholder="0"
                          />
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-900 font-medium text-lg">{profile.experience?.years || 0}</span>
                            <span className="text-gray-500">years</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Languages</h3>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.languages}
                    onChange={(e) => handleInputChange('languages', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="English, Spanish, French (comma separated)"
                  />
                ) : (
                  <div className="flex gap-4">
                    {profile.languages ? (
                      profile.languages.split(',').map((lang, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          {lang.trim()}
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400">No languages listed</span>
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex items-center gap-4 pt-4 animate-fade-in-up">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 text-white py-4 rounded-xl font-bold hover:from-rose-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile();
                    }}
                    className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FreelancerProfile;