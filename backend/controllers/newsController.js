// Simple in-memory cache to smooth over transient API errors/rate limits.
let cachedNews = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getNews = async (req, res) => {
  const now = Date.now();
  const isCacheFresh = cachedNews && now - cachedAt < CACHE_TTL_MS;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const accessKey = process.env.NEWS_API_KEY;
    if (!accessKey) {
      throw new Error("NEWS_API_KEY not configured");
    }

    const url = new URL("https://api.mediastack.com/v1/news");
    url.searchParams.set("access_key", accessKey);
    url.searchParams.set("categories", "technology");
    url.searchParams.set("languages", "en");
    url.searchParams.set("limit", "30");

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || "Failed to fetch news");
    }

    if (!data?.data?.length) {
      throw new Error("News API returned empty payload");
    }

    // Cache success and return
    cachedNews = data;
    cachedAt = now;
    return res.json(data);
  } catch (error) {
    console.warn("News API unavailable (using fallback):", error.message);

    // Serve cached news if we have fresh data; otherwise serve static fallback
    if (isCacheFresh) {
      return res.json(cachedNews);
    }

    res.json({
      data: [
        {
          title: "Tech News Unavailable",
          description: "Unable to load latest news at the moment. Please try again later.",
          url: "#",
          image: null,
          source: "System",
          published_at: new Date().toISOString()
        }
      ]
    });
  }
};
