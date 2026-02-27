import express from "express";
import axios from "axios";

const router = express.Router();

const profileQuery = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
        starRating
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      languageProblemCount {
        languageName
        problemsSolved
      }
      tagProblemCounts {
        advanced {
          tagName
          problemsSolved
        }
        intermediate {
          tagName
          problemsSolved
        }
        fundamental {
          tagName
          problemsSolved
        }
      }
      userCalendar {
        submissionCalendar
        activeYears
        streak
      }
    }
  }
`;

const calculateStreaks = (calendarString) => {
  if (!calendarString) return { maxStreak: 0, currentStreak: 0 };

  let parsed;
  try {
    parsed = JSON.parse(calendarString);
  } catch (err) {
    return { maxStreak: 0, currentStreak: 0 };
  }

  const days = Object.keys(parsed)
    .map((ts) => parseInt(ts, 10) * 1000)
    .filter((ts) => Number.isFinite(ts))
    .sort((a, b) => a - b);

  let maxStreak = 0;
  let currentStreak = 0;
  let prevDay = null;

  for (const day of days) {
    if (prevDay === null) {
      currentStreak = 1;
    } else {
      const diffDays = (day - prevDay) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    maxStreak = Math.max(maxStreak, currentStreak);
    prevDay = day;
  }

  return { maxStreak, currentStreak };
};

router.get("/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const { data } = await axios.post(
      "https://leetcode.com/graphql",
      { query: profileQuery, variables: { username } },
      {
        headers: {
          "Content-Type": "application/json",
          Referer: "https://leetcode.com",
        },
      },
    );

    const user = data?.data?.matchedUser;
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const solvedStats = user?.submitStats?.acSubmissionNum || [];
    const solvedCount = solvedStats.reduce(
      (sum, item) => sum + (Number(item?.count) || 0),
      0,
    );

    const topics = [
      ...(user?.tagProblemCounts?.advanced || []),
      ...(user?.tagProblemCounts?.intermediate || []),
      ...(user?.tagProblemCounts?.fundamental || []),
    ]
      .filter(Boolean)
      .map((t) => ({ name: t.tagName, solved: t.problemsSolved }));

    const calendar = user?.userCalendar;
    const streaks = calendar?.submissionCalendar
      ? calculateStreaks(calendar.submissionCalendar)
      : { maxStreak: 0, currentStreak: 0 };

    return res.json({
      success: true,
      username: user.username,
      ranking: user.profile?.ranking,
      reputation: user.profile?.reputation,
      starRating: user.profile?.starRating,
      overall: {
        solvedCount,
        totalCount: solvedCount, // LeetCode query does not return total; mirror solved count
      },
      solvedStats,
      topics,
      languages: user.languageProblemCount || [],
      activity: {
        currentStreak: streaks.currentStreak,
        maxStreak: streaks.maxStreak,
        activeYears: calendar?.activeYears || [],
        submissionCalendar: calendar?.submissionCalendar || null,
        rawStreak: calendar?.streak ?? null,
      },
      raw: user,
    });
  } catch (err) {
    console.error("LeetCode fetch failed", err?.response?.status, err?.message);
    return res
      .status(502)
      .json({ success: false, message: "Failed to fetch from LeetCode" });
  }
});

export default router;
