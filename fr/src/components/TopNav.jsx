import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GooeyNav from "./GooeyNav";

const links = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Profile", path: "/profile" },
];

const TopNav = ({ showLogout = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  const navIndex = useMemo(() => {
    const idx = links.findIndex((l) => activePath.startsWith(l.path));
    return idx >= 0 ? idx : 0;
  }, [activePath]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 focus:outline-none"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-700 bg-clip-text text-transparent">
              Vectora
            </span>
          </button>

            <div className="flex items-center gap-6">
              <GooeyNav
                items={links.map((l) => ({ label: l.label, href: l.path }))}
                activeIndex={navIndex}
                onSelect={(_, item) => navigate(item.href)}
              />

              {showLogout && (
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold hover:from-sky-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
                >
                  Logout
                </button>
              )}
            </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
