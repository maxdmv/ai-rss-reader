
# Minimal RSS/Atom Reader — AI Catalogue (Automatic Grouping)

This version groups articles **on the fly** using free local AI:
- Generates embeddings with `@xenova/transformers` (no API keys).
- Clusters articles by cosine similarity (greedy threshold).
- Renders each cluster as a `<section>` with a simple auto-generated title.
- Semantic HTML only (no classes); customise `public/styles.css` as you wish.

## Requirements
- Node.js

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
    "http://feeds.reuters.com/reuters/topNews",
    "http://feeds.bbci.co.uk/news/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    "http://rss.cnn.com/rss/edition.rss",
    "https://feeds.npr.org/1001/rss.xml",
    "https://www.theguardian.com/world/rss",
    "https://apnews.com/rss"
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
