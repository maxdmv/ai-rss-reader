
import { pipeline } from '@xenova/transformers';

let embedderPromise = null;

/**
 * Returns a feature-extraction pipeline with a compact model.
 * Model: MiniLM family (small, fast). No API keys.
 */
async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedderPromise;
}

/**
 * Get a normalised embedding vector for a short text.
 * @param {string} text
 * @returns {Promise<Float32Array>}
 */
export async function embed(text) {
  const model = await getEmbedder();
  // Mean pooling over token embeddings
  const out = await model(text, { pooling: 'mean', normalize: true });
  // out is a float32array already normalised
  return out.data;
}
