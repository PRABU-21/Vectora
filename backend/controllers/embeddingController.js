import multer from "multer";
import fs from "fs";
import path from "path";
import axios from "axios";
import { pipeline } from "@xenova/transformers";
import Embedding from "../models/Embedding.js";
import User from "../models/User.js";

// Create raw responses directory if it doesn't exist
const rawResponsesDir = path.join(process.cwd(), "raw_responses");
if (!fs.existsSync(rawResponsesDir)) {
  fs.mkdirSync(rawResponsesDir, { recursive: true });
}

// ----------------- Multer Setup -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });

// ----------------- Model Setup -----------------
let embedModel = null;

async function loadEmbedModel() {
  if (!embedModel) {
    console.log("🔄 Loading embedding model...");
    embedModel = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedding model loaded successfully");
  }
  return embedModel;
}

// Create and persist a single embedding from arbitrary text
export async function createEmbeddingFromText({
  userId,
  content,
  field = "profile",
  originalFile = "parsed-profile.json",
}) {
  if (!userId) throw new Error("userId is required for embedding");
  if (!content) throw new Error("content is required for embedding");

  const model = await loadEmbedModel();
  const embeddingResult = await model(content, {
    pooling: "mean",
    normalize: true,
  });
  const embedding = Array.from(embeddingResult.data);

  const embeddingDoc = new Embedding({
    userId,
    originalFile,
    field,
    content,
    embedding,
  });

  await embeddingDoc.save();
  return embeddingDoc;
}

// ----------------- Helper: Clean AI JSON -----------------
function cleanJsonString(str) {
  str = str.trim();

  // Remove markdown code block wrappers
  if (str.startsWith("```")) {
    str = str.split("```")[1] || "";
    str = str.replace(/^json/i, "").trim();
  }

  // Remove any trailing markdown
  if (str.endsWith("```")) {
    str = str.substring(0, str.lastIndexOf("```"));
  }

  // Replace newlines inside strings with spaces
  str = str.replace(/\r?\n/g, " ");

  // Handle unescaped quotes inside strings by being more careful
  try {
    // First try to parse as-is
    JSON.parse(str);
    return str;
  } catch (e) {
    // If that fails, try to fix common issues
    // Replace unescaped quotes that are likely inside strings
    str = str.replace(/("[^"\\]*)(?:"|\\")([^"\\]*")/g, (match, p1, p2) => {
      return p1 + '\\"' + p2;
    });

    // Replace other problematic characters
    str = str.replace(/\\"/g, '"'); // Handle any double escapes
    str = str.replace(/([^\\])"/g, '$1\\"'); // Escape unescaped quotes

    // Try to fix common JSON issues
    str = str.replace(/,\s*}/g, "}"); // Remove trailing commas before }
    str = str.replace(/,\s*]/g, "]"); // Remove trailing commas before ]

    // Remove any content after the final closing brace
    const lastBrace = str.lastIndexOf("}");
    if (lastBrace !== -1) {
      str = str.substring(0, lastBrace + 1);
    }
  }

  return str.trim();
}

// ----------------- Helper: Safe JSON Parse -----------------
function safeJsonParse(str) {
  try {
    // First try to parse as-is
    return JSON.parse(str);
  } catch (e) {
    // If that fails, try to clean and parse
    const cleaned = cleanJsonString(str);
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      // If still failing, try a more aggressive approach
      // Remove problematic characters while preserving structure
      let aggressiveClean = cleaned
        .replace(/\r/g, "\\r") // Escape carriage returns
        .replace(/\n/g, "\\n") // Escape newlines
        .replace(/\t/g, "\\t"); // Escape tabs

      try {
        return JSON.parse(aggressiveClean);
      } catch (e3) {
        // If all else fails, return null to indicate failure
        console.error("All JSON parsing attempts failed:", e3.message);
        return null;
      }
    }
  }
}

function extractFirstJsonObject(str) {
  if (!str) return null;
  const match = str.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = safeJsonParse(match[0]);
    if (parsed) return parsed;
  }
  return null;
}

// ----------------- Helper: Flatten content -----------------
function flatten(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
      .join(" ");
  }

  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}

// ----------------- Helper: Parse text with Gemini -----------------
async function parseTextWithGemini(textContent) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "") {
    console.warn("GEMINI_API_KEY not set. Using mock response.");
    return JSON.stringify({
      title: "Mock Title",
      summary: "Mock Summary",
      keywords: ["mock", "test"],
      categories: ["test"],
      content: textContent.substring(0, 100),
    });
  }

  const prompt = `
You are an expert resume parser.
Extract meaningful information from the text below.
Return ONLY valid JSON with:
- No line breaks inside strings
- Properly escaped quotes
- No markdown
If a field is missing, set it to null.

{
  "title": "",
  "summary": "",
  "keywords": [],
  "categories": [],
  "content": ""
}

Resume Text:
"""
${textContent}
"""
`;

  try {
    console.log("🔍 Sending text to Gemini API for parsing...");
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1024,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Gemini API responded successfully");
    return response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    console.warn("Using mock response due to error");
    return JSON.stringify({
      title: "Mock Title",
      summary: "Mock Summary",
      keywords: ["mock", "test"],
      categories: ["test"],
      content: textContent.substring(0, 100),
    });
  }
}

// ----------------- Helper: Store raw Gemini response -----------------
function storeRawResponse(textContent, rawResponse, userId, fileName) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const userIdClean = userId.toString();
    const fileNameClean = path.parse(fileName).name; // Get just the filename without extension

    const rawResponseFileName = `${userIdClean}_${fileNameClean}_${timestamp}.txt`;
    const rawResponsePath = path.join(rawResponsesDir, rawResponseFileName);

    // Create content to save: original text + raw Gemini response
    const contentToSave =
      `Original Text:
${"=".repeat(50)}
${textContent}

` + `Raw Gemini Response:\n${"=".repeat(50)}\n${rawResponse}\n`;

    fs.writeFileSync(rawResponsePath, contentToSave);
    console.log(`💾 Raw response saved to: ${rawResponsePath}`);
  } catch (error) {
    console.error("Error saving raw response:", error);
  }
}

// ----------------- Controller: Upload Embedding -----------------
export const uploadEmbedding = async (req, res) => {
  try {
    console.log("🚀 Starting embedding upload process...");

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`✅ File uploaded: ${req.file.originalname}`);
    console.log(`📁 File path: ${req.file.path}`);

    const textContent = fs.readFileSync(req.file.path, "utf-8");
    console.log(
      `📄 Text content loaded, length: ${textContent.length} characters`
    );

    // 1️⃣ Parse with Gemini
    console.log("🔍 Parsing text with Gemini API...");
    let parsedRaw = await parseTextWithGemini(textContent);
    console.log("📋 Raw Gemini API Response received");

    // Store the raw response in a text file
    console.log("💾 Storing raw response in file...");
    storeRawResponse(textContent, parsedRaw, req.userId, req.file.originalname);

    // Use safe JSON parsing
    console.log("🔄 Attempting to parse Gemini response as JSON...");
    let parsedJSON = safeJsonParse(parsedRaw) || extractFirstJsonObject(parsedRaw);

    if (parsedJSON === null) {
      console.warn("⚠️ Gemini JSON parse failed; using minimal fallback");
      parsedJSON = {
        title: null,
        summary: null,
        keywords: [],
        categories: [],
        content: textContent.substring(0, 5000),
      };
    }

    console.log("✅ JSON parsed successfully:", Object.keys(parsedJSON));
    console.log(
      "📋 Parsed Gemini API Response:",
      JSON.stringify(parsedJSON, null, 2)
    );

    // 2️⃣ Load embedding model
    console.log("🔄 Loading embedding model...");
    const model = await loadEmbedModel();
    console.log("✅ Embedding model loaded");

    // 3️⃣ Use RAW resume text for embedding (matches Python reference exactly)
    // Python: resume_embedding = model.encode(resume_text, normalize_embeddings=True)
    console.log(
      "📝 Using raw resume text for embedding (Python reference approach)"
    );
    console.log(`📄 Raw resume text length: ${textContent.length} characters`);

    console.log(
      "🔄 Creating single normalized embedding from RAW resume text..."
    );
    const embeddingResult = await model(textContent, {
      pooling: "mean",
      normalize: true, // Normalized embeddings (matches Python reference)
    });
    const embedding = Array.from(embeddingResult.data);

    console.log(
      `🧮 Embedding vector created with ${embedding.length} dimensions`
    );

    // 4️⃣ Save single resume embedding to MongoDB
    console.log(`💾 Saving single resume embedding to database...`);
    const embeddingDoc = new Embedding({
      userId: req.userId,
      originalFile: req.file.originalname,
      field: "resume", // Standardized field name for consistent retrieval
      content: textContent, // Store raw text, not parsed fields
      embedding,
    });

    await embeddingDoc.save();
    console.log(`✅ Resume embedding saved to database`);
    console.log("🎉 Embedding upload process completed successfully!");

    res.json({
      message: "Text processed successfully",
      parsed: parsedJSON,
      embeddingCount: 1,
      embeddingDimensions: embedding.length,
      contentLength: textContent.length,
    });
  } catch (err) {
    console.error("❌ Upload embedding error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ----------------- Controller: Get Embeddings -----------------
export const getEmbeddings = async (req, res) => {
  try {
    console.log(`🔍 Fetching embeddings for user: ${req.userId}`);

    let query = { userId: req.userId };
    if (req.query.field) {
      query.field = req.query.field;
      console.log(`🔍 Filtering by field: ${req.query.field}`);
    }
    if (req.query.originalFile) {
      query.originalFile = req.query.originalFile;
      console.log(`🔍 Filtering by original file: ${req.query.originalFile}`);
    }

    const embeddings = await Embedding.find(query);
    console.log(`✅ Found ${embeddings.length} embeddings`);

    res.json({ embeddings, count: embeddings.length });
  } catch (err) {
    console.error("❌ Get embeddings error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
