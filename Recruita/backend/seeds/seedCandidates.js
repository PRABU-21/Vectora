import "dotenv/config";
import mongoose from "mongoose";
import { pipeline } from "@xenova/transformers";
import Candidate from "../models/Candidate.js";

const skillPool = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c#",
  "react",
  "nodejs",
  "express",
  "mongodb",
  "postgresql",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "redis",
  "graphql",
  "rest",
  "ci/cd",
  "jest",
  "cypress",
  "nextjs",
  "vue",
  "svelte",
];

const roles = [
  "Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Fullstack Engineer",
  "Data Engineer",
  "ML Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "QA Engineer",
  "Mobile Engineer",
];

const companies = [
  "Acme Corp",
  "Globex",
  "Innotech",
  "Umbrella",
  "Stark Industries",
  "Wayne Enterprises",
  "Wonka Labs",
  "Soylent Systems",
  "Hooli",
  "Pied Piper",
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
  "Skyler",
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
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function buildEmbeddingModel() {
  return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
}

function makeResumeText(name, role, skills, company, years) {
  return `Resume for ${name}\nRole: ${role}\nExperience: ${years} years\nCompany: ${company}\nSkills: ${skills.join(", ")}\nSummary: ${name} has delivered scalable services, collaborated across teams, and shipped production features with strong testing and deployment practices.`;
}

async function seed(count = 100) {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const model = await buildEmbeddingModel();
  console.log("Embedding model loaded");

  await Candidate.deleteMany({});
  console.log("Cleared Candidate collection");

  const bulk = [];

  // Add 3 high-quality matching resumes first
  const topCandidates = [
    {
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      skills: ["React", "Node.js", "TypeScript", "MongoDB", "PostgreSQL", "AWS", "Docker", "Kubernetes", "GraphQL", "REST API", "Git", "CI/CD", "Jest", "Microservices", "Redis", "Next.js", "Express.js", "Lambda", "S3", "Terraform"],
      yearsExperience: 6,
      resumeText: `Senior Full Stack Developer with 6 years of experience building scalable web applications. Extensively worked with React and TypeScript for frontend development, creating responsive and performant user interfaces. On the backend, specialized in Node.js and Express.js for building RESTful APIs and GraphQL services. Deep expertise in microservices architecture using Docker and Kubernetes for container orchestration. Managed deployments on AWS using EC2, Lambda, S3, and RDS services. Proficient with both PostgreSQL and MongoDB databases, implementing complex queries and optimizing database performance. Built comprehensive CI/CD pipelines using Jenkins and GitHub Actions. Implemented automated testing with Jest achieving 90% code coverage. Led development of an e-commerce platform handling 1M+ daily users. Designed and deployed distributed systems with message queues using RabbitMQ. Experience with Redis caching strategies and Next.js for server-side rendering. Mentored 5 junior developers and conducted regular code reviews. Strong advocate for clean code principles and test-driven development.`,
      originalFile: "sarah_resume.txt"
    },
    {
      name: "Michael Chen",
      email: "mchen@devmail.com",
      skills: ["React", "Node.js", "TypeScript", "MongoDB", "PostgreSQL", "AWS", "Docker", "Kubernetes", "GraphQL", "REST API", "Git", "CI/CD", "Jest", "Microservices", "Nest.js", "RabbitMQ", "Redux", "Webpack", "Jenkins"],
      yearsExperience: 7,
      resumeText: `Full Stack Engineer with 7 years of professional experience developing enterprise-level applications. Expert in React ecosystem including Redux, Hooks, and Context API for state management. Built multiple Node.js backend services using Express.js and Nest.js frameworks. Architected and implemented microservices using Docker containers orchestrated with Kubernetes on AWS EKS. Extensive experience with PostgreSQL database design, query optimization, and MongoDB for document storage. Developed GraphQL APIs with Apollo Server providing efficient data fetching. Implemented RESTful API standards following OpenAPI specifications. Managed AWS infrastructure including EC2, Lambda, S3, RDS, CloudFront, and API Gateway. Created robust CI/CD pipelines using Jenkins, GitLab CI, and AWS CodePipeline. Comprehensive testing approach using Jest, Supertest, and Cypress achieving high code coverage. Led migration of monolithic application to microservices architecture reducing latency by 40%. Implemented event-driven architecture using RabbitMQ message broker. Expertise in TypeScript for type-safe development across full stack. Built real-time features using WebSockets and Socket.io. Strong background in agile methodologies and DevOps practices.`,
      originalFile: "michael_resume.txt"
    },
    {
      name: "Emily Rodriguez",
      email: "e.rodriguez@techmail.com",
      skills: ["React", "Node.js", "TypeScript", "MongoDB", "PostgreSQL", "AWS", "Docker", "Kubernetes", "GraphQL", "REST API", "Git", "CI/CD", "Jest", "Microservices", "Material-UI", "Styled-components", "Prisma", "Sequelize"],
      yearsExperience: 5,
      resumeText: `Software Engineer with 5 years specializing in full-stack development using modern JavaScript technologies. Proficient in React with TypeScript building component-based architectures and reusable UI libraries. Backend development expertise in Node.js creating scalable REST APIs and GraphQL endpoints. Hands-on experience containerizing applications with Docker and deploying on Kubernetes clusters. Database proficiency includes PostgreSQL with Prisma ORM and MongoDB for flexible data models. AWS experience covers EC2, S3, Lambda, RDS, CloudWatch, and IAM management. Implemented CI/CD workflows using GitHub Actions and AWS CodeBuild for automated deployments. Extensive testing using Jest for unit tests and integration testing. Developed microservices handling payment processing and user authentication systems. Built e-learning platform serving 50K+ active users with real-time collaborative features. Implemented GraphQL subscriptions for live data updates. Strong focus on performance optimization reducing bundle sizes and improving load times. Experience with responsive design using Material-UI and styled-components. Participated in architecture decisions for transitioning to cloud-native infrastructure. Collaborated in agile teams following scrum methodology and code review best practices.`,
      originalFile: "emily_resume.txt"
    }
  ];

  for (const candidate of topCandidates) {
    const embeddingResult = await model(candidate.resumeText, {
      pooling: "mean",
      normalize: true,
    });

    bulk.push({
      ...candidate,
      embedding: Array.from(embeddingResult.data),
    });
    console.log(`Prepared top candidate: ${candidate.name}`);
  }

  // Generate additional random candidates
  for (let i = 0; i < count; i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}${i}@example.com`;
    const role = pick(roles);
    const years = Math.max(0, Math.round(Math.random() * 12));
    const skills = Array.from(
      new Set(
        Array.from({ length: 5 + Math.floor(Math.random() * 5) }, () =>
          pick(skillPool)
        )
      )
    );
    const company = pick(companies);
    const resumeText = makeResumeText(name, role, skills, company, years);

    const embeddingResult = await model(resumeText, {
      pooling: "mean",
      normalize: true,
    });

    bulk.push({
      name,
      email,
      skills,
      yearsExperience: years,
      resumeText,
      originalFile: "seeded.txt",
      embedding: Array.from(embeddingResult.data),
    });

    if ((i + 1) % 10 === 0) {
      console.log(`Prepared ${i + 1} random candidates...`);
    }
  }

  await Candidate.insertMany(bulk);
  console.log(`Inserted ${bulk.length} total candidates (3 top matches + ${count} random)`);
  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});