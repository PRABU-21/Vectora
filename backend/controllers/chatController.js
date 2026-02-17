import { generateChatResponse } from "../src/ai/llmService.js";

export const handleChat = async (req, res) => {
  const { message, jobChunks = [], resumeChunks = [], score = null } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const reply = await generateChatResponse({
      message: String(message).trim(),
      jobChunks,
      resumeChunks,
      score,
    });

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("/api/chat error", error.message);
    return res.status(500).json({ message: "Failed to generate response" });
  }
};

export default handleChat;