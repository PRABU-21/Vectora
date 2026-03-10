export const getNews = async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(
      "https://api.mediastack.com/v1/news?access_key=4dee8df0aff4da8c5fe96a8089b84f84&categories=technology&languages=en&limit=30",
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch news");
    }

    res.json(data);
  } catch (error) {
    console.warn("News API unavailable (using fallback):", error.message);
    // Return mock data fallback so UI doesn't break
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
