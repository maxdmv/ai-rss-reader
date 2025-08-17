
import { embed } from './embeddings.js';

/**
 * Cosine similarity for L2-normalised vectors.
 */
function cosine(a, b) {
  let s = 0.0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/**
 * Very small English and Russian stopword lists for title keywords.
 */
const STOP = new Set([
  'the','a','an','and','or','but','of','in','on','for','to','with','by','from','at','as','is','are','be','was','were','that','this','it','its','into','about','over','after','before','vs',
  'и','в','во','на','по','из','за','с','со','от','для','как','но','или','к','о','об','у','над','под','не','это','этот','эта','эти','тот','та','те'
]);

/**
 * Extract a simple keyword-based title for a group from member titles.
 */
function groupTitleFromTitles(titles, maxWords = 5) {
  const freq = new Map();
  for (const t of titles) {
    const words = String(t).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/);
    for (const w of words) {
      if (!w || STOP.has(w) || w.length < 3) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, maxWords).map(x => x[0]);
  if (sorted.length === 0) return 'Mixed topics';
  // Capitalise first word
  const first = sorted[0].charAt(0).toUpperCase() + sorted[0].slice(1);
  return [first, ...sorted.slice(1)].join(' ');
}

/**
 * Embed all items and group them using a greedy similarity threshold.
 * Returns an array of { title, items } clusters.
 * @param {Array} items
 * @param {number} threshold (0..1)
 */
export async function clusterItems(items, threshold = 0.78) {
  if (!items.length) return [];
  const texts = items.map(it => (it.title || '') + ' — ' + (it.summary || ''));
  const vecs = [];
  for (const t of texts) {
    vecs.push(await embed(t.slice(0, 2000)));
  }

  const clusters = []; // each: { centroid: Float32Array, idx: number[], items: [] }
  for (let i = 0; i < items.length; i++) {
    const v = vecs[i];
    let bestIdx = -1;
    let bestSim = -1;
    for (let c = 0; c < clusters.length; c++) {
      const sim = cosine(v, clusters[c].centroid);
      if (sim > bestSim) { bestSim = sim; bestIdx = c; }
    }
    if (bestSim >= threshold && bestIdx !== -1) {
      const cl = clusters[bestIdx];
      cl.idx.push(i);
      cl.items.push(items[i]);
      // Update centroid by simple running mean (keep normalised)
      const n = cl.idx.length;
      const centroid = cl.centroid;
      for (let k = 0; k < centroid.length; k++) {
        centroid[k] = ((centroid[k] * (n - 1)) + v[k]) / n;
      }
      // Re-normalise
      let norm = 0;
      for (let k = 0; k < centroid.length; k++) norm += centroid[k] * centroid[k];
      norm = Math.sqrt(norm);
      for (let k = 0; k < centroid.length; k++) centroid[k] /= norm || 1;
    } else {
      clusters.push({ centroid: Float32Array.from(v), idx: [i], items: [items[i]] });
    }
  }

  // Build result
  const result = clusters.map(cl => ({
    title: groupTitleFromTitles(cl.items.map(x => x.title)),
    items: cl.items
  }));

  return result;
}
