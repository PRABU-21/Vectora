import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractResumeText(filePath, originalName = "") {
  const lower = (originalName || "").toLowerCase();

  if (lower.endsWith(".pdf")) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return (data?.text || "").trim();
  }

  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    const data = await mammoth.extractRawText({ path: filePath });
    return (data?.value || "").trim();
  }

  // Fallback: treat as plain text
  return fs.readFileSync(filePath, "utf8").trim();
}

export function flattenResumeProfile(profile) {
  if (!profile || typeof profile !== "object") return "";

  const parts = [];
  const push = (label, value) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (!value.length) return;
      parts.push(`${label}: ${value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(" ")}`);
      return;
    }
    if (typeof value === "object") {
      parts.push(`${label}: ${JSON.stringify(value)}`);
      return;
    }
    const str = String(value).trim();
    if (str) parts.push(`${label}: ${str}`);
  };

  push("full_name", profile.full_name || profile.name);
  push("email", profile.email);
  push("phone", profile.phone_number || profile.phone);
  push("skills", profile.skills);
  push("education", profile.education);
  push("experience", profile.experience);
  push("projects", profile.projects);
  push("certifications", profile.certifications);
  push("achievements", profile.achievements);
  push("areas_of_interest", profile.areas_of_interest);
  push("summary", profile.summary);

  return parts.join("\n");
}

export function extractSection(text = "", headings = []) {
  const src = String(text || "");
  if (!src.trim()) return "";

  const wanted = new Set(
    (Array.isArray(headings) ? headings : [headings])
      .map((h) => String(h || "").trim().toLowerCase())
      .filter(Boolean)
  );
  if (!wanted.size) return "";

  const lines = src.split(/\r?\n/);
  const isHeading = (line) => {
    const normalized = String(line || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ");
    if (!normalized) return null;
    if (wanted.has(normalized)) return normalized;
    // Accept common heading variants
    if (wanted.has("projects") && (normalized === "project" || normalized === "projects")) return "projects";
    if (wanted.has("experience") && (normalized === "work experience" || normalized === "professional experience" || normalized === "experience")) return "experience";
    if (wanted.has("skills") && (normalized === "technical skills" || normalized === "skills")) return "skills";
    return null;
  };

  let active = null;
  const collected = [];

  for (const line of lines) {
    const h = isHeading(line);
    if (h) {
      active = h;
      continue;
    }

    // Stop collecting if a new ALLCAPS-ish section starts and we were active
    if (active) {
      const trimmed = line.trim();
      const looksLikeNewSection =
        trimmed.length >= 3 &&
        trimmed.length <= 40 &&
        /^[A-Z\s/&-]+$/.test(trimmed) &&
        !/^[A-Z]{1,2}$/.test(trimmed);

      if (looksLikeNewSection) {
        active = null;
        continue;
      }

      if (trimmed) collected.push(trimmed);
    }
  }

  return collected.join("\n").trim();
}
