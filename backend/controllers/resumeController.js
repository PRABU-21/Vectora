import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { fromPath as pdfToPic } from "pdf2pic";
import mammoth from "mammoth";
import Groq from "groq-sdk";
import User from "../models/User.js";

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const schemaSnippet = `{
  "full_name": "",
  "email": "",
  "phone_number": "",
  "skills": [],
  "education": [],
  "experience": [],
  "projects": [],
  "certifications": [],
  "achievements": [],
  "areas_of_interest": [],
  "profile_strength": 0,
  "github_profile": "",
  "leetcode_profile": ""
}`;

const buildVisionPrompt = () => `You are a resume parsing engine.
Return ONLY valid JSON matching this schema (arrays of strings, never objects):
${schemaSnippet}
Rules:
- Keep each array specific: only skills in skills, only education entries in education, etc.
- Prefer short single-line entries; avoid paragraphs.
- If a field is absent, return an empty string/array (never null).
- Do not invent data beyond the resume.
- Do not mix awards into skills or education; keep awards in achievements.
- Keep degrees, dates, and institutions inside education/experience, not skills.
- Set profile_strength as an integer 0-100 representing overall resume completeness/quality.
- If present, set github_profile and leetcode_profile to full profile URLs (string), else empty string.
`;

const buildTextPrompt = (resumeText) => `${buildVisionPrompt()}

Resume text (use only what is present):
"""
${resumeText.slice(0, 12000)}
"""`;

const inferMime = (fileName = "") => {
  const ext = path.extname(fileName).toLowerCase();
  if ([".png"].includes(ext)) return "image/png";
  if ([".jpg", ".jpeg"].includes(ext)) return "image/jpeg";
  if ([".webp"].includes(ext)) return "image/webp";
  return "application/octet-stream";
};

const imageToDataUrl = (filePath, fileName) => {
  const mime = inferMime(fileName);
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
};

const pdfToImages = async (filePath, pageLimit = 3) => {
  const converter = pdfToPic(filePath, {
    format: "png",
    density: 220,
    width: 1400,
    height: 1800,
    saveFilename: "resume_page",
    savePath: path.dirname(filePath),
  });

  const images = [];
  for (let i = 1; i <= pageLimit; i += 1) {
    const result = await converter(i, { responseType: "base64" });
    if (result?.base64) {
      images.push(`data:image/png;base64,${result.base64}`);
    }
  }
  return images;
};

const extractDocText = async (filePath) => {
  const data = await mammoth.extractRawText({ path: filePath });
  return data.value || "";
};

const extractPdfText = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || "";
};

const callGroqVision = async ({ images = [], hintText = "" }) => {
  if (!groqClient) return null;
  if (!images.length) return null;

  const content = [
    {
      type: "text",
      text:
        buildVisionPrompt() +
        (hintText ? "\n\nOptional text hint:\n" + hintText : ""),
    },
    ...images.map((url) => ({ type: "image_url", image_url: { url } })),
  ];

  const completion = await groqClient.chat.completions.create({
    model: "llama-3.2-90b-vision-preview",
    messages: [{ role: "user", content }],
    temperature: 0.1,
    max_tokens: 1200,
  });

  const text = completion?.choices?.[0]?.message?.content?.trim() || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
};

const callGroqText = async (resumeText) => {
  if (!groqClient) return null;

  const completion = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a precise resume parsing engine. Reply with JSON only.",
      },
      { role: "user", content: buildTextPrompt(resumeText) },
    ],
    temperature: 0.1,
    max_tokens: 1200,
  });

  const text = completion?.choices?.[0]?.message?.content?.trim() || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
};

export const parseResume = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Please upload a resume file" });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    if (!groqClient) {
      return res
        .status(500)
        .json({ success: false, message: "GROQ_API_KEY not configured" });
    }

    const lower = originalName.toLowerCase();
    let profile = null;

    if (lower.endsWith(".pdf")) {
      let images = [];
      try {
        images = await pdfToImages(filePath, 3);
      } catch (err) {
        console.error("pdf-to-image failed", err.message);
      }

      if (images.length) {
        profile = await callGroqVision({ images, hintText: "" });
      }

      if (!profile) {
        const text = await extractPdfText(filePath);
        profile = await callGroqText(text);
      }
    } else if (
      [".png", ".jpg", ".jpeg", ".webp"].some((ext) => lower.endsWith(ext))
    ) {
      const dataUrl = imageToDataUrl(filePath, originalName);
      profile = await callGroqVision({ images: [dataUrl], hintText: "" });
    } else if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
      const text = await extractDocText(filePath);
      profile = await callGroqText(text);
    } else {
      const text = fs.readFileSync(filePath, "utf8");
      profile = await callGroqText(text);
    }

    if (!profile) {
      return res.status(502).json({
        success: false,
        message: "Failed to parse resume with Groq (vision/text)",
      });
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("parseResume error", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to parse resume",
    });
  } finally {
    fs.unlink(filePath, () => {});
  }
};

// Persist parsed profile to the authenticated user's record
export const saveParsedProfile = async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile || typeof profile !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid profile payload" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.parsedProfile = profile;
    await user.save();

    return res.status(200).json({ success: true, profile: user.parsedProfile });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save parsed profile",
    });
  }
};

// Fetch saved parsed profile for the authenticated user
export const getParsedProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, profile: user.parsedProfile || {} });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch parsed profile",
    });
  }
};
