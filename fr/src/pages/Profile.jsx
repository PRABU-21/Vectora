import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ResumeParserCard from "../components/ResumeParserCard";
import {
  getParsedProfile,
  saveParsedProfile,
  getLeetCodeProfile,
  generateProfileEmbedding,
} from "../data/api";
import ParticlesBackground from "../components/ParticlesBackground";
import Navbar from "../components/Navbar";

const InfoField = ({
  label,
  value,
  onChange,
  textarea,
  spanFull,
  placeholder,
}) => (
  <div className={`group ${spanFull ? "md:col-span-2" : ""}`}>
    <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
      <svg
        className="w-4 h-4 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
      </svg>
      {label}
    </label>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
      />
    )}
  </div>
);

const formatEntry = (item) => {
  if (!item) return "";
  if (typeof item === "object") {
    return Object.values(item).filter(Boolean).join(" — ");
  }
  return String(item);
};

const formatList = (data) => {
  if (!data) return "";
  if (Array.isArray(data))
    return data.map(formatEntry).filter(Boolean).join(", ");
  return formatEntry(data);
};

const formatMultiline = (data) => {
  if (!data) return "";
  if (Array.isArray(data)) {
    return data.map(formatEntry).filter(Boolean).join("\n");
  }
  return formatEntry(data);
};

const extractLeetCodeHandle = (profile) => {
  if (!profile || typeof profile !== "object") return "";

  const candidates = [
    profile.leetcode,
    profile.leetcode_profile,
    profile.leetCode,
    profile.leetcodeId,
    profile.leetcode_handle,
    profile.leetcodeHandle,
    profile.leetcodeUsername,
    profile.leetcode_user,
    profile.leetcode_user_id,
    profile.leetcode_userid,
    profile.leetcodeUrl,
  ];

  if (profile.socials && typeof profile.socials === "object") {
    candidates.push(profile.socials.leetcode, profile.socials.LeetCode);
  }

  if (Array.isArray(profile.links)) {
    candidates.push(
      ...profile.links
        .filter(Boolean)
        .map((v) => (typeof v === "string" ? v : v.url || "")),
    );
  }

  // Flatten nested objects that may contain URLs
  Object.values(profile).forEach((val) => {
    if (typeof val === "string") {
      candidates.push(val);
    }
  });

  const cleaned = candidates
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter((v) => v.toLowerCase().includes("leetcode"));

  for (const value of cleaned) {
    const urlMatch = value.match(/leetcode\.com\/(u\/)?([A-Za-z0-9_-]+)/i);
    if (urlMatch?.[2]) return urlMatch[2];

    const textMatch = value.match(/leetcode\s*[:@\/-]\s*([A-Za-z0-9_-]+)/i);
    if (textMatch?.[1]) return textMatch[1];
  }

  return "";
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [strengthValue, setStrengthValue] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [parsedProfile, setParsedProfile] = useState(null);
  const [parsedLoading, setParsedLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState("");
  const personalInfoRef = useRef(null);

  const [editableProfile, setEditableProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    areas_of_interest: "",
    skills: "",
    education: "",
    experience: "",
    projects: "",
    certifications: "",
    achievements: "",
    github_profile: "",
    leetcode_profile: "",
  });

  const listToString = (value) => {
    if (!value) return "";
    if (Array.isArray(value))
      return value.map(formatEntry).filter(Boolean).join(", ");
    return formatEntry(value);
  };

  const linesToString = (value) => {
    if (!value) return "";
    if (Array.isArray(value))
      return value.map(formatEntry).filter(Boolean).join("\n");
    return formatEntry(value);
  };

  const updateStrength = (profile) => {
    const value = Math.max(
      0,
      Math.min(
        100,
        Number(profile?.profile_strength ?? profile?.strength ?? 0),
      ),
    );
    setStrengthValue(value);
  };

  const hydrateEditable = (profile) => {
    setEditableProfile({
      full_name: profile?.full_name || "",
      email: profile?.email || user?.email || "",
      phone_number: profile?.phone_number || user?.phoneNumber || "",
      areas_of_interest: listToString(profile?.areas_of_interest),
      skills: listToString(profile?.skills),
      education: linesToString(profile?.education),
      experience: linesToString(profile?.experience),
      projects: linesToString(profile?.projects),
      certifications: listToString(profile?.certifications),
      achievements: listToString(profile?.achievements),
      github_profile: profile?.github_profile || "",
      leetcode_profile: profile?.leetcode_profile || "",
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (!leetcodeUsername && userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser?.username) {
        setLeetcodeUsername(parsedUser.username);
      }
    }

    const loadParsedProfile = async () => {
      try {
        setParsedLoading(true);
        const response = await getParsedProfile();
        if (response?.success) {
          setParsedProfile(response.profile);
          hydrateEditable(response.profile);
          updateStrength(response.profile);
          const detected = extractLeetCodeHandle(response.profile);
          if (detected) {
            setLeetcodeUsername(detected);
          }
        }
      } catch (err) {
        // ignore fetch errors silently
      } finally {
        setParsedLoading(false);
      }
    };

    loadParsedProfile();
  }, [navigate]);

  useEffect(() => {
    if (!leetcodeUsername && parsedProfile) {
      const detected = extractLeetCodeHandle(parsedProfile);
      if (detected) {
        setLeetcodeUsername(detected);
      }
    }
  }, [parsedProfile, leetcodeUsername]);

  const handleLeetcodeFetch = async () => {
    const username = leetcodeUsername.trim();
    if (!username) {
      setLeetcodeError("Enter a LeetCode username");
      return;
    }

    setLeetcodeLoading(true);
    setLeetcodeError("");
    try {
      const data = await getLeetCodeProfile(username);
      setLeetcodeData(data);
    } catch (err) {
      setLeetcodeData(null);
      setLeetcodeError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch LeetCode data",
      );
    } finally {
      setLeetcodeLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadMessage("Please upload a PDF file only");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    setUploading(true);
    setUploadMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/auth/upload-resume",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Update user data in localStorage
      const updatedUser = { ...user, resume: response.data.resume };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setUploadMessage("Resume uploaded successfully!");
    } catch (error) {
      setUploadMessage(
        error.response?.data?.message || "Failed to upload resume",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleParsedSave = (profile) => {
    setParsedProfile(profile);
    hydrateEditable(profile);
    updateStrength(profile);
    const detected = extractLeetCodeHandle(profile);
    if (detected) {
      setLeetcodeUsername(detected);
      setLeetcodeData(null);
    }
    requestAnimationFrame(() => {
      personalInfoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const buildPayload = () => {
    const splitComma = (val) =>
      val
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

    const splitLines = (val) =>
      val
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean);

    return {
      full_name: editableProfile.full_name.trim(),
      email: editableProfile.email.trim(),
      phone_number: editableProfile.phone_number.trim(),
      areas_of_interest: splitComma(editableProfile.areas_of_interest),
      skills: splitComma(editableProfile.skills),
      education: splitLines(editableProfile.education),
      experience: splitLines(editableProfile.experience),
      projects: splitLines(editableProfile.projects),
      certifications: splitComma(editableProfile.certifications),
      achievements: splitComma(editableProfile.achievements),
      github_profile: editableProfile.github_profile.trim(),
      leetcode_profile: editableProfile.leetcode_profile.trim(),
      profile_strength:
        parsedProfile?.profile_strength ?? parsedProfile?.strength ?? null,
    };
  };

  const handleManualSave = async () => {
    setSavingProfile(true);
    setSaveMessage("");
    try {
      const payload = buildPayload();
      const response = await saveParsedProfile(payload);
      if (response?.success) {
        setParsedProfile(response.profile);
        hydrateEditable(response.profile);
        updateStrength(response.profile);
        setSaveMessage("Profile saved successfully");
      } else {
        setSaveMessage(response?.message || "Failed to save profile");
      }
    } catch (err) {
      setSaveMessage(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [embeddingMessage, setEmbeddingMessage] = useState("");

  const handleGenerateEmbeddings = async () => {
    setEmbeddingLoading(true);
    setEmbeddingMessage("");
    try {
      const payload = buildPayload();
      // Use JSON string as the text source. It contains all the info.
      const textToEmbed = JSON.stringify(payload, null, 2);

      const response = await generateProfileEmbedding(textToEmbed);
      setEmbeddingMessage(response.message || "Embeddings generated successfully!");

      // Clear message after 3 seconds
      setTimeout(() => setEmbeddingMessage(""), 3000);
    } catch (err) {
      setEmbeddingMessage(err?.response?.data?.message || "Failed to generate embeddings");
    } finally {
      setEmbeddingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-400 via-violet-400 to-pink-700 relative overflow-hidden">
        <ParticlesBackground id="profile-hero-particles" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-200 via-blue-200 to-purple-200 backdrop-blur-lg rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-lg shadow-white/20">
              <span className="text-4xl font-bold text-indigo-900">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {user?.name}
              </h1>
              <p className="text-indigo-100 text-lg">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Top: AI Resume Parser Only */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-3">
            <div className="bg-white border border-gray-100 shadow-lg rounded-3xl p-6 lg:p-7">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                    AI resume parser
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upload → Parse → Sync
                  </h2>
                  <p className="text-sm text-gray-600">
                    Vision + text pipeline; clean JSON ready to save.
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    AI
                  </span>
                  <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    Vision
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Fast
                  </span>
                </div>
              </div>
              <ResumeParserCard onParsed={handleParsedSave} />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div
              ref={personalInfoRef}
              className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Personal Information
                </h2>
              </div>
              {user && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField
                      label="Full Name"
                      value={editableProfile.full_name}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, full_name: v }))
                      }
                    />
                    <InfoField
                      label="Email Address"
                      value={editableProfile.email}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, email: v }))
                      }
                    />
                    <InfoField
                      label="Phone Number"
                      value={editableProfile.phone_number}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, phone_number: v }))
                      }
                      spanFull
                    />
                    <InfoField
                      label="GitHub Profile"
                      value={editableProfile.github_profile}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, github_profile: v }))
                      }
                      spanFull
                      placeholder="https://github.com/username"
                    />
                    <InfoField
                      label="LeetCode Profile"
                      value={editableProfile.leetcode_profile}
                      onChange={(v) =>
                        setEditableProfile((p) => ({
                          ...p,
                          leetcode_profile: v,
                        }))
                      }
                      spanFull
                      placeholder="https://leetcode.com/u/username"
                    />
                    <InfoField
                      label="Areas of Interest"
                      value={editableProfile.areas_of_interest}
                      onChange={(v) =>
                        setEditableProfile((p) => ({
                          ...p,
                          areas_of_interest: v,
                        }))
                      }
                      spanFull
                      placeholder="Comma-separated"
                    />
                    <InfoField
                      label="Skills"
                      value={editableProfile.skills}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, skills: v }))
                      }
                      spanFull
                      placeholder="Comma-separated"
                    />
                    <InfoField
                      label="Education"
                      value={editableProfile.education}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, education: v }))
                      }
                      textarea
                      spanFull
                      placeholder="One entry per line"
                    />
                    <InfoField
                      label="Experience"
                      value={editableProfile.experience}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, experience: v }))
                      }
                      textarea
                      spanFull
                      placeholder="One role per line"
                    />
                    <InfoField
                      label="Projects"
                      value={editableProfile.projects}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, projects: v }))
                      }
                      textarea
                      spanFull
                      placeholder="One project per line"
                    />
                    <InfoField
                      label="Certifications"
                      value={editableProfile.certifications}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, certifications: v }))
                      }
                      spanFull
                      placeholder="Comma-separated"
                    />
                    <InfoField
                      label="Achievements"
                      value={editableProfile.achievements}
                      onChange={(v) =>
                        setEditableProfile((p) => ({ ...p, achievements: v }))
                      }
                      spanFull
                      placeholder="Comma-separated"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end">
                    {saveMessage && (
                      <div
                        className={`text-sm px-3 py-2 rounded-lg ${saveMessage.includes("success") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                      >
                        {saveMessage}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleManualSave}
                      disabled={savingProfile}
                      className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition disabled:opacity-60"
                    >
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Resume Upload Card */}
          </div>

          {/* Right Column - Profile Stats & Actions */}
          <div className="space-y-6">
            {/* Profile Strength Card */}
            <div className="bg-gradient-to-br from-sky-400 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Profile Strength</h3>

              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold">{strengthValue}%</span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 text-xs flex rounded-full bg-white/20">
                  <div
                    style={{ width: `${strengthValue}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white transition-all duration-500"
                  ></div>
                </div>
                <p className="text-red-100 text-sm mt-3">
                  {strengthValue >= 80
                    ? "Your profile looks strong."
                    : strengthValue >= 50
                      ? "Getting there—keep refining your details."
                      : "Add more detail to boost your score."}
                </p>
              </div>
            </div>

            {/* Resume Status (compact) */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Resume</h3>
                  <p className="text-sm text-gray-500">
                    Keep your latest resume active.
                  </p>
                </div>
              </div>

              {user?.resume ? (
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">
                        Resume uploaded successfully
                      </p>
                      <p className="text-sm text-gray-600">
                        Your resume is active and ready
                      </p>
                    </div>
                  </div>
                  <label className="cursor-pointer bg-white text-green-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-green-50 transition-all border border-green-200 hover:border-green-300 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Replace
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="group flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:border-red-400 transition bg-gradient-to-br from-gray-50 to-white hover:from-red-50 hover:to-rose-50">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-rose-100 group-hover:from-red-200 group-hover:to-rose-200 rounded-xl flex items-center justify-center mb-3">
                    <svg
                      className="w-7 h-7 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">
                    Upload your resume
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    PDF files only, max 5MB
                  </p>
                  <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-semibold group-hover:from-red-700 group-hover:to-rose-700 shadow-md">
                    Choose File
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {uploading && (
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-xl border border-blue-200">
                  <svg
                    className="animate-spin h-4 w-4 text-blue-600"
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
                  <p className="text-blue-700 text-sm font-medium">
                    Uploading your resume...
                  </p>
                </div>
              )}

              {uploadMessage && !uploading && (
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${uploadMessage.includes("success") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
                >
                  {uploadMessage.includes("success") ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <p className="text-sm font-medium">{uploadMessage}</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/resume-builder")}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h8M8 11h5m-6 7h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v11"
                        />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-indigo-800 transition-colors">
                      Build / Export Resume
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors"
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
                </button>

                <button
                  onClick={() => navigate("/job-recommendations")}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-red-50 hover:to-rose-50 rounded-xl border border-gray-200 hover:border-red-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
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
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-red-700 transition-colors">
                      View Job Matches
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors"
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
                </button>

                <button
                  onClick={handleGenerateEmbeddings}
                  disabled={embeddingLoading}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-emerald-50 rounded-xl border border-gray-200 hover:border-green-300 transition-all group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                      <svg
                        className="w-5 h-5 text-green-600"
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
                    <div className="text-left">
                      <span className="block font-semibold text-gray-700 group-hover:text-green-700 transition-colors">
                        {embeddingLoading ? "Generating..." : "Embed Profile for AI"}
                      </span>
                      {embeddingMessage && (
                        <span className={`block text-xs mt-1 ${embeddingMessage.includes("Failed") ? "text-red-500" : "text-green-600"}`}>
                          {embeddingMessage}
                        </span>
                      )}
                    </div>
                  </div>
                  {embeddingLoading ? (
                    <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors"
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
                  )}
                </button>
              </div>
            </div>

            {/* LeetCode Stats */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    LeetCode Stats
                  </h3>
                  <p className="text-sm text-gray-500">
                    Track solved problems and ranking
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Beta
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  placeholder="Enter LeetCode username"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 bg-gray-50 focus:bg-white focus:border-red-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleLeetcodeFetch}
                  disabled={leetcodeLoading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-md hover:from-red-700 hover:to-rose-700 transition disabled:opacity-60"
                >
                  {leetcodeLoading ? "Fetching..." : "Fetch"}
                </button>
              </div>

              {leetcodeError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {leetcodeError}
                </div>
              )}

              {leetcodeData && leetcodeData.success && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-white border border-indigo-100">
                      <p className="text-xs text-gray-500">Ranking</p>
                      <p className="text-xl font-semibold text-indigo-700">
                        {leetcodeData.ranking ?? "-"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-100">
                      <p className="text-xs text-gray-500">Reputation</p>
                      <p className="text-xl font-semibold text-emerald-700">
                        {leetcodeData.reputation ?? "-"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-white border border-amber-100">
                      <p className="text-xs text-gray-500">Star Rating</p>
                      <p className="text-xl font-semibold text-amber-700">
                        {leetcodeData.starRating ?? "-"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-100">
                      <p className="text-xs text-gray-500">Solved / Total</p>
                      <p className="text-xl font-semibold text-blue-700">
                        {leetcodeData.overall?.solvedCount ?? 0} /{" "}
                        {leetcodeData.overall?.totalCount ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">
                        By Difficulty
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(leetcodeData.solvedStats || []).map((stat) => (
                        <div
                          key={stat.difficulty}
                          className="rounded-lg bg-white border border-gray-200 p-3"
                        >
                          <p className="text-xs text-gray-500">
                            {stat.difficulty}
                          </p>
                          <p className="text-lg font-semibold text-gray-800">
                            {stat.count}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {leetcodeData.topics?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-sm font-semibold text-gray-800 mb-3">
                        Top Topics
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {leetcodeData.topics.slice(0, 8).map((topic) => (
                          <span
                            key={topic.name}
                            className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
                          >
                            {topic.name} ({topic.solved})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Help Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-start gap-3 mb-3">
                <svg
                  className="w-6 h-6 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold mb-2">Need Help?</h3>
                  <p className="text-blue-100 text-sm">
                    Our support team is here to assist you with any questions.
                  </p>
                </div>
              </div>
              <button className="w-full bg-white text-blue-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-all mt-2">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
