import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./features/common/pages/LandingPage";
import JobSeekerLogin from "./features/jobseeker/pages/JobSeekerLogin";
import JobSeekerSignup from "./features/jobseeker/pages/JobSeekerSignup";
import JobSeekerDashboard from "./features/jobseeker/pages/JobSeekerDashboard";
import RecruiterLogin from "./features/recruiter/pages/RecruiterLogin";
import RecruiterSignup from "./features/recruiter/pages/RecruiterSignup";
import RecruiterDashboard from "./features/recruiter/pages/RecruiterDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Job Seeker routes */}
        <Route path="/jobseeker/login" element={<JobSeekerLogin />} />
        <Route path="/jobseeker/signup" element={<JobSeekerSignup />} />
        <Route path="/jobseeker/dashboard" element={<JobSeekerDashboard />} />
        
        {/* Recruiter routes */}
        <Route path="/recruiter/login" element={<RecruiterLogin />} />
        <Route path="/recruiter/signup" element={<RecruiterSignup />} />
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        
        {/* Redirect unknown routes to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
