import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import JobRecommendations from "./pages/JobRecommendations";
import AddEmbeddings from "./pages/AddEmbeddings";
import FreelancerModule from "./pages/FreelancerModule";
import FreelancerProfile from "./pages/FreelancerProfile";
import ResumeBuilder from "./pages/ResumeBuilder";
import GitPulse from "./pages/GitPulse";
import ChatWidget from "./components/ChatWidget";
import RecruiterJobs from "./pages/RecruiterJobs";
import RecruiterApplicants from "./pages/RecruiterApplicants";
import RecruiterShortlist from "./pages/RecruiterShortlist";
import JobApply from "./pages/JobApply";
import "./App.css";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    return null;
  }
};

const ProtectedRoute = ({ roles, children }) => {
  const user = getUser();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === "recruiter" ? "/recruiter/jobs" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

const getDefaultLanding = () => {
  const user = getUser();
  if (user?.role === "recruiter") return "/recruiter/jobs";
  if (user?.role === "applicant") return "/dashboard";
  return "/login";
};

const SessionManager = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const IDLE_LIMIT = 5 * 60 * 1000; // 5 minutes

    const logout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true, state: { reason: "idle" } });
    };

    let timer = setTimeout(logout, IDLE_LIMIT);

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, IDLE_LIMIT);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset));

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [navigate]);

  return null;
};

function App() {
  const user = getUser();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return (
    <Router>
      <SessionManager />
      {user && token && <ChatWidget userRole={user.role} />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-recommendations"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <JobRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-embeddings"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <AddEmbeddings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/freelancer-module"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <FreelancerModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/freelancer-profile"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <FreelancerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-builder"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <ResumeBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gitpluse"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <GitPulse />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute roles={["recruiter"]}>
              <RecruiterJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs/:jobId/applicants"
          element={
            <ProtectedRoute roles={["recruiter"]}>
              <RecruiterApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/shortlist"
          element={
            <ProtectedRoute roles={["recruiter"]}>
              <RecruiterShortlist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/:jobId/apply"
          element={
            <ProtectedRoute roles={["applicant"]}>
              <JobApply />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={getDefaultLanding()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultLanding()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
