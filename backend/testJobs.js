import mongoose from 'mongoose';
import Job from './models/Job.js';

const testJobs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-recommendation');
    
    const count = await Job.countDocuments({});
    console.log(`Total jobs in database: ${count}`);
    
    const sampleJobs = await Job.find({}).limit(3);
    console.log('Sample jobs:');
    sampleJobs.forEach(job => {
      console.log(`- ${job.jobRoleName} at ${job.companyName}`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error testing jobs:', error);
  }
};

testJobs();