import "dotenv/config";
import mongoose from "mongoose";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import Application from "../models/Application.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

// Scoring weights (same as in jobController)
const WEIGHTS = {
  experience: 0.4,
  skills: 0.2,
  projects: 0.2,
  semantic: 0.2,
};

function normalizeStringList(arr) {
  return arr.map((s) => s.toLowerCase().trim());
}

function computeSkillMatch(requiredSkills, candidateSkills) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { matchedSkills: [], missingSkills: [], score: 0.5 };
  }

  const candidateSet = new Set(candidateSkills);
  const matchedSkills = requiredSkills.filter((s) => candidateSet.has(s));
  const missingSkills = requiredSkills.filter((s) => !candidateSet.has(s));
  const score = matchedSkills.length / requiredSkills.length;

  return { matchedSkills, missingSkills, score };
}

function computeExperienceScore(candidateExperience, minExperience = 0) {
  if (candidateExperience === undefined || candidateExperience === null) return 0.5;
  if (!minExperience || minExperience === 0) return 0.5;

  // Perfect match: meets or exceeds minimum
  if (candidateExperience >= minExperience) return 1;
  
  // Close match: within 1 year below minimum
  if (candidateExperience >= minExperience - 1) return 0.7;
  
  // Partial match: below minimum
  return 0.3;
}

function computeProjectRelevance(jdText, resumeText) {
  if (!jdText || !resumeText) return 0.5;

  const jdLower = jdText.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  const projectKeywords = [
    "built",
    "developed",
    "created",
    "implemented",
    "designed",
    "architected",
    "led",
    "managed",
    "deployed",
    "optimized",
    "migrated",
    "project",
    "application",
    "system",
    "platform",
    "service",
  ];

  let matchCount = 0;
  for (const kw of projectKeywords) {
    if (jdLower.includes(kw) && resumeLower.includes(kw)) {
      matchCount++;
    }
  }

  const maxMatch = projectKeywords.length;
  return Math.min(matchCount / maxMatch, 1.0);
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing applications
    await Application.deleteMany({});
    console.log("Cleared existing applications");

    // Get all jobs and candidates
    const jobs = await Job.find({}).lean();
    const candidates = await Candidate.find({}).lean();

    if (jobs.length === 0) {
      console.log("No jobs found. Please create jobs first.");
      await mongoose.disconnect();
      return;
    }

    if (candidates.length === 0) {
      console.log("No candidates found. Please run seedCandidates.js first.");
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${jobs.length} jobs and ${candidates.length} candidates`);

    let totalApplications = 0;

    // For each job, create applications from random candidates
    for (const job of jobs) {
      // Randomly select 15-30 candidates to apply for this job
      const numApplicants = 15 + Math.floor(Math.random() * 16);
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const applicants = shuffled.slice(0, Math.min(numApplicants, candidates.length));

      console.log(`\nProcessing job: ${job.title} (${applicants.length} applicants)`);

      const applications = [];

      for (const candidate of applicants) {
        // Score the candidate
        const normalizedJobSkills = normalizeStringList(job.skills || []);
        const candidateSkills = normalizeStringList(candidate.skills || []);
        const skillMatch = computeSkillMatch(normalizedJobSkills, candidateSkills);
        const expScore = computeExperienceScore(candidate.yearsExperience, job.minExperience);

        // Semantic similarity
        let similarity = 0;
        try {
          if (job.embedding && candidate.embedding && job.embedding.length > 0 && candidate.embedding.length > 0) {
            similarity = cosineSimilarity(job.embedding, candidate.embedding, true);
            if (similarity > 0.6) {
              console.log(`  High similarity match: ${candidate.name} - ${(similarity * 100).toFixed(1)}%`);
            }
          } else {
            console.log(`  Missing embeddings for ${candidate.name}`);
          }
        } catch (err) {
          console.error(`  Error calculating similarity for ${candidate.name}:`, err.message);
          similarity = 0;
        }

        const projectScore = computeProjectRelevance(job.description, candidate.resumeText);

        const breakdown = {
          experience: Number((expScore * WEIGHTS.experience).toFixed(4)),
          skills: Number((skillMatch.score * WEIGHTS.skills).toFixed(4)),
          projects: Number((projectScore * WEIGHTS.projects).toFixed(4)),
          semantic: Number((similarity * WEIGHTS.semantic).toFixed(4)),
        };

        const totalScore =
          breakdown.experience +
          breakdown.skills +
          breakdown.projects +
          breakdown.semantic;

        applications.push({
          job: job._id,
          candidate: candidate._id,
          score: Number(totalScore.toFixed(4)),
          breakdown,
          matchedSkills: skillMatch.matchedSkills,
          missingSkills: skillMatch.missingSkills,
          skillMatch: Number(skillMatch.score.toFixed(4)),
          experienceScore: Number(expScore.toFixed(4)),
          projectScore: Number(projectScore.toFixed(4)),
          similarity: Number(similarity.toFixed(4)),
          status: "pending",
          appliedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
        });
      }

      // Insert applications for this job
      await Application.insertMany(applications);
      totalApplications += applications.length;

      const avgScore = (applications.reduce((sum, app) => sum + app.score, 0) / applications.length).toFixed(4);
      console.log(`Created ${applications.length} applications (avg score: ${avgScore})`);
    }

    console.log(`\n✅ Successfully created ${totalApplications} total applications`);
    await mongoose.disconnect();
    console.log("Done");
  } catch (error) {
    console.error("Error seeding applications:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
