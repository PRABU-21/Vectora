export const getNews = async (req, res) => {
  try {
    const response = await fetch(
      "https://api.mediastack.com/v1/news?access_key=4dee8df0aff4da8c5fe96a8089b84f84&categories=technology&languages=en&limit=30"
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || "Failed to fetch news",
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news from external API" });
  }
};
