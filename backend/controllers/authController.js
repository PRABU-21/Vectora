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
    res.redirect(`${process.env.FRONTEND_URL}/gitpluse?error=${encodeURIComponent(error.message)}`);  }
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

    res.json({
      profile: user.githubProfile,
      stats: user.githubStats,
      repositories: user.githubRepositories,
      lastSync: user.lastGithubSync,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};