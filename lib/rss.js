
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

// In-memory cache { url: { ts, ttl, data } }
const cache = new Map();

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'minimal-rss-reader/1.2' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

function pick(obj, pathList) {
  for (const p of pathList) {
    const v = p.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
    if (v) return v;
  }
  return undefined;
}

function asArray(x) { return Array.isArray(x) ? x : (x ? [x] : []); }

function normaliseOne(sourceUrl, parsed) {
  const channel = parsed?.rss?.channel || parsed?.feed;
  const rawItems = asArray(channel?.item || channel?.entry);
  const sourceTitle = pick(channel, ['title.#text', 'title']) || sourceUrl;

  const items = rawItems.map((it, idx) => {
    const title = pick(it, ['title.#text', 'title']) || '';
    let link = '';
    if (typeof it?.link === 'string') link = it.link;
    else link = pick(it, ['link.href', 'link.0.href', 'link.url']) || '';

    const summary = pick(it, ['description.#text', 'description', 'summary.#text', 'summary']);
    const pub = pick(it, ['pubDate', 'published', 'updated', 'date']);
    const guid = pick(it, ['guid.#text', 'guid']) || link || `${sourceTitle}-${idx}`;
    const image = pick(it, ['enclosure.url', 'media:content.url', 'image']) || undefined;

    return {
      id: String(guid),
      title: String(title),
      link: String(link),
      summary: summary ? String(summary) : undefined,
      publishedAt: pub ? new Date(pub).toISOString() : undefined,
      source: sourceTitle,
      image
    };
  });

  return items;
}

export async function fetchFeed(url, ttlSeconds = 180) {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && now - hit.ts < ttlSeconds * 1000) return hit.data;
  const xml = await fetchText(url);
  const parsed = parser.parse(xml);
  const items = normaliseOne(url, parsed);
  const data = { items };
  cache.set(url, { ts: now, ttl: ttlSeconds, data });
  return data;
}

export async function fetchAllFeeds(urls, ttlSeconds = 180) {
  const results = await Promise.allSettled(urls.map(u => fetchFeed(u, ttlSeconds)));
  const items = [];
  const errors = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const u = urls[i];
    if (r.status === 'fulfilled') items.push(...r.value.items);
    else errors.push(`${u}: ${r.reason}`);
  }
  // newest first
  items.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return { items, errors };
}
