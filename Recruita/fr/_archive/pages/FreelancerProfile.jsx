import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getFreelancerProfile, 
  createFreelancerProfile, 
  updateFreelancerProfile 
} from '../data/api';

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
      // Profile doesn't exist yet, which is fine
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Recruita
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Freelancer Profile</h1>
          <p className="text-xl text-gray-600">Manage your freelancer profile and showcase your skills</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {!isEditing ? (
            <div>
              {/* Profile View */}
              <div className="flex items-center gap-8 mb-8 pb-8 border-b border-gray-200">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-red-600 font-medium text-lg">{profile.title}</p>
                  <p className="text-gray-600">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">About</h3>
                  <p className="text-gray-600">{profile.bio || 'No bio provided'}</p>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills ? (
                      profile.skills.split(',').map((skill, index) => (
                        <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          {skill.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No skills listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Experience</h3>
                  <p className="text-gray-600">
                    {profile.experience?.level || 'Not specified'} •{' '}
                    {profile.experience?.years ? `${profile.experience.years} years` : 'Not specified'}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Hourly Rate</h3>
                  <p className="text-gray-600">
                    ${profile.hourlyRate || 0}/hour
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Languages</h3>
                  <p className="text-gray-600">
                    {profile.languages || 'Not specified'}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Location</h3>
                  <p className="text-gray-600">
                    {profile.location?.city && profile.location?.country
                      ? `${profile.location.city}, ${profile.location.country}`
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-md"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Profile Edit */}
              <div className="flex items-center gap-8 mb-8 pb-8 border-b border-gray-200">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-red-600 font-medium text-lg">{profile.title}</p>
                  <p className="text-gray-600">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title</label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={profile.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Tell us about yourself and your expertise..."
                    rows="4"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={profile.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., JavaScript, React, Node.js"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={profile.experience?.level}
                    onChange={(e) => handleInputChange('experience.level', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={profile.experience?.years}
                    onChange={(e) => handleInputChange('experience.years', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., 5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={profile.languages}
                    onChange={(e) => handleInputChange('languages', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., English, Spanish"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={profile.location?.country}
                    onChange={(e) => handleInputChange('location.country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., United States"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={profile.location?.city}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., New York"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-md"
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile(); // Reset to original values
                  }}
                  className="bg-gray-200 text-gray-800 py-3 px-8 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfile;