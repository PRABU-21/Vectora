import { pipeline } from "@xenova/transformers";

let embedderInstance = null;

async function getEmbedder() {
  if (!embedderInstance) {
    // Lazily load to avoid startup cost until first embedding request
    embedderInstance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderInstance;
}

export async function embedText(text = "") {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  // Ensure plain array for Mongo storage
  return Array.from(output.data);
}
