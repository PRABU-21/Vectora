import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import JobRecommendations from "./pages/JobRecommendations";
import AddEmbeddings from "./pages/AddEmbeddings";
import FreelancerModule from "./pages/FreelancerModule";
import FreelancerProfile from "./pages/FreelancerProfile";
import ResumeBuilder from "./pages/ResumeBuilder";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/job-recommendations" element={<JobRecommendations />} />
        <Route path="/add-embeddings" element={<AddEmbeddings />} />
        <Route path="/freelancer-module" element={<FreelancerModule />} />
        <Route path="/freelancer-profile" element={<FreelancerProfile />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
