import "dotenv/config";
import mongoose from "mongoose";
import Job from "./models/Job.js";
import Candidate from "./models/Candidate.js";

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const job = await Job.findOne({}).lean();
  const candidate = await Candidate.findOne({}).lean();
  
  console.log("Job embedding:", job?.embedding ? `${job.embedding.length} dims` : "NO EMBEDDING");
  console.log("Candidate embedding:", candidate?.embedding ? `${candidate.embedding.length} dims` : "NO EMBEDDING");
  
  if (job?.embedding && candidate?.embedding) {
    console.log("Job embedding sample:", job.embedding.slice(0, 5));
    console.log("Candidate embedding sample:", candidate.embedding.slice(0, 5));
  }
  
  await mongoose.disconnect();
}

check();
