import { useState } from "react";
import { getLeetCodeProfile } from "../data/api";

// Lightweight widget to fetch and display LeetCode profile stats.
export default function LeetCodeProfile() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter a LeetCode username");
      setProfile(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await getLeetCodeProfile(trimmed);

      if (!res?.success) {
        setProfile(null);
        setError(res?.message || "Unable to fetch LeetCode data right now");
        return;
      }

      setProfile(res);
    } catch (err) {
      setProfile(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "User not found or API error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "640px" }}>
      <h2>LeetCode Profile Analyzer</h2>

      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <input
          type="text"
          placeholder="Enter LeetCode username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <button onClick={fetchProfile} disabled={loading}>
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {profile && profile.success && (
        <div style={{ marginTop: "16px" }}>
          <h3>{profile.username}</h3>
          <p>Ranking: {profile.ranking ?? "-"}</p>
          <p>Reputation: {profile.reputation ?? "-"}</p>
          <p>Star Rating: {profile.starRating ?? "-"}</p>
          <p>
            Solved / Total: {profile.overall?.solvedCount ?? 0} / {profile.overall?.totalCount ?? 0}
          </p>

          <h4 style={{ marginTop: "12px" }}>Problems Solved</h4>
          <ul>
            {(profile.solvedStats || []).map((item) => (
              <li key={item.difficulty}>
                {item.difficulty}: {item.count}
              </li>
            ))}
          </ul>

          {profile.topics?.length > 0 && (
            <>
              <h4 style={{ marginTop: "12px" }}>Most Solved Topics</h4>
              <ul>
                {profile.topics
                  .slice()
                  .sort((a, b) => (b.solved || 0) - (a.solved || 0))
                  .slice(0, 5)
                  .map((topic) => (
                    <li key={topic.name}>
                      {topic.name} – {topic.solved}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
