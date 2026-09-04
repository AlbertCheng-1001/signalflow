import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Calibrated against real data: 15 pairwise comparisons among 6 outlets covering
// the same TSLA/NHTSA Cybercab story scored 0.59-0.80; unrelated TSLA headlines
// (including a topically-adjacent "Tesla Q2 highlights" story) scored 0.04-0.38.
// 0.50 sits in the gap between those two clusters.
export const DUPLICATE_THRESHOLD = 0.5;

export async function getEmbedding(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return { vector: res.data[0].embedding, tokens: res.usage?.total_tokens ?? null };
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
