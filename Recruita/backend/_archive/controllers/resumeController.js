import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";

const model = (() => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
})();

const fallbackProfile = (text = "") => ({
  full_name: "",
  email: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)?.[0] || "",
  phone_number: text.match(/(\+91[\s-]?)?\d{10}/)?.[0] || "",
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  achievements: [],
  areas_of_interest: [],
});

const extractText = async (filePath, originalName) => {
  const lower = originalName?.toLowerCase() || "";

  if (lower.endsWith(".pdf")) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  }

  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    const data = await mammoth.extractRawText({ path: filePath });
    return data.value || "";
  }

  // Fallback: treat as plain text
  return fs.readFileSync(filePath, "utf8");
};

const buildPrompt = (resumeText) => `
You are a resume parsing engine.

Return ONLY valid JSON.
No markdown.
No explanation.

Schema:
{
  "full_name": "",
  "email": "",
  "phone_number": "",
  "skills": [],
  "education": [],
  "experience": [],
  "projects": [],
  "certifications": [],
  "achievements": [],
  "areas_of_interest": []
}

Rules:
- All keys must exist
- Empty string or array if missing
- Do not guess

Resume:
"""
${resumeText.slice(0, 12000)}
"""
`;

export const parseResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please upload a resume file" });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    const resumeText = await extractText(filePath, originalName);
    const sanitizedText = resumeText || "";

    if (!model) {
      const profile = fallbackProfile(sanitizedText);
      return res.status(200).json({ success: true, profile, notice: "GEMINI_API_KEY missing; used regex fallback" });
    }

    let profile = null;
    try {
      const prompt = buildPrompt(sanitizedText);
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      // Swallow and fallback below
    }

    if (!profile) {
      profile = fallbackProfile(sanitizedText);
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to parse resume" });
  } finally {
    fs.unlink(filePath, () => {});
  }
};

// Persist parsed profile to the authenticated user's record
export const saveParsedProfile = async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile || typeof profile !== "object") {
      return res.status(400).json({ success: false, message: "Invalid profile payload" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.parsedProfile = profile;
    await user.save();

    return res.status(200).json({ success: true, profile: user.parsedProfile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to save parsed profile" });
  }
};

// Fetch saved parsed profile for the authenticated user
export const getParsedProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, profile: user.parsedProfile || {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch parsed profile" });
  }
};
