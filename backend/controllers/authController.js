import jwt from "jsonwebtoken";
import User from "../models/User.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      city,
      state,
      country,
      primaryJobRole,
      totalExperience,
      highestEducation,
      currentStatus,
      primarySkills,
      preferredJobRoles,
      preferredLocations,
      employmentType,
    } = req.body;

    // Normalize email for consistent lookups
    const normalizedEmail = (email || "").toLowerCase();

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phoneNumber,
      location: {
        city,
        state,
        country,
      },
      primaryJobRole,
      totalExperience,
      highestEducation,
      currentStatus,
      primarySkills,
      preferredJobRoles,
      preferredLocations,
      employmentType,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        primaryJobRole: user.primaryJobRole,
        totalExperience: user.totalExperience,
        highestEducation: user.highestEducation,
        currentStatus: user.currentStatus,
        primarySkills: user.primarySkills,
        preferredJobRoles: user.preferredJobRoles,
        preferredLocations: user.preferredLocations,
        employmentType: user.employmentType,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = (email || "").toLowerCase();

    // Check for user email
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      location: user.location,
      primaryJobRole: user.primaryJobRole,
      totalExperience: user.totalExperience,
      highestEducation: user.highestEducation,
      currentStatus: user.currentStatus,
      primarySkills: user.primarySkills,
      preferredJobRoles: user.preferredJobRoles,
      preferredLocations: user.preferredLocations,
      employmentType: user.employmentType,
      resume: user.resume,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload resume
// @route   POST /api/auth/upload-resume
// @access  Private
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old resume if exists
    if (user.resume) {
      const oldPath = path.join(__dirname, "..", user.resume);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new resume path
    user.resume = `uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      message: "Resume uploaded successfully",
      resume: user.resume,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    GitHub OAuth Login - Initiate OAuth flow
// @route   GET /api/auth/github
// @access  Public
export const githubLogin = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  const scope = "user:email";

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  res.json({ authUrl });
};

// @desc    GitHub OAuth Callback - Handle OAuth response
// @route   GET /api/auth/github/callback
// @access  Public
export const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: "No authorization code provided" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ message: "Failed to get access token" });
    }

    // Get user profile from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    const githubUser = await userResponse.json();

    // Get user email
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    const emails = await emailResponse.json();
    const primaryEmail = emails.find((e) => e.primary)?.email || emails[0]?.email;

    // Fetch commits, PRs, issues, reviews using GitHub GraphQL
    let githubStats = {
      commits: 0,
      prs: 0,
      issues: 0,
      reviews: 0,
    };

    try {
      // Get date one year ago for contributions collection
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - 365 * 24 * 60 * 60 * 1000);

      const graphqlQuery = {
        query: `query { 
          user(login: "${githubUser.login}") { 
            contributionsCollection(from: "${fromDate.toISOString()}", to: "${toDate.toISOString()}") { 
              totalCommitContributions 
              totalPullRequestContributions 
              totalIssueContributions 
              totalPullRequestReviewContributions 
            } 
          } 
        }`
      };

      console.log("Sending GraphQL Query for user:", githubUser.login);

      const graphqlResponse = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Vectora-App",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify(graphqlQuery),
      });

      const graphqlData = await graphqlResponse.json();
      console.log("GraphQL Response Status:", graphqlResponse.status);
      console.log("GraphQL Response Data:", JSON.stringify(graphqlData, null, 2));

      if (graphqlData.errors) {
        console.error("GraphQL Errors:", graphqlData.errors);
        // Try alternative query without date restrictions
        console.log("Trying alternative GraphQL query...");

        const altQuery = {
          query: `query { 
            user(login: "${githubUser.login}") { 
              contributionsCollection { 
                totalCommitContributions 
                totalPullRequestContributions 
                totalIssueContributions 
                totalPullRequestReviewContributions 
              } 
            } 
          }`
        };

        const altResponse = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Vectora-App",
            Authorization: `Bearer ${tokenData.access_token}`,
          },
          body: JSON.stringify(altQuery),
        });

        const altData = await altResponse.json();
        console.log("Alternative GraphQL Response:", JSON.stringify(altData, null, 2));

        if (altData.data?.user?.contributionsCollection) {
          const contrib = altData.data.user.contributionsCollection;
          githubStats = {
            commits: contrib.totalCommitContributions || 0,
            prs: contrib.totalPullRequestContributions || 0,
            issues: contrib.totalIssueContributions || 0,
            reviews: contrib.totalPullRequestReviewContributions || 0,
          };
          console.log("GitHub Stats Fetched Successfully (alt):", githubStats);
        }
      } else if (graphqlData.data?.user?.contributionsCollection) {
        const contrib = graphqlData.data.user.contributionsCollection;
        githubStats = {
          commits: contrib.totalCommitContributions || 0,
          prs: contrib.totalPullRequestContributions || 0,
          issues: contrib.totalIssueContributions || 0,
          reviews: contrib.totalPullRequestReviewContributions || 0,
        };
        console.log("GitHub Stats Fetched Successfully:", githubStats);
      } else {
        console.log("No contributions data found in GraphQL response");
      }
    } catch (graphqlErr) {
      console.error("Error fetching GitHub stats:", graphqlErr);
    }

    // Fetch repositories data
    let repos = [];
    let languages = {};
    let totalStars = 0;
    let totalForks = 0;

    try {
      const reposResponse = await fetch(
        "https://api.github.com/user/repos?sort=stars&per_page=100",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/json",
          },
        }
      );

      repos = await reposResponse.json();

      // Calculate stats from repos
      if (Array.isArray(repos)) {
        repos.forEach((repo) => {
          totalStars += repo.stargazers_count || 0;
          totalForks += repo.forks_count || 0;

          // Aggregate languages
          if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
          }
        });
      }
    } catch (reposErr) {
      console.log("Could not fetch repositories:", reposErr);
    }

    // Prepare GitHub profile data
    const githubProfile = {
      name: githubUser.name || githubUser.login,
      login: githubUser.login,
      bio: githubUser.bio || "",
      avatar_url: githubUser.avatar_url,
      location: githubUser.location || "",
      company: githubUser.company || "",
      blog: githubUser.blog || "",
      public_repos: githubUser.public_repos || 0,
      followers: githubUser.followers || 0,
      following: githubUser.following || 0,
      created_at: githubUser.created_at,
      updated_at: githubUser.updated_at,
    };

    // Prepare repositories data with top repos
    const topRepos = Array.isArray(repos)
      ? repos.slice(0, 12).map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language: repo.language || "Unknown",
        description: repo.description || "",
      }))
      : [];

    const githubRepositories = {
      totalRepos: Array.isArray(repos) ? repos.length : 0,
      totalStars,
      totalForks,
      topRepos,
      languages,
    };

    // Check if user exists in our database
    let user = await User.findOne({ email: primaryEmail });

    if (!user) {
      // Create new user with GitHub data
      user = await User.create({
        name: githubUser.name || githubUser.login,
        email: primaryEmail,
        password: "github-oauth", // Dummy password for GitHub users
        githubId: githubUser.id,
        githubUsername: githubUser.login,
        githubProfileUrl: githubUser.html_url,
        githubAccessToken: tokenData.access_token,
        githubProfile,
        githubStats,
        githubRepositories,
        lastGithubSync: new Date(),
      });
    } else {
      // Update existing user with GitHub data
      user.githubId = githubUser.id;
      user.githubUsername = githubUser.login;
      user.githubProfileUrl = githubUser.html_url;
      user.githubAccessToken = tokenData.access_token;
      user.githubProfile = githubProfile;
      user.githubStats = githubStats;
      user.githubRepositories = githubRepositories;
      user.lastGithubSync = new Date();
      await user.save();
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id);

    // Log stats before redirect
    console.log("Stats being redirected:", {
      commits: githubStats.commits,
      prs: githubStats.prs,
      issues: githubStats.issues,
      reviews: githubStats.reviews
    });

    // Redirect to frontend with token and github stats
    const redirectUrl = `${process.env.FRONTEND_URL}/gitpluse?token=${jwtToken}&githubUsername=${user.githubUsername}&commits=${githubStats.commits}&prs=${githubStats.prs}&issues=${githubStats.issues}&reviews=${githubStats.reviews}`;
    console.log("Redirect URL:", redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("GitHub OAuth Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/gitpluse?error=${encodeURIComponent(error.message)}`);
  }
};

// Helper function to fetch contribution calendar data
const fetchContributionCalendar = async (accessToken, username) => {
  try {
    const query = {
      query: `query {
        user(login: "${username}") {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        }
      }`
    };

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vectora-App",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(query),
    });

    const data = await response.json();

    if (data.data?.user?.contributionsCollection?.contributionCalendar) {
      return data.data.user.contributionsCollection.contributionCalendar;
    }
    return null;
  } catch (error) {
    console.error("Error fetching contribution calendar:", error);
    return null;
  }
};

// Helper function to fetch commit contributions by repository
const fetchCommitsByRepository = async (accessToken, username) => {
  try {
    console.log(`Starting commits by repository fetch for user: ${username}`);

    // First, get list of user repositories
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100&type=owner",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!reposResponse.ok) {
      console.error(`Failed to fetch repos: ${reposResponse.status} ${reposResponse.statusText}`);
      return { commitsCount: [], allCommitDates: [] };
    }

    const repos = await reposResponse.json();
    console.log(`Found ${repos.length} repositories`);

    // Get commit counts for each repository
    const commitsCount = [];
    let allCommitDates = [];

    for (const repo of repos.slice(0, 30)) {
      try {
        // Get commits count using GraphQL for better performance
        const graphqlQuery = {
          query: `query {
            repository(owner: "${username}", name: "${repo.name}") {
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 1) {
                      totalCount
                    }
                  }
                }
              }
            }
          }`
        };

        const graphqlResponse = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "Vectora-App",
          },
          body: JSON.stringify(graphqlQuery),
        });

        const graphqlData = await graphqlResponse.json();

        if (graphqlData.errors) {
          console.warn(`GraphQL error for repo ${repo.name}:`, graphqlData.errors[0]?.message);
          // Skip this repo if there's an error
          continue;
        }

        const totalCount = graphqlData.data?.repository?.defaultBranchRef?.target?.history?.totalCount || 0;

        if (totalCount > 0) {
          commitsCount.push({
            name: repo.name,
            count: totalCount,
          });
          console.log(`  ${repo.name}: ${totalCount} commits`);
        }

        // Also fetch recent commits for dates (from REST API - faster and more reliable)
        try {
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=100`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (commitsResponse.ok) {
            const commits = await commitsResponse.json();
            const dates = commits
              .filter(c => c.commit && c.commit.author && c.commit.author.date)
              .map(c => c.commit.author.date);
            allCommitDates = allCommitDates.concat(dates);
          }
        } catch (commitError) {
          console.warn(`Could not fetch commit dates for ${repo.name}:`, commitError.message);
        }
      } catch (repoError) {
        console.warn(`Error processing repo ${repo.name}:`, repoError.message);
        continue;
      }
    }

    // Sort by commit count descending
    commitsCount.sort((a, b) => b.count - a.count);

    console.log(`Successfully fetched commits for ${commitsCount.length} repositories`);
    console.log(`Total commit dates collected: ${allCommitDates.length}`);

    return { commitsCount, allCommitDates };
  } catch (error) {
    console.error("Error fetching commits by repository:", error.message);
    return { commitsCount: [], allCommitDates: [] };
  }
};

// Helper function to calculate contribution streaks
const calculateStreaks = (weeks) => {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Get all contribution days and reverse to check from recent to past
  const allDays = [];
  weeks.forEach(week => {
    week.contributionDays.forEach(day => {
      allDays.push(day);
    });
  });

  // Process days in reverse (most recent first)
  for (let i = allDays.length - 1; i >= 0; i--) {
    const day = allDays[i];
    if (day.contributionCount > 0) {
      currentStreak++;
    } else if (currentStreak > 0) {
      break; // Stop counting when we hit a day with no contributions
    }
  }

  // Calculate longest streak by scanning through all days
  allDays.forEach(day => {
    if (day.contributionCount > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });

  return { currentStreak, longestStreak };
};

// Helper function to calculate momentum (last 7 days vs previous 7 days)
const calculateMomentum = (weeks) => {
  // Flatten all days
  const allDays = [];
  weeks.forEach(week => {
    week.contributionDays.forEach(day => {
      allDays.push(day);
    });
  });

  // Ensure we have enough data
  if (allDays.length < 14) return 0;

  // Get last 7 days (current week)
  const last7Days = allDays.slice(-7);
  // Get previous 7 days (previous week)
  const prev7Days = allDays.slice(-14, -7);

  const currentTotal = last7Days.reduce((sum, day) => sum + day.contributionCount, 0);
  const prevTotal = prev7Days.reduce((sum, day) => sum + day.contributionCount, 0);

  let momentum = 0;
  if (prevTotal === 0) {
    momentum = currentTotal > 0 ? 100 : 0;
  } else {
    momentum = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
  }

  return momentum;
};

// Helper to calculate productivity patterns
const calculateProductivity = (commitDates) => {
  const hours = new Array(24).fill(0);
  const days = new Array(7).fill(0);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  commitDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const hour = date.getHours();
    const day = date.getDay();

    hours[hour]++;
    days[day]++;
  });

  // Find Peak Hour
  let maxHour = 0;
  let peakHour = 0;
  hours.forEach((count, idx) => {
    if (count > maxHour) {
      maxHour = count;
      peakHour = idx;
    }
  });

  // Find Peak Day
  let maxDay = 0;
  let peakDay = 0;
  days.forEach((count, idx) => {
    if (count > maxDay) {
      maxDay = count;
      peakDay = idx;
    }
  });

  // Format formatted hour (e.g., "4 AM")
  const formatHour = (h) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return {
    peakHour: formatHour(peakHour),
    peakDay: dayNames[peakDay],
    hourlyActivity: hours.map((count, hour) => ({ hour: formatHour(hour), count, fullHour: hour })),
    dailyActivity: days.map((count, day) => ({ day: dayNames[day], count }))
  };
};


// Helper function to fetch historical activity (Issues, PRs, Reviews)
const fetchActivityHistory = async (accessToken, username) => {
  try {
    const query = {
      query: `query {
        user(login: "${username}") {
          issues(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              createdAt
            }
          }
          pullRequests(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              createdAt
            }
          }
          contributionsCollection {
            pullRequestReviewContributions(first: 100, orderBy: {direction: DESC}) {
              nodes {
                occurredAt
              }
            }
          }
        }
      }`
    };

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(query),
    });

    const data = await response.json();
    return {
      issues: data.data?.user?.issues?.nodes?.map(n => n.createdAt) || [],
      prs: data.data?.user?.pullRequests?.nodes?.map(n => n.createdAt) || [],
      reviews: data.data?.user?.contributionsCollection?.pullRequestReviewContributions?.nodes?.map(n => n.occurredAt) || []
    };
  } catch (error) {
    console.error("Error fetching activity history:", error);
    return { issues: [], prs: [], reviews: [] };
  }
};

// Helper function to calculate 53-week activity timeline
const calculateActivityTimeline = (commits, issues, prs, reviews) => {
  const weeks = [];
  const now = new Date();

  // Generate last 53 weeks
  for (let i = 52; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i * 7));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    weeks.push({
      name: label,
      commits: 0,
      issues: 0,
      prs: 0,
      reviews: 0,
      timestamp: d.getTime() // Start of that week
    });
  }

  const addToWeek = (dateStr, type) => {
    const date = new Date(dateStr).getTime();
    // Find the week this date belongs to
    // We look for the week where date >= weekStart and date < nextWeekStart
    // Simple approximation: find the closest week start that is <= date

    // Iterate to find the correct bucket
    for (let i = 0; i < weeks.length; i++) {
      const weekStart = weeks[i].timestamp;
      const nextWeekStart = i < weeks.length - 1 ? weeks[i + 1].timestamp : weekStart + (7 * 24 * 60 * 60 * 1000);

      if (date >= weekStart && date < nextWeekStart) {
        weeks[i][type]++;
        break;
      }
    }
  };

  commits.forEach(d => addToWeek(d, 'commits'));
  issues.forEach(d => addToWeek(d, 'issues'));
  prs.forEach(d => addToWeek(d, 'prs'));
  reviews.forEach(d => addToWeek(d, 'reviews'));

  // Clean up timestamp before returning
  return weeks.map(({ timestamp, ...rest }) => rest);
};

// @desc    Get GitHub Data for authenticated user
// @route   GET /api/auth/github-data
// @access  Private
export const getGithubData = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("+githubAccessToken");

    if (!user || !user.githubId) {
      return res.status(404).json({ message: "GitHub data not found" });
    }

    // Fetch fresh contribution calendar data if needed
    let contributionCalendar = null;
    let commitContributionsByRepository = [];
    let streaks = { currentStreak: 0, longestStreak: 0 };
    let momentum = 0;
    let productivity = {
      peakHour: "N/A",
      peakDay: "N/A",
      hourlyActivity: [],
      dailyActivity: []
    };
    let activityTimeline = [];

    if (user.githubAccessToken) {
      // Fetch contribution calendar
      contributionCalendar = await fetchContributionCalendar(
        user.githubAccessToken,
        user.githubUsername
      );

      // Calculate streaks from contribution calendar
      if (contributionCalendar?.weeks) {
        streaks = calculateStreaks(contributionCalendar.weeks);
        momentum = calculateMomentum(contributionCalendar.weeks);
      }

      // Fetch commits by repository (and dates for productivity)
      const commitData = await fetchCommitsByRepository(
        user.githubAccessToken,
        user.githubUsername
      );

      commitContributionsByRepository = commitData.commitsCount;

      // Calculate productivity patterns
      if (commitData.allCommitDates && commitData.allCommitDates.length > 0) {
        productivity = calculateProductivity(commitData.allCommitDates);
      }

      // Fetch other activity history and calculate timeline
      const otherActivity = await fetchActivityHistory(user.githubAccessToken, user.githubUsername);
      activityTimeline = calculateActivityTimeline(
        commitData.allCommitDates || [],
        otherActivity.issues,
        otherActivity.prs,
        otherActivity.reviews
      );

      // Fetch recent activity events
      const recentActivity = await fetchRecentActivity(user.githubAccessToken, user.githubUsername);

      res.json({
        profile: user.githubProfile,
        stats: user.githubStats,
        repositories: user.githubRepositories,
        contributionCalendar,
        commitContributionsByRepository,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        momentum,
        productivity,
        activityTimeline,
        recentActivity,
        lastSync: user.lastGithubSync,
      });
    } else {
      res.status(404).json({ message: "No GitHub data found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to fetch recent activity events
const fetchRecentActivity = async (accessToken, username) => {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/events?per_page=20`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch events:", response.status);
      return [];
    }

    const events = await response.json();

    return events.map(event => {
      let action = "";
      let title = "";
      let iconType = "default";

      switch (event.type) {
        case "PushEvent":
          action = "pushed to";
          title = event.payload.commits?.[0]?.message || "Pushed commits";
          iconType = "commit";
          break;
        case "PullRequestEvent":
          action = `opened pull request`;
          title = event.payload.pull_request?.title || "Pull Request";
          iconType = "pr";
          break;
        case "IssuesEvent":
          action = `opened issue`;
          title = event.payload.issue?.title || "Issue";
          iconType = "issue";
          break;
        case "CreateEvent":
          action = `created ${event.payload.ref_type}`;
          title = event.payload.ref || event.repo.name;
          iconType = "create";
          break;
        case "WatchEvent":
          action = "starred";
          title = event.repo.name;
          iconType = "star";
          break;
        default:
          action = "acted on";
          title = event.type;
      }

      return {
        id: event.id,
        type: event.type,
        repo: event.repo.name,
        date: event.created_at,
        action,
        title,
        iconType
      };
    }).slice(0, 10); // Return top 10

  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
};