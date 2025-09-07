
# Minimal RSS/Atom Reader — AI Catalogue (Automatic Grouping)

This version groups articles **on the fly** using free local AI:
- Generates embeddings with `@xenova/transformers` (no API keys).
- Clusters articles by cosine similarity (greedy threshold).
- Renders each cluster as a `<section>` with a simple auto-generated title.
- Semantic HTML only (no classes); customise `public/styles.css` as you wish.

## Requirements
- Node.js 18+

## Run
```bash
npm install
npm run dev
# open http://localhost:3000
```
If port 3000 is busy:
```bash
PORT=3001 npm run dev
```

## Configure
Edit `feeds.json`:
```json
{
  "title": "My Reader",
  "feeds": [
    "https://meduza.io/rss/all",
    "https://www.kommersant.ru/RSS/news.xml",
    "https://rssexport.rbc.ru/rbcnews/news/30/full.rss"
  ],
  "refreshSeconds": 180,
  "aiCluster": true,
  "similarityThreshold": 0.78,
  "maxGroups": 12
}
```
- `aiCluster`: turn grouping on/off.
- `similarityThreshold` (0–1): higher → stricter grouping, more groups.
- `maxGroups`: cap the number of groups (largest kept).

## Notes
- First run downloads a small embedding model and caches it locally.
- Group titles are extracted from member titles via simple keyword scoring; adjust in `lib/cluster.js` if needed.
- HTML remains class-less.
