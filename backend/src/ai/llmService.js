import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are Vectora AI, the in-product assistant for job matching, resumes, and career coaching.

Scope guardrails (never break these):
- Stay on resumes, job matches, interview prep, freelancing/projects in the platform, and career guidance.
- If asked for anything outside this scope (news, code help, generic chit-chat, personal data, finance, politics, etc.), kindly steer back: "I can help with resumes, job matches, interview prep, and career guidance on Vectora. What would you like to work on?"
- Never invent jobs, companies, salaries, contact details, or facts not in the provided context.
- If required data is missing, say what’s missing and ask briefly.

Responsibilities:
1) Explain match scores clearly (strengths, gaps, missing skills/keywords, 3–5 concrete fixes).
2) Identify missing skills between resume and job description and suggest concise improvements.
3) Provide structured, actionable career guidance (roadmaps, next steps, portfolio ideas) within the scope.
4) Sound encouraging, warm, and calm—never scolding.

Style:
- Prefer bullets and short paragraphs.
- Keep the tone friendly, inviting, and helpful.
- Call out uncertainties explicitly.
- Keep responses under 200 words unless context truly needs more.

If context is insufficient, say so clearly and stay within scope.`;

// Default to a generally available Groq model; override via GROQ_MODEL if needed
const modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

let groqClient = null;

const getGroqClient = () => {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY_CHAT || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY_CHAT or GROQ_API_KEY is not set");
  }
  groqClient = new Groq({ apiKey });
  return groqClient;
};

const formatContext = ({ resumeChunks = [], jobChunks = [], score = null }) => {
  const resumeText = resumeChunks
    .filter(Boolean)
    .map((c, idx) => `Resume chunk ${idx + 1}: ${c}`)
    .join("\n");

  const jobText = jobChunks
    .filter(Boolean)
    .map((c, idx) => `Job chunk ${idx + 1}: ${c}`)
    .join("\n");

  const parts = [];
  if (resumeText) parts.push(resumeText);
  if (jobText) parts.push(jobText);
  if (score !== null && score !== undefined) parts.push(`Match score: ${score}`);

  if (!parts.length) return "";
  return `Context:\n${parts.join("\n")}`;
};

export const generateChatResponse = async ({ message, resumeChunks = [], jobChunks = [], score = null }) => {
  try {
    const trimmed = (message || "").trim();
    if (!trimmed) {
      throw new Error("Message is required");
    }

    const groq = getGroqClient();
    const contextBlock = formatContext({ resumeChunks, jobChunks, score });

    const prompt = contextBlock
      ? `${contextBlock}\n\nUser question: ${trimmed}`
      : `User question: ${trimmed}`;

    const result = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.25,
    });

    const reply = result?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error(`Empty response from Groq (model: ${modelName})`);
    }

    return reply;
  } catch (error) {
    console.error("generateChatResponse error", error.message);
    throw new Error("Failed to generate response");
  }
};

export default generateChatResponse;
