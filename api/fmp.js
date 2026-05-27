export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  const { path } = req.query;
  if (!path) { res.status(400).json({ error: "missing path" }); return; }
  const FMP_KEY = "s0BLKiROWmOfW3hanrhkAkIKKNl5Wo7L";
  const isV4 = path.startsWith("v4/");
  const cleanPath = path.replace(/^v4\//, "").replace(/[&?]+$/, "");
  const base = isV4 ? "https://financialmodelingprep.com/api/v4" : "https://financialmodelingprep.com/api/v3";
  const sep = cleanPath.includes("?") ? "&" : "?";
  const url = `${base}/${cleanPath}${sep}apikey=${FMP_KEY}`;
  try {
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) { res.status(r.status).json({ error: `FMP error ${r.status}` }); return; }
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
