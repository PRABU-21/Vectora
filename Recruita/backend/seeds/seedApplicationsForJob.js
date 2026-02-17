import "dotenv/config";
import mongoose from "mongoose";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import Application from "../models/Application.js";
import { scoreCandidateForJob } from "../utils/scoring.js";

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, ...rest] = arg.slice(2).split("=");
    out[k] = rest.join("=") || true;
  }
  return out;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomAppliedAt(daysBack = 7) {
  const ms = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}

async function seedJobApplications({ jobId, count }) {
  await mongoose.connect(process.env.MONGODB_URI);

  const job = await Job.findById(jobId).lean();
  if (!job) {
    throw new Error(`Job not found for id: ${jobId}`);
  }

  const candidates = await Candidate.find({
    resumeParsed: true,
    embedding: { $exists: true, $ne: [] },
  })
    .select(
      "name email skills yearsExperience resumeText embedding skillsEmbedding projectsEmbedding experienceEmbedding yearsExperienceConfidence"
    )
    .lean();

  if (!candidates.length) {
    throw new Error(
      "No candidates found with embeddings. Run `npm run seed` first, or add candidates via the app/resume parsing."
    );
  }

  const existing = await Application.find({ job: job._id })
    .select("candidate")
    .lean();
  const alreadyApplied = new Set(existing.map((a) => String(a.candidate)));

  const pool = shuffleInPlace(
    candidates.filter((c) => !alreadyApplied.has(String(c._id)))
  );

  const target = Math.min(count, pool.length);
  if (target === 0) {
    return { created: 0, skipped: candidates.length };
  }

  const applications = [];

  for (const candidate of pool.slice(0, target)) {
    const s = scoreCandidateForJob(candidate, job);
    applications.push({
      job: job._id,
      candidate: candidate._id,
      score: s.score,
      breakdown: s.breakdown,
      matchedSkills: s.matchedSkills,
      missingSkills: s.missingSkills,
      skillMatch: s.skillMatch,
      experienceScore: s.experienceScore,
      projectScore: s.projectScore,
      similarity: s.similarity,
      status: "pending",
      appliedAt: randomAppliedAt(7),
    });
  }

  // ordered:false prevents one duplicate from failing the whole batch
  const inserted = await Application.insertMany(applications, { ordered: false });

  return { created: inserted.length, requested: count, jobTitle: job.title };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jobId =
    args.jobId ||
    args.job ||
    process.env.JOB_ID ||
    process.env.SEED_JOB_ID ||
    process.argv[2];

  const countRaw =
    args.count ??
    process.env.COUNT ??
    process.env.SEED_COUNT ??
    process.argv[3] ??
    "50";
  const count = Number.parseInt(String(countRaw), 10);

  if (!jobId || typeof jobId !== "string") {
    console.error(
      "Usage: node seeds/seedApplicationsForJob.js --jobId=<JOB_ID> [--count=50]\n" +
        "   or: node seeds/seedApplicationsForJob.js <JOB_ID> [COUNT]\n" +
        "   or (env): JOB_ID=<JOB_ID> COUNT=50 node seeds/seedApplicationsForJob.js"
    );
    process.exit(1);
  }

  if (!Number.isFinite(count) || count <= 0) {
    console.error("--count must be a positive integer");
    process.exit(1);
  }

  try {
    const result = await seedJobApplications({ jobId, count });
    console.log(
      `✅ Seeded ${result.created} applications for job: ${result.jobTitle} (requested ${result.requested})`
    );
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error seeding applications for job:", err.message || err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}

main();
