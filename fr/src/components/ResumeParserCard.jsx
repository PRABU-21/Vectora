import React, { useState } from "react";
import { parseResume, saveParsedProfile } from "../data/api";

const Field = ({ label, value, textarea }) => {
  const formatObject = (obj) => {
    if (!obj || typeof obj !== "object") return "";

    return Object.values(obj)
      .filter(Boolean)
      .map((v) => {
        if (Array.isArray(v)) {
          return v
            .map((item) =>
              typeof item === "object" ? formatObject(item) : String(item),
            )
            .filter(Boolean)
            .join(", ");
        }
        if (typeof v === "object") return formatObject(v);
        return String(v);
      })
      .filter(Boolean)
      .join(" — ");
  };

  const displayValue = (() => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      const items = value
        .map((entry) => {
          if (entry === null || entry === undefined) return "";
          if (typeof entry === "object") return formatObject(entry);
          return String(entry);
        })
        .filter(Boolean);
      return items.join("\n");
    }
    if (typeof value === "object") {
      return formatObject(value);
    }
    return String(value);
  })();

  const filled = Boolean(displayValue);

  return (
    <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
        <span
          className={`text-2xs px-2 py-1 rounded-full font-semibold ${filled ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
        >
          {filled ? "Parsed" : "Missing"}
        </span>
      </div>
      {textarea ? (
        <textarea
          readOnly
          value={displayValue}
          rows={3}
          className={`w-full px-3 py-2 rounded-lg border ${filled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
        />
      ) : (
        <input
          readOnly
          value={displayValue}
          className={`w-full px-3 py-2 rounded-lg border ${filled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
        />
      )}
    </div>
  );
};

const ResumeParserCard = ({ onSave, onParsed }) => {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const formatUrl = (val) => {
    if (!val) return "";
    if (Array.isArray(val)) return val[0] || "";
    if (typeof val === "object") return Object.values(val).find(Boolean) || "";
    return String(val);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a PDF or DOCX file");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const response = await parseResume(file);
      if (!response?.success) {
        throw new Error(response?.message || "Parse failed");
      }
      const profile = response.profile || null;
      setParsed(profile);
      if (response.notice) setNotice(response.notice);
      if (profile && onParsed) {
        onParsed(profile);
      }
      setSaveMessage(null);
    } catch (err) {
      setError(
        err?.message || "Something went wrong while parsing your resume",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const response = await saveParsedProfile(parsed);
      if (!response?.success) {
        throw new Error(response?.message || "Save failed");
      }
      setSaveMessage("Saved to your profile successfully");
      if (onSave) {
        onSave(response.profile);
      }
    } catch (err) {
      setError(
        err?.message || "Something went wrong while saving your profile",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Resume Parser</h2>
          <p className="text-sm text-gray-600">
            Upload a resume to auto-extract profile details.
          </p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700">
            Resume File (PDF or DOCX)
          </label>
          <label className="flex items-center gap-3 w-full border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 bg-gray-50 hover:border-red-300 hover:bg-white transition cursor-pointer">
            <div className="h-12 w-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-semibold">
              PDF
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {file ? file.name : "Choose a file"}
              </p>
              <p className="text-xs text-gray-500">
                Drag & drop or click to browse • Max 10MB
              </p>
            </div>
            <span className="text-xs font-semibold text-red-600">Browse</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={handleUpload}
            disabled={loading}
            className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition disabled:opacity-60"
          >
            {loading ? "Parsing..." : "Upload & Parse"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {notice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
            {notice}
          </div>
        )}
        {saveMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
            {saveMessage}
          </div>
        )}

        {parsed && (
          <div className="mt-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Parsed Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" value={parsed.full_name} />
              <Field label="Email" value={parsed.email} />
              <Field label="Phone" value={parsed.phone_number} />
              <Field
                label="GitHub Profile"
                value={formatUrl(parsed.github_profile)}
              />
              <Field
                label="LeetCode Profile"
                value={formatUrl(parsed.leetcode_profile)}
              />
              <Field
                label="Areas of Interest"
                value={parsed.areas_of_interest}
                textarea
              />
            </div>
            <Field label="Skills" value={parsed.skills} textarea />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Education" value={parsed.education} textarea />
              <Field label="Experience" value={parsed.experience} textarea />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Projects" value={parsed.projects} textarea />
              <Field
                label="Certifications"
                value={parsed.certifications}
                textarea
              />
            </div>
            <Field label="Achievements" value={parsed.achievements} textarea />
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save to Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeParserCard;
