import "dotenv/config";
import mongoose from "mongoose";
import { pipeline } from "@xenova/transformers";
import Recruiter from "../models/Recruiter.js";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { sampleResumes } from "./sampleResumes.js";
import { sampleJobs } from "./sampleJobs.js";
import { extractSection } from "../utils/resumeText.js";
import { extractYearsExperienceDetailed } from "../utils/experience.js";
import { normalizeStringList, scoreCandidateForJob } from "../utils/scoring.js";

// Cache the embedding model
let embeddingModel = null;

async function loadEmbeddingModel() {
  if (!embeddingModel) {
    console.log("Loading embedding model...");
    embeddingModel = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("Embedding model loaded successfully");
  }
  return embeddingModel;
}

async function generateEmbedding(text) {
  const model = await loadEmbeddingModel();
  const result = await model(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(result.data);
}

async function embedOptional(model, text) {
  const src = String(text || "").trim();
  if (!src) return [];
  const result = await model(src, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

async function seedRecruiters() {
  console.log("\n--- Seeding Recruiters ---");
  
  const recruiters = [
    {
      name: "Alice Cooper",
      email: "alice.cooper@techgiant.com",
      password: "recruiter123",
      company: "TechGiant Corp",
    },
    {
      name: "Bob Smith",
      email: "bob.smith@startuphub.com",
      password: "recruiter123",
      company: "StartupHub",
    },
    {
      name: "Carol Johnson",
      email: "carol.johnson@datatech.com",
      password: "recruiter123",
      company: "DataTech Solutions",
    },
    {
      name: "David Brown",
      email: "david.brown@cloudscale.com",
      password: "recruiter123",
      company: "CloudScale Inc",
    },
    {
      name: "Eve Martinez",
      email: "eve.martinez@ailab.com",
      password: "recruiter123",
      company: "AI Innovations Lab",
    },
  ];

  const createdRecruiters = [];
  for (const recruiterData of recruiters) {
    const existing = await Recruiter.findOne({ email: recruiterData.email });
    if (existing) {
      console.log(`Recruiter ${recruiterData.email} already exists`);
      createdRecruiters.push(existing);
    } else {
      const recruiter = await Recruiter.create(recruiterData);
      console.log(`Created recruiter: ${recruiter.name} (${recruiter.email})`);
      createdRecruiters.push(recruiter);
    }
  }

  return createdRecruiters;
}

async function seedCandidates() {
  console.log("\n--- Seeding Candidates ---");
  
  const createdCandidates = [];
  const model = await loadEmbeddingModel();
  
  for (const resumeData of sampleResumes) {
    const existing = await Candidate.findOne({ email: resumeData.email });
    if (existing) {
      console.log(`Candidate ${resumeData.email} already exists`);
      createdCandidates.push(existing);
      continue;
    }

    console.log(`Creating candidate: ${resumeData.name}...`);

    const resumeText = String(resumeData.resumeText || "");

    // Extract skills/experience/education (non-LLM, deterministic)
    const skills = extractSkills(resumeText);
    const exp = extractYearsExperienceDetailed(resumeText);
    const yearsExperience = exp.years;
    const education = extractEducation(resumeText);

    // Generate embeddings (overall + facet embeddings for semantic breakdown)
    const skillsText = Array.isArray(skills) && skills.length ? skills.join(" ") : "";
    const projectsText = extractSection(resumeText, ["projects"]);
    const experienceText = `${yearsExperience || 0} years experience`;

    const [embedding, skillsEmbedding, projectsEmbedding, experienceEmbedding] = await Promise.all([
      embedOptional(model, resumeText),
      embedOptional(model, skillsText),
      embedOptional(model, projectsText),
      embedOptional(model, experienceText),
    ]);

    const candidate = await Candidate.create({
      name: resumeData.name,
      email: resumeData.email,
      password: resumeData.password,
      phone: resumeData.phone,
      location: resumeData.location,
      resumeText,
      embedding,
      skillsEmbedding,
      projectsEmbedding,
      experienceEmbedding,
      skills,
      yearsExperience,
      yearsExperienceConfidence: exp.confidence,
      yearsExperienceSource: exp.method,
      education,
      resumeParsed: true,
      originalFile: "seeded-resume.txt",
    });

    console.log(`Created candidate: ${candidate.name} (${candidate.email})`);
    console.log(`  - Skills: ${skills.slice(0, 5).join(", ")}${skills.length > 5 ? "..." : ""}`);
    console.log(`  - Experience: ${yearsExperience} years`);
    
    createdCandidates.push(candidate);
  }

  return createdCandidates;
}

async function seedJobs(recruiters) {
  console.log("\n--- Seeding Jobs ---");
  
  const createdJobs = [];
  const model = await loadEmbeddingModel();
  
  for (let i = 0; i < sampleJobs.length; i++) {
    const jobData = sampleJobs[i];
    const recruiter = recruiters[i % recruiters.length]; // Distribute jobs among recruiters

    console.log(`Creating job: ${jobData.title}...`);

    const normalizedSkills = normalizeStringList(jobData.skills || []);
    const skillsText = normalizedSkills.length ? normalizedSkills.join(" ") : "";
    const experienceText = `${parseInt(jobData.minExperience) || 0} years experience required`;

    const [embedding, skillsEmbedding, experienceEmbedding] = await Promise.all([
      embedOptional(model, jobData.description),
      embedOptional(model, skillsText),
      embedOptional(model, experienceText),
    ]);

    // Calculate deadline
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + jobData.durationMonths);

    const job = await Job.create({
      recruiter: recruiter._id,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      description: jobData.description,
      skills: normalizedSkills,
      minExperience: jobData.minExperience,
      durationMonths: jobData.durationMonths,
      deadline,
      embedding,
      skillsEmbedding,
      experienceEmbedding,
      status: "open",
    });

    console.log(`Created job: ${job.title} at ${job.company}`);
    createdJobs.push(job);
  }

  return createdJobs;
}

async function seedApplications(candidates, jobs) {
  console.log("\n--- Seeding Applications ---");
  
  let applicationsCreated = 0;

  // Each candidate applies to 2-4 jobs
  for (const candidate of candidates) {
    const numApplications = Math.floor(Math.random() * 3) + 2; // 2-4 applications
    const selectedJobs = jobs
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, numApplications);

    for (const job of selectedJobs) {
      // Check if application already exists
      const existing = await Application.findOne({
        job: job._id,
        candidate: candidate._id,
      });

      if (existing) {
        continue;
      }

      // Score using shared scoring module (semantic-only by default)
      const score = scoreCandidateForJob(candidate, job);

      await Application.create({
        job: job._id,
        candidate: candidate._id,
        score: score.score,
        breakdown: score.breakdown,
        matchedSkills: score.matchedSkills,
        missingSkills: score.missingSkills,
        skillMatch: score.skillMatch,
        experienceScore: score.experienceScore,
        projectScore: score.projectScore,
        similarity: score.similarity,
        status: "pending",
      });

      applicationsCreated++;
    }
  }

  console.log(`Created ${applicationsCreated} applications`);
}

// Helper functions
function extractSkills(resumeText) {
  const commonSkills = [
    "javascript", "python", "java", "react", "node", "nodejs", "express",
    "mongodb", "sql", "html", "css", "typescript", "angular", "vue",
    "django", "flask", "spring", "springboot", "docker", "kubernetes",
    "aws", "azure", "gcp", "git", "rest", "api", "graphql", "redis",
    "postgresql", "mysql", "agile", "scrum", "ci/cd", "jenkins",
    "terraform", "ansible", "linux", "microservices", "machine learning",
    "deep learning", "nlp", "data science", "pandas", "numpy", "tensorflow",
    "pytorch", "scikit-learn", "c++", "c#", "go", "rust", "kotlin", "swift",
    "react native", "flutter", "ios", "android", "mobile", "fastapi",
    "elasticsearch", "kafka", "rabbitmq", "grpc", "serverless",
    "cypress", "selenium", "jest", "testing", "automation", "figma",
    "tailwind", "next.js", "nextjs", "vue.js", "vuejs", "responsive design"
  ];

  const text = resumeText.toLowerCase();
  const skills = commonSkills.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[+.]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });

  return [...new Set(skills)];
}

function extractEducation(resumeText) {
  const educationKeywords = [
    "bachelor", "master", "phd", "b.tech", "m.tech", "bsc", "msc",
    "b.e", "m.e", "mba", "degree", "diploma", "university", "college"
  ];

  const lines = resumeText.toLowerCase().split('\n');
  for (const line of lines) {
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      return line.trim().substring(0, 200);
    }
  }

  return "";
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log("=== Starting Database Seeding ===\n");
    console.log(`Connecting to MongoDB: ${process.env.MONGODB_URI}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully\n");

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("Clearing existing data...");
    await Application.deleteMany({});
    await Job.deleteMany({});
    await Candidate.deleteMany({});
    await Recruiter.deleteMany({});
    console.log("Existing data cleared\n");

    // Seed data
    const recruiters = await seedRecruiters();
    const candidates = await seedCandidates();
    const jobs = await seedJobs(recruiters);
    await seedApplications(candidates, jobs);

    console.log("\n=== Database Seeding Complete ===");
    console.log(`\nSummary:`);
    console.log(`  - ${recruiters.length} recruiters created`);
    console.log(`  - ${candidates.length} candidates created`);
    console.log(`  - ${jobs.length} jobs created`);
    console.log(`  - Applications created for testing\n`);

    console.log("Test Credentials:");
    console.log("\n--- Recruiters ---");
    console.log("Email: alice.cooper@techgiant.com | Password: recruiter123");
    console.log("Email: bob.smith@startuphub.com | Password: recruiter123");
    console.log("Email: carol.johnson@datatech.com | Password: recruiter123");
    
    console.log("\n--- Job Seekers ---");
    console.log("Email: john.doe@example.com | Password: password123");
    console.log("Email: sarah.johnson@example.com | Password: password123");
    console.log("Email: michael.chen@example.com | Password: password123");
    console.log("Email: emily.rodriguez@example.com | Password: password123");
    console.log("Email: david.kim@example.com | Password: password123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
