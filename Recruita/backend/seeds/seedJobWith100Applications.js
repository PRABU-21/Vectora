import "dotenv/config";
import mongoose from "mongoose";
import { pipeline } from "@xenova/transformers";
import Recruiter from "../models/Recruiter.js";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { scoreCandidateForJob } from "../utils/scoring.js";
import { getMyApplications } from "../controllers/candidateController.js";

const DEFAULT_COUNT = 100;

const skillPool = [
  "javascript",
  "typescript",
  "python",
  "java",
  "react",
  "nodejs",
  "express",
  "mongodb",
  "postgresql",
  "aws",
  "azure",
  "docker",
  "kubernetes",
  "redis",
  "graphql",
  "rest",
  "ci/cd",
  "jest",
  "microservices",
];

const firstNames = [
  "Alex",
  "Jordan",
  "Taylor",
  "Sam",
  "Casey",
  "Jamie",
  "Morgan",
  "Drew",
  "Riley",
  "Cameron",
  "Avery",
  "Quinn",
  "Rowan",
  "Parker",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Wilson",
  "Anderson",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function parseArgs(argv) {
  const args = { jobId: null, count: DEFAULT_COUNT };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--jobId" && argv[i + 1]) {
      args.jobId = argv[i + 1];
      i++;
    } else if (a === "--count" && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      if (Number.isFinite(n) && n > 0) args.count = Math.round(n);
      i++;
    }
  }

  return args;
}

function uniqueEmail(base, n) {
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
  return `${slug}.${Date.now()}.${n}@example.com`;
}

function buildResumeText(name, years, skills) {
  return `Resume for ${name}\nExperience: ${years} years of experience\nSkills: ${skills.join(", ")}\nSummary: Built and deployed web services, collaborated in agile teams, wrote tests, and shipped production features.`;
}

async function getEmbeddingModel() {
  return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
}

async function embedText(model, text) {
  const result = await model(text, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

async function ensureSeedRecruiter() {
  const email = "jegan@gmail.com";
  const existing = await Recruiter.findOne({ email });
  if (existing) return existing;

  return Recruiter.create({
    name: "Recruiter",
    email: "recruiter@gmail.com",
    password: "recruiter@123",
    company: "Recruita Seed Co",
  });
}

async function ensureJob(model, recruiterId) {
  const title = "Seeded Full Stack Role";
  const existing = await Job.findOne({ recruiter: recruiterId, title, status: "open" });
  if (existing) return existing;

  const description =
    "We need a Full Stack Developer with React, Node.js, TypeScript, MongoDB, Docker, Kubernetes, AWS. Build REST APIs, microservices, CI/CD, and ship production features.";
  const embedding = await embedText(model, description);
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 3);

  return Job.create({
    recruiter: recruiterId,
    title,
    company: "Recruita Seed Co",
    location: "Remote",
    description,
    skills: ["react", "nodejs", "typescript", "mongodb", "docker", "kubernetes", "aws"],
    minExperience: 2,
    durationMonths: 3,
    deadline,
    embedding,
    status: "open",
  });
}

async function main() {
  const { jobId, count } = parseArgs(process.argv);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const model = await getEmbeddingModel();
  console.log("Embedding model loaded");

  const recruiter = await ensureSeedRecruiter();

  const job = jobId
    ? await Job.findById(jobId)
    : await ensureJob(model, recruiter._id);

  if (!job) {
    throw new Error("Job not found (check --jobId)");
  }

  // Ensure we have enough candidates without wiping existing data
  const existingCandidates = await Candidate.find({ resumeParsed: true, embedding: { $exists: true, $ne: [] } })
    .limit(count)
    .lean();

  const needed = Math.max(0, count - existingCandidates.length);
  if (needed > 0) {
    console.log(`Creating ${needed} additional candidates...`);

    const bulk = [];
    for (let i = 0; i < needed; i++) {
      const name = `${pick(firstNames)} ${pick(lastNames)}`;
      const yearsExperience = Math.max(0, Math.round(Math.random() * 10));
      const skills = Array.from(
        new Set(
          Array.from({ length: 5 + Math.floor(Math.random() * 6) }, () => pick(skillPool))
        )
      );
      const resumeText = buildResumeText(name, yearsExperience, skills);
      const embedding = await embedText(model, resumeText);

      bulk.push({
        name,
        email: uniqueEmail(name, i),
        password: "password123",
        phone: "",
        location: "",
        resumeText,
        embedding,
        skills,
        yearsExperience,
        education: "",
        resumeParsed: true,
        originalFile: "seeded.txt",
      });
    }

    await Candidate.insertMany(bulk);
    console.log(`Inserted ${bulk.length} candidates`);
  }

  const candidates = await Candidate.find({ resumeParsed: true, embedding: { $exists: true, $ne: [] } })
    .limit(count)
    .lean();

  // Create applications for this job only (skip duplicates)
  let created = 0;
  for (const c of candidates) {
    const exists = await Application.findOne({ job: job._id, candidate: c._id }).lean();
    if (exists) continue;

    const scored = scoreCandidateForJob(c, job);

    await Application.create({
      job: job._id,
      candidate: c._id,
      score: scored.score,
      breakdown: scored.breakdown,
      matchedSkills: scored.matchedSkills,
      missingSkills: scored.missingSkills,
      skillMatch: scored.skillMatch,
      experienceScore: scored.experienceScore,
      projectScore: scored.projectScore,
      similarity: scored.similarity,
      status: "pending",
      appliedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });

    created++;
    if (created % 20 === 0) console.log(`Created ${created} applications...`);
  }

  console.log(`\n✅ Seeded job: ${job.title}`);
  console.log(`Job ID: ${job._id}`);
  console.log(`Applications created (new): ${created}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
