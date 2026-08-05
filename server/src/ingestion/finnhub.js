const BASE_URL = "https://finnhub.io/api/v1";

async function finnhubGet(pathname, params) {
  const url = new URL(BASE_URL + pathname);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("token", process.env.FINNHUB_API_KEY);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub ${pathname} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Company news for a symbol between two YYYY-MM-DD dates.
export function getCompanyNews(symbol, from, to) {
  return finnhubGet("/company-news", { symbol, from, to });
}

// Real-time quote for a symbol: { c: current, d: change, dp: percent change, h, l, o, pc, t }.
export function getQuote(symbol) {
  return finnhubGet("/quote", { symbol });
}
