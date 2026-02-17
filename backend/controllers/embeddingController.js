import multer from "multer";
import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";
import Embedding from "../models/Embedding.js";
import User from "../models/User.js";
import pdf from "pdf-parse";
import Groq from "groq-sdk";

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

// ----------------- Helper: Process text with Groq -----------------
async function processTextWithGroq(textContent) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    console.warn("GROQ_API_KEY not set. Returning raw text.");
    return textContent;
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  try {
    console.log("🔍 Sending text to Groq API for processing...");
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at processing text for embeddings. Clean the following text, removing artifacts, extra whitespace, and ensuring it is well-formatted for job matching analysis. Return ONLY the cleaned text content, no markdown formatting or explanations."
        },
        {
          role: "user",
          content: textContent.substring(0, 30000) // Truncate to avoid context limits if excessively large
        },
      ],
      model: "llama3-70b-8192", // Use a capable model
    });

    const cleanedText = completion.choices[0]?.message?.content || textContent;
    console.log("✅ Groq API responded successfully");
    return cleanedText;

  } catch (err) {
    console.error("Groq API error:", err.message);
    console.warn("Using raw text due to error");
    return textContent;
  }
}

// ----------------- Helper: Extract Text from PDF -----------------
async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file");
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

    let rawTextContent = "";

    // Check file type
    if (req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf")) {
      console.log("📄 Detected PDF file. Extracting text...");
      rawTextContent = await extractTextFromPdf(req.file.path);
    } else {
      // Fallback for text files
      console.log("📄 Detected Text file. Reading directly...");
      rawTextContent = fs.readFileSync(req.file.path, "utf-8");
    }

    console.log(
      `📄 Raw text extracted, length: ${rawTextContent.length} characters`
    );

    // 1️⃣ Process with Groq
    console.log("🔍 Processing text with Groq API...");
    const processedText = await processTextWithGroq(rawTextContent);
    console.log(`📋 Processed text length: ${processedText.length} characters`);

    // 2️⃣ Load embedding model
    console.log("🔄 Loading embedding model...");
    const model = await loadEmbedModel();
    console.log("✅ Embedding model loaded");

    // 3️⃣ Create embedding from PROCESSED text
    console.log(
      "🔄 Creating single normalized embedding from PROCESSED text..."
    );
    const embeddingResult = await model(processedText, {
      pooling: "mean",
      normalize: true,
    });
    const embedding = Array.from(embeddingResult.data);

    console.log(
      `🧮 Embedding vector created with ${embedding.length} dimensions`
    );

    // 4️⃣ Save embedding to MongoDB
    console.log(`💾 Saving embedding to database...`);
    const embeddingDoc = new Embedding({
      userId: req.userId,
      originalFile: req.file.originalname,
      field: "resume", // Keeping "resume" as field for consistency or maybe "job_desc"? User didn't specify. Assuming typical usage.
      content: processedText, // Store PROCESSED text
      embedding,
    });

    await embeddingDoc.save();
    console.log(`✅ Embedding saved to database`);
    console.log("🎉 Embedding upload process completed successfully!");

    // Cleanup uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      console.warn("Failed to delete uploaded file:", e.message);
    }

    res.json({
      message: "File processed and embeddings generated successfully",
      embeddingCount: 1,
      embeddingDimensions: embedding.length,
      contentLength: processedText.length,
    });
  } catch (err) {
    console.error("❌ Upload embedding error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ----------------- Controller: Generate Embedding from Profile Text -----------------
export const generateProfileEmbedding = async (req, res) => {
  try {
    console.log("🚀 Starting profile embedding generation...");
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No profile text provided" });
    }

    console.log(`📄 Received profile text, length: ${text.length} characters`);

    // 1️⃣ Process with Groq
    console.log("🔍 Processing profile text with Groq API...");
    const processedText = await processTextWithGroq(text);
    console.log(`📋 Processed text length: ${processedText.length} characters`);

    // 2️⃣ Load embedding model
    console.log("🔄 Loading embedding model...");
    const model = await loadEmbedModel();
    console.log("✅ Embedding model loaded");

    // 3️⃣ Create embedding
    console.log("🔄 Creating normalized embedding from profile text...");
    const embeddingResult = await model(processedText, {
      pooling: "mean",
      normalize: true,
    });
    const embedding = Array.from(embeddingResult.data);

    // 4️⃣ Save to MongoDB
    console.log(`💾 Saving profile embedding to database...`);

    // Optional: Remove old profile embeddings for this user to avoid duplication/stale data
    await Embedding.deleteMany({ userId: req.userId, field: "profile" });

    const embeddingDoc = new Embedding({
      userId: req.userId,
      originalFile: "profile_data",
      field: "profile",
      content: processedText,
      embedding,
    });

    await embeddingDoc.save();
    console.log(`✅ Profile embedding saved`);

    res.json({
      success: true,
      message: "Profile embedding generated successfully",
      embeddingDimensions: embedding.length,
    });
  } catch (err) {
    console.error("❌ Profile embedding error:", err);
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
