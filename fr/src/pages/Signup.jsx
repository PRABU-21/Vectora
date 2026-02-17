import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../data/api";

const Signup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "applicant",
    companyName: "",
    companyWebsite: "",
    companyLocation: "",
    designation: "",
    companyDescription: "",
    companyIndustry: "",
    companyTechStack: [],
    teamMembers: [],
    phoneNumber: "",
    city: "",
    state: "",
    country: "",
    primaryJobRole: "",
    totalExperience: "",
    highestEducation: "",
    currentStatus: "",
    primarySkills: [],
    preferredJobRoles: [],
    preferredLocations: [],
    employmentType: "",
  });
  const [skillInput, setSkillInput] = useState({
    skill: "",
    level: "Beginner",
  });
  const [preferredJobRoleInput, setPreferredJobRoleInput] = useState("");
  const [preferredLocationInput, setPreferredLocationInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const applicantSteps = [
    { number: 1, title: "Account", description: "Basic information" },
    { number: 2, title: "Location", description: "Where you're based" },
    { number: 3, title: "Professional", description: "Your career details" },
    { number: 4, title: "Skills", description: "What you know" },
  ];

  const recruiterSteps = [
    { number: 1, title: "Recruiter", description: "Account details" },
  ];

  const steps = formData.role === "recruiter" ? recruiterSteps : applicantSteps;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (formData.role === "recruiter") {
        if (
          !formData.name ||
          !formData.email ||
          !formData.password ||
          !formData.phoneNumber ||
          !formData.companyName ||
          !formData.companyWebsite ||
          !formData.companyLocation ||
          !formData.designation
        ) {
          setError("Please fill in all required fields");
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return;
        }
      } else {
        if (
          !formData.name ||
          !formData.email ||
          !formData.password ||
          !formData.confirmPassword ||
          !formData.role ||
          !formData.phoneNumber
        ) {
          setError("Please fill in all required fields");
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return;
        }
      }
    }

    setError("");
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const handleAddSkill = () => {
    if (skillInput.skill.trim()) {
      setFormData((prev) => ({
        ...prev,
        primarySkills: [...prev.primarySkills, { ...skillInput }],
      }));
      setSkillInput({ skill: "", level: "Beginner" });
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      primarySkills: prev.primarySkills.filter((_, i) => i !== index),
    }));
  };

  const handleAddPreferredJobRole = () => {
    if (preferredJobRoleInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        preferredJobRoles: prev.preferredJobRoles.includes(
          preferredJobRoleInput.trim(),
        )
          ? prev.preferredJobRoles
          : [...prev.preferredJobRoles, preferredJobRoleInput.trim()],
      }));
      setPreferredJobRoleInput("");
    }
  };

  const handleAddPreferredLocation = () => {
    if (preferredLocationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        preferredLocations: prev.preferredLocations.includes(
          preferredLocationInput.trim(),
        )
          ? prev.preferredLocations
          : [...prev.preferredLocations, preferredLocationInput.trim()],
      }));
      setPreferredLocationInput("");
    }
  };

  const handleRemoveTag = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.role === "recruiter") {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.phoneNumber ||
        !formData.companyName ||
        !formData.companyWebsite ||
        !formData.companyLocation ||
        !formData.designation
      ) {
        setError("Please fill in all required fields");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    } else if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const data = await signup(signupData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: {
        const roleSelector = (
          <div>
            <p className="block text-sm font-semibold text-gray-700 mb-3">
              Sign up as *
            </p>
            <div className="grid grid-cols-2 gap-3">
              {["applicant", "recruiter"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, role }));
                    setCurrentStep(1);
                    setError("");
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 border rounded-xl transition-all duration-200 text-left
                    ${
                      formData.role === role
                        ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        : "border-gray-300 hover:border-red-300"
                    }
                  `}
                >
                  <span className="flex-1 capitalize font-semibold">
                    {role}
                  </span>
                  {formData.role === role && (
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

        if (formData.role === "recruiter") {
          return (
            <div className="space-y-5">
              {roleSelector}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Work Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Website *
                </label>
                <input
                  name="companyWebsite"
                  type="url"
                  required
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="https://www.company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Location *
                </label>
                <input
                  name="companyLocation"
                  type="text"
                  required
                  value={formData.companyLocation}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Designation *
                </label>
                <input
                  name="designation"
                  type="text"
                  required
                  value={formData.designation}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="Recruiter / Talent Lead"
                />
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-5">
            {roleSelector}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="Re-enter your password"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        );
      }

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <p className="text-gray-600">
                Tell us where you're located (optional)
              </p>
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="San Francisco"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                State / Province
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="California"
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                value={formData.country}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="United States"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">
                Share your professional background (optional)
              </p>
            </div>

            <div>
              <label
                htmlFor="primaryJobRole"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Primary Job Role
              </label>
              <input
                id="primaryJobRole"
                name="primaryJobRole"
                type="text"
                value={formData.primaryJobRole}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div>
              <label
                htmlFor="totalExperience"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Total Experience (years)
              </label>
              <input
                id="totalExperience"
                name="totalExperience"
                type="number"
                min="0"
                value={formData.totalExperience}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="0"
              />
            </div>

            <div>
              <label
                htmlFor="highestEducation"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Highest Education
              </label>
              <select
                id="highestEducation"
                name="highestEducation"
                value={formData.highestEducation}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
              >
                <option value="">Select education level</option>
                <option value="Diploma">Diploma</option>
                <option value="UG">Undergraduate (UG)</option>
                <option value="PG">Postgraduate (PG)</option>
                <option value="PhD">Doctorate (PhD)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="currentStatus"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Current Status
              </label>
              <select
                id="currentStatus"
                name="currentStatus"
                value={formData.currentStatus}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
              >
                <option value="">Select current status</option>
                <option value="Student">Student</option>
                <option value="Working Professional">
                  Working Professional
                </option>
                <option value="Job Seeker">Job Seeker</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="employmentType"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Preferred Employment Type
              </label>
              <select
                id="employmentType"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
              >
                <option value="">Select employment type</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">
                Add your skills and preferences (optional)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Primary Skills
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput.skill}
                  onChange={(e) =>
                    setSkillInput({ ...skillInput, skill: e.target.value })
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., React, Python, etc."
                />
                <select
                  value={skillInput.level}
                  onChange={(e) =>
                    setSkillInput({ ...skillInput, level: e.target.value })
                  }
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.primarySkills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-red-100 transition-colors"
                  >
                    <span className="font-medium">{skill.skill}</span>
                    <span className="text-red-500">·</span>
                    <span className="text-red-600">{skill.level}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="ml-1 text-red-600 hover:text-red-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preferred Job Roles
              </label>
              <input
                type="text"
                value={preferredJobRoleInput}
                onChange={(e) => setPreferredJobRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPreferredJobRole();
                  }
                }}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="Type a role and press Enter"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.preferredJobRoles.map((role, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveTag("preferredJobRoles", index)
                      }
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preferred Locations
              </label>
              <input
                type="text"
                value={preferredLocationInput}
                onChange={(e) => setPreferredLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPreferredLocation();
                  }
                }}
                className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                placeholder="Type a location and press Enter"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.preferredLocations.map((location, index) => (
                  <span
                    key={index}
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-green-100 transition-colors"
                  >
                    {location}
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveTag("preferredLocations", index)
                      }
                      className="text-green-600 hover:text-green-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-white">
      {/* Left Side - Progress & Info */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-red-600 via-red-700 to-rose-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white w-full">
          <div className="mb-12">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Join Vectora</h1>
            <p className="text-xl text-red-100 leading-relaxed">
              Create your account in just a few simple steps
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.number} className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    currentStep > step.number
                      ? "bg-white text-red-600"
                      : currentStep === step.number
                        ? "bg-white/30 backdrop-blur-sm border-2 border-white text-white"
                        : "bg-white/10 backdrop-blur-sm text-white/60"
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="font-bold text-lg">{step.number}</span>
                  )}
                </div>
                <div
                  className={`transition-all duration-300 ${
                    currentStep >= step.number ? "opacity-100" : "opacity-60"
                  }`}
                >
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-red-100">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-12">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-red-100">Progress</span>
              <span className="font-semibold">
                {Math.round((currentStep / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Mobile Logo & Progress */}
          <div className="lg:hidden mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2 text-gray-600">
                <span>
                  Step {currentStep} of {steps.length}
                </span>
                <span className="font-semibold text-red-600">
                  {Math.round((currentStep / steps.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-600 to-rose-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {steps[currentStep - 1].title} Information
            </h2>
            <p className="text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="mb-8">{renderStepContent()}</div>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 py-4 px-6 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </span>
                </button>
              )}

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`flex-1 py-4 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    currentStep === 1 ? "w-full" : ""
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    Next
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-4 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Complete Registration
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Sign in link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-red-600 hover:text-red-700 transition"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
