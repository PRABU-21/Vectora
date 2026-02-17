import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const links = [
	{ label: "Dashboard", path: "/dashboard" },
	{ label: "Profile", path: "/profile" },
];

const Navbar = ({ showLogout = true }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const activePath = useMemo(() => location.pathname, [location.pathname]);

	const logout = () => {
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

					<div className="flex items-center gap-4 sm:gap-6">
						{links.map(({ label, path }) => {
							const isActive = activePath.startsWith(path);
							return (
								<button
									key={path}
									onClick={() => navigate(path)}
									className={`text-sm sm:text-base font-semibold transition-colors px-2 sm:px-3 py-2 rounded-lg ${
										isActive ? "text-sky-700 bg-sky-50" : "text-gray-700 hover:text-sky-700"
									}`}
								>
									{label}
								</button>
							);
						})}

						{showLogout && (
							<button
								onClick={logout}
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

export default Navbar;
