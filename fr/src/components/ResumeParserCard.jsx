import React, { useState } from "react";
import { parseResume } from "../data/api";

const ResumeParserCard = ({ onParsed }) => {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

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
      setSaveMessage("Parsed and synced to the form below. Review and hit Save Profile.");
    } catch (err) {
      setError(
        err?.message || "Something went wrong while parsing your resume",
      );
    } finally {
      setLoading(false);
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

        {parsed && saveMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeParserCard;
