import Job from '../models/Job.js';

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({});
    
    // Transform the jobs to match frontend expectations
    const transformedJobs = jobs.map(job => ({
      id: job._id,
      title: job.jobRoleName,
      company: job.companyName,
      description: job.description,
      location: job.location,
      type: job.type,
      experience: job.experience,
      salary: job.salary,
      skills: job.skills,
      explanation: job.explanation || "Job description for " + job.jobRoleName + " at " + job.companyName,
      embedding: job.embedding // Include embedding if needed for similarity matching
    }));
    
    res.json({
      jobs: transformedJobs,
      count: transformedJobs.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Server error while fetching jobs' });
  }
};