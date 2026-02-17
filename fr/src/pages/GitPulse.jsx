import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from "recharts";
import {
    Github,
    GitCommit,
    GitPullRequest,
    AlertCircle,
    Star,
    GitFork,
    BookOpen,
    Calendar,
    Zap,
    TrendingUp,
    Activity,
    Flame,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from "lucide-react";
import ParticlesBackground from "../components/ParticlesBackground";
import ProductivityPatterns from "../components/ProductivityPatterns";
import ActivityBreakdown from "../components/ActivityBreakdown";

const GitPulse = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [githubData, setGithubData] = useState(null);

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                const token = searchParams.get("token");
                const storedToken = localStorage.getItem("token");
                const authToken = token || storedToken;

                // If no token, just show login screen
                if (!authToken) {
                    console.log("No token found. Showing authorization screen.");
                    setLoading(false);
                    setGithubData(null);
                    return;
                }

                // If we got a new token from URL, save it and clean URL
                if (token) {
                    console.log("Token received from GitHub redirect. Saving to localStorage.");
                    localStorage.setItem("token", token);
                    window.history.replaceState({}, document.title, "/gitpluse");
                }

                // Fetch GitHub data with the token
                console.log("Fetching GitHub data with token...");
                const response = await fetch("http://localhost:5000/api/auth/github-data", {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("GitHub data fetched successfully:", data);
                    setGithubData(data);
                    setError(null);
                } else if (response.status === 401) {
                    console.error("Token invalid or expired. Clearing storage.");
                    localStorage.removeItem("token");
                    setLoading(false);
                    setGithubData(null);
                } else {
                    console.error("Failed to fetch GitHub data:", response.status);
                    setError("Failed to fetch GitHub data");
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error initializing dashboard:", err);
                setError("An unexpected error occurred: " + err.message);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        initializeDashboard();
    }, [searchParams]);

    const handleConnect = async () => {
        try {
            console.log("Initiating GitHub authorization...");
            const response = await fetch("http://localhost:5000/api/auth/github");

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            const data = await response.json();
            console.log("GitHub authorization URL received:", data.authUrl);

            if (data.authUrl) {
                console.log("Redirecting to GitHub...");
                window.location.href = data.authUrl;
            } else {
                setError("Could not get authorization URL from server");
            }
        } catch (err) {
            console.error("Error initiating GitHub login:", err);
            setError("Could not connect to GitHub. Please try again. Error: " + err.message);
        }
    };

    const handleSignOut = () => {
        console.log("Signing out from GitPulse...");
        localStorage.removeItem("token");
        setGithubData(null);
        setError(null);
        console.log("Sign out complete. Authorization screen will appear.");
    };

    const handleRefreshData = async () => {
        try {
            setRefreshing(true);
            console.log("Refreshing GitHub data...");
            const token = localStorage.getItem("token");

            if (!token) {
                setError("No authentication token found");
                return;
            }

            const response = await fetch("http://localhost:5000/api/auth/github-data", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("GitHub data refreshed successfully:", data);
                setGithubData(data);
                setError(null);
            } else if (response.status === 401) {
                console.error("Token invalid or expired. Clearing storage.");
                localStorage.removeItem("token");
                setGithubData(null);
                setError("Session expired. Please re-authenticate.");
            } else {
                console.error("Failed to refresh GitHub data:", response.status);
                setError("Failed to refresh data. Please try again.");
            }
        } catch (err) {
            console.error("Error refreshing data:", err);
            setError("Error refreshing data: " + err.message);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading GitPulse...</p>
                </div>
            </div>
        );
    }

    // Show authorization screen if no GitHub data and no error
    if (!githubData && !error) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <ParticlesBackground id="connect-particles" className="opacity-20" />
                <div className="relative z-10 max-w-lg w-full bg-[#161b22]/80 backdrop-blur-xl p-10 rounded-2xl border border-slate-700/50 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20">
                        <Github className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">GitPulse</h1>
                    <p className="text-slate-400 mb-8 text-lg">
                        Visualize your GitHub activity with a premium, insightful dashboard.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-4 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-3 text-lg border border-[rgba(240,246,252,0.1)]"
                    >
                        <Github className="w-6 h-6" />
                        Sign in with GitHub
                    </button>
                    <p className="text-xs text-gray-500 mt-6">
                        We only request access to your public profile and repository information.
                    </p>
                </div>
            </div>
        );
    }

    // Show error screen if there's an error
    if (error) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <ParticlesBackground id="error-particles" className="opacity-20" />
                <div className="relative z-10 max-w-lg w-full bg-[#161b22]/80 backdrop-blur-xl p-10 rounded-2xl border border-red-500/50 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/20">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
                    <p className="text-slate-400 mb-8 text-sm">{error}</p>
                    <button
                        onClick={handleConnect}
                        className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-3 rounded-lg font-semibold transition-all"
                    >
                        Try Signing in Again
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            window.location.reload();
                        }}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all mt-3"
                    >
                        Reset & Start Over
                    </button>
                </div>
            </div>
        );
    }

    const { profile, stats, repositories, contributionCalendar, commitContributionsByRepository, currentStreak, longestStreak, momentum, productivity, activityTimeline } = githubData;
    const weeks = contributionCalendar?.weeks || [];

    // Weekly Activity Data (Last 7 Days)
    const getLast7DaysData = () => {
        const days = [];
        weeks.forEach(week => {
            week.contributionDays.forEach(day => {
                days.push({ date: day.date, count: day.contributionCount });
            });
        });
        // Get last 7 days and format date
        return days.slice(-7).map(d => ({
            day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
            count: d.count
        }));
    };
    const weeklyActivityData = getLast7DaysData();

    // Language Distribution Data
    const getLanguageData = () => {
        if (!repositories?.languages) return [];

        const total = Object.values(repositories.languages).reduce((a, b) => a + b, 0);
        const languages = Object.entries(repositories.languages)
            .map(([name, count]) => ({
                name,
                count,
                percentage: ((count / total) * 100).toFixed(1),
                color: getLanguageColor(name)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6); // Top 6 languages

        return languages;
    };

    const languageData = getLanguageData();

    // Helper for language colors
    function getLanguageColor(language) {
        const colors = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#3178c6',
            'Python': '#3572A5',
            'Java': '#b07219',
            'HTML': '#e34c26',
            'CSS': '#563d7c',
            'C++': '#f34b7d',
            'C#': '#178600',
            'Go': '#00ADD8',
            'Rust': '#dea584',
            'PHP': '#4F5D95',
            'Ruby': '#701516',
            'Swift': '#F05138',
            'Kotlin': '#A97BFF',
            'Dart': '#00B4AB'
        };
        return colors[language] || '#8b949e'; // Default gray
    }

    // Custom Colors for charts
    const repoContributionData = commitContributionsByRepository
        ? commitContributionsByRepository
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        : [];

    // Custom Colors for charts
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
    const ACTIVITY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

    // Activity Breakdown Data
    const activityData = [
        { name: 'Commits', value: stats.commits },
        { name: 'PRs', value: stats.prs },
        { name: 'Issues', value: stats.issues },
        { name: 'Reviews', value: stats.reviews }
    ].filter(item => item.value > 0);

    const Heatmap = () => {
        // Calculate month labels
        const monthLabels = [];
        let currentMonth = -1;

        weeks.forEach((week, index) => {
            const firstDay = new Date(week.contributionDays[0].date);
            const month = firstDay.getMonth();
            if (month !== currentMonth) {
                monthLabels.push({ index, label: firstDay.toLocaleString('default', { month: 'short' }) });
                currentMonth = month;
            }
        });

        return (
            <div className="w-full overflow-hidden p-4 bg-[#0d1117] rounded-xl border border-gray-800 shadow-inner">
                {/* Month Labels */}
                <div className="flex text-[10px] text-gray-500 mb-2 relative h-4">
                    {monthLabels.map((m, i) => (
                        <span
                            key={i}
                            style={{
                                left: `${m.index * 13 + 30}px`, // 10px width + 3px gap, + offset for day labels
                                position: 'absolute'
                            }}
                        >
                            {m.label}
                        </span>
                    ))}
                </div>

                <div className="flex gap-2">
                    {/* Day Labels - Only Mon, Wed, Fri */}
                    <div className="flex flex-col gap-[3px] text-[9px] text-gray-500 font-medium pt-[13px] w-6">
                        <span className="h-[10px]"></span>
                        <span className="h-[10px]">Mon</span>
                        <span className="h-[10px]"></span>
                        <span className="h-[10px]">Wed</span>
                        <span className="h-[10px]"></span>
                        <span className="h-[10px]">Fri</span>
                        <span className="h-[10px]"></span>
                    </div>

                    {/* Grid */}
                    <div className="flex gap-[3px] overflow-x-auto custom-scrollbar pb-2">
                        {weeks.map((week, wIndex) => (
                            <div key={wIndex} className="flex flex-col gap-[3px]">
                                {week.contributionDays.map((day, dIndex) => {
                                    const count = day.contributionCount;

                                    // Professional styling logic
                                    // Default (0): Transparent with faint border
                                    let styleClass = "bg-transparent border border-gray-800/60";

                                    if (count > 0) styleClass = "bg-[#0e4429]/40 border border-[#0e4429] shadow-[0_0_2px_rgba(14,68,41,0.5)]";
                                    if (count > 2) styleClass = "bg-[#006d32]/50 border border-[#006d32] shadow-[0_0_4px_rgba(0,109,50,0.6)]";
                                    if (count > 5) styleClass = "bg-[#26a641]/60 border border-[#26a641] shadow-[0_0_6px_rgba(38,166,65,0.7)]";
                                    if (count > 10) styleClass = "bg-[#39d353]/70 border border-[#39d353] shadow-[0_0_8px_rgba(57,211,83,0.8)]";

                                    // Special outline effect for highest activity
                                    if (count > 10) {
                                        styleClass += " ring-1 ring-[#39d353]/30";
                                    }

                                    return (
                                        <div
                                            key={dIndex}
                                            className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer ${styleClass}`}
                                            title={`${count} contributions on ${day.date}`}
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans selection:bg-emerald-500/30">

            <nav className="border-b border-gray-800 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gray-800 rounded-md border border-gray-700">
                            <Activity className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">
                            GitPulse
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRefreshData}
                            disabled={refreshing}
                            className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors hover:bg-blue-500/10 px-3 py-1 rounded flex items-center gap-1"
                            title="Refresh GitHub data"
                        >
                            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors hover:bg-red-500/10 px-3 py-1 rounded"
                            title="Sign out from GitHub and re-authenticate"
                        >
                            Sign Out
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium hover:text-white transition-colors">
                            Exit Dashboard
                        </button>
                        <img
                            src={profile.avatar_url}
                            alt={profile.name}
                            className="w-9 h-9 rounded-full border border-gray-700 ring-2 ring-transparent hover:ring-emerald-500/50 transition-all cursor-pointer"
                            title={`Logged in as ${profile.name}`}
                        />
                    </div>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={<GitCommit className="text-emerald-400" />} label="Total Commits" value={stats.commits} />
                    <StatCard icon={<GitPullRequest className="text-blue-400" />} label="Pull Requests" value={stats.prs} />
                    <StatCard icon={<AlertCircle className="text-amber-400" />} label="Issues" value={stats.issues} />
                    <StatCard icon={<GitFork className="text-purple-400" />} label="Code Reviews" value={stats.reviews} />
                </div>

                {/* Streak & Momentum Stats - Premium Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-gray-800 rounded-xl p-6 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Flame className="w-24 h-24 text-orange-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                <Flame className="w-5 h-5" />
                            </div>
                            <h3 className="text-gray-400 font-medium text-sm">Current Streak</h3>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold text-white">{currentStreak || 0}</span>
                            <span className="text-gray-500 text-sm">days</span>
                        </div>
                        <div className="mt-4 text-xs text-orange-400/80 font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Keep the fire burning!
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-gray-800 rounded-xl p-6 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="w-24 h-24 text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="text-gray-400 font-medium text-sm">Momentum</h3>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold text-white">{Math.abs(momentum)}%</span>
                            {momentum > 0 ? (
                                <span className="text-emerald-400 text-sm flex items-center bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {momentum}%
                                </span>
                            ) : momentum < 0 ? (
                                <span className="text-red-400 text-sm flex items-center bg-red-400/10 px-1.5 py-0.5 rounded">
                                    <ArrowDownRight className="w-3 h-3 mr-1" />
                                    {Math.abs(momentum)}%
                                </span>
                            ) : (
                                <span className="text-gray-400 text-sm flex items-center bg-gray-700/30 px-1.5 py-0.5 rounded">
                                    <Minus className="w-3 h-3 mr-1" />
                                    Stable
                                </span>
                            )}
                        </div>
                        <div className="mt-4 text-xs text-blue-400/80 font-medium">
                            vs. previous 7 days
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-gray-800 rounded-xl p-6 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="w-24 h-24 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="text-gray-400 font-medium text-sm">Longest Streak</h3>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold text-white">{longestStreak || 0}</span>
                            <span className="text-gray-500 text-sm">days</span>
                        </div>
                        <div className="mt-4 text-xs text-emerald-400/80 font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Personal Best
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Profile & Main Stats */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={profile.avatar_url} alt={profile.name} className="w-20 h-20 rounded-full border-2 border-gray-700" />
                                <div>
                                    <h1 className="text-2xl font-bold text-white leading-tight">{profile.name}</h1>
                                    <a href={`https://github.com/${profile.login}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 text-base">@{profile.login}</a>
                                </div>
                            </div>
                            <p className="text-gray-400 mb-6 text-sm leading-relaxed">{profile.bio || "No bio available."}</p>
                            <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-800 pt-4">
                                <div className="p-2">
                                    <div className="text-lg font-bold text-white">{profile.public_repos}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Repos</div>
                                </div>
                                <div className="p-2 border-l border-gray-800">
                                    <div className="text-lg font-bold text-white">{profile.followers}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Followers</div>
                                </div>
                                <div className="p-2 border-l border-gray-800">
                                    <div className="text-lg font-bold text-white">{profile.following}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Following</div>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Activity Chart */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm flex-1">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                Weekly Activity
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3fb950" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#2ea043" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} opacity={0.4} />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#8b949e"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                            tick={{ fill: '#8b949e', fontSize: 11 }}
                                        />
                                        <YAxis
                                            stroke="#8b949e"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                            tick={{ fill: '#6e7681' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(22, 27, 34, 0.9)',
                                                borderColor: '#30363d',
                                                color: '#c9d1d9',
                                                borderRadius: '8px',
                                                backdropFilter: 'blur(8px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                            }}
                                            cursor={{ fill: 'rgba(56, 139, 253, 0.1)' }}
                                            formatter={(value) => [`${value} contributions`, 'Activity']}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="url(#activityGradient)"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={50}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Language Distribution - New Section */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-purple-400" />
                                Languages
                            </h3>

                            {languageData.length > 0 ? (
                                <div>
                                    {/* Stacked Bar */}
                                    <div className="flex h-3 rounded-md overflow-hidden mb-4 bg-gray-800/30">
                                        {languageData.map((lang, index) => (
                                            <div
                                                key={lang.name}
                                                style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                                                className="h-full border-r border-[#161b22] last:border-0 hover:opacity-90 transition-opacity"
                                                title={`${lang.name}: ${lang.percentage}%`}
                                            />
                                        ))}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        {languageData.map((lang) => (
                                            <div key={lang.name} className="flex items-center gap-2 text-sm">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }}></div>
                                                <span className="text-white font-medium">{lang.name}</span>
                                                <span className="text-gray-500">{lang.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm text-center py-4">No language data available</div>
                            )}
                        </div>

                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white">Contribution Calendar</h3>
                                <span className="text-xs text-gray-500">{contributionCalendar?.totalContributions || 0} contributions in the last year</span>
                            </div>
                            <div className="overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
                                <div className="min-w-[600px]">
                                    <Heatmap />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 justify-end">
                                <span>Less</span>
                                <div className="w-3 h-3 rounded-[2px] border border-gray-800/60 bg-transparent"></div>
                                <div className="w-3 h-3 rounded-[2px] border border-[#0e4429] bg-[#0e4429]/40"></div>
                                <div className="w-3 h-3 rounded-[2px] border border-[#006d32] bg-[#006d32]/50"></div>
                                <div className="w-3 h-3 rounded-[2px] border border-[#26a641] bg-[#26a641]/60"></div>
                                <div className="w-3 h-3 rounded-[2px] border border-[#39d353] bg-[#39d353]/70"></div>
                                <span>More</span>
                            </div>
                        </div>


                        {/* Productivity Patterns */}
                        <ProductivityPatterns data={productivity} />

                        {/* Activity Breakdown - Full Width */}
                        <ActivityBreakdown data={activityTimeline} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">



                            {/* Commits by Repository Pie Chart */}
                            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden h-[400px] flex flex-col group hover:border-blue-800/50 transition-all">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-50"></div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-400" />
                                    Commits by Repository
                                    {repoContributionData.length > 0 && (
                                        <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full font-normal">
                                            {repoContributionData.reduce((sum, r) => sum + r.count, 0)} commits
                                        </span>
                                    )}
                                </h3>
                                <div className="flex-1 relative">
                                    {repoContributionData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={repoContributionData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                    animationBegin={0}
                                                    animationDuration={800}
                                                    animationEasing="ease-out"
                                                >
                                                    {repoContributionData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                            stroke="none"
                                                            className="hover:opacity-80 transition-opacity"
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#161b22',
                                                        borderColor: '#30363d',
                                                        color: '#c9d1d9',
                                                        borderRadius: '6px',
                                                        padding: '8px 12px',
                                                        fontSize: '12px'
                                                    }}
                                                    formatter={(value) => [`${value} commits`, 'Commits']}
                                                    labelFormatter={(name) => `Repository: ${name}`}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="animate-pulse mb-2">
                                                    <div className="w-12 h-12 rounded-full bg-gray-700/50 mx-auto"></div>
                                                </div>
                                                <p className="text-gray-500 text-sm">Loading repository data...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {repoContributionData.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-2 max-h-[80px] overflow-y-auto pr-2">
                                        {repoContributionData.slice(0, 10).map((entry, index) => (
                                            <div key={index} className="flex items-center gap-2 text-xs hover:bg-gray-800/50 p-1 rounded transition-colors">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-gray-300 truncate font-medium">{entry.name}</p>
                                                    <p className="text-gray-500 text-xs">{entry.count} commits</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Top Repos List */}
                            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden h-[400px] flex flex-col">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 opacity-50"></div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-400" />
                                    Top Repositories
                                </h3>
                                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                    {repositories.topRepos.map((repo) => (
                                        <div key={repo.name} className="flex justify-between items-start p-3 hover:bg-gray-800/50 rounded-lg transition-colors group cursor-pointer" onClick={() => window.open(repo.url, '_blank')}>
                                            <div>
                                                <div className="font-semibold text-blue-400 group-hover:underline mb-0.5 text-sm">{repo.name}</div>
                                                <div className="text-xs text-gray-500">{repo.language || "Unknown"}</div>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-400 text-xs">
                                                <Star className="w-3 h-3" />
                                                {repo.stars}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Commits Breakdown */}
                        {repoContributionData.length > 0 && (
                            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50"></div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-indigo-400" />
                                    All Repository Commits
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Repository</th>
                                                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Commits</th>
                                                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {repoContributionData.map((repo, index) => {
                                                const total = repoContributionData.reduce((sum, r) => sum + r.count, 0);
                                                const percentage = ((repo.count / total) * 100).toFixed(1);
                                                return (
                                                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                                <span className="text-gray-300 font-medium">{repo.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-4 text-gray-300 font-semibold">{repo.count}</td>
                                                        <td className="text-right py-3 px-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <span className="text-gray-400">{percentage}%</span>
                                                                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full transition-all"
                                                                        style={{
                                                                            width: `${percentage}%`,
                                                                            backgroundColor: COLORS[index % COLORS.length]
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recent Activity Section */}
                        {githubData.recentActivity && githubData.recentActivity.length > 0 && (
                            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm">
                                {/* Header Grid */}
                                <div className="grid grid-cols-[auto_1fr] items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <Activity className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-white">Recent Activity</h3>
                                </div>

                                {/* Activity List Grid */}
                                <div className="grid grid-cols-1 gap-4">
                                    {githubData.recentActivity.map((activity) => (
                                        <div key={activity.id} className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4 border-b border-gray-800/50 last:border-0 last:pb-0 group">
                                            {/* Icon Column */}
                                            <div className="relative mt-1">
                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center ring-2 ring-[#0d1117] relative z-10 group-hover:scale-110 transition-transform">
                                                    {activity.iconType === 'commit' && <GitCommit className="w-4 h-4 text-emerald-400" />}
                                                    {activity.iconType === 'pr' && <GitPullRequest className="w-4 h-4 text-purple-400" />}
                                                    {activity.iconType === 'issue' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                                                    {activity.iconType === 'create' && <GitFork className="w-4 h-4 text-blue-400" />}
                                                    {activity.iconType === 'star' && <Star className="w-4 h-4 text-yellow-400" />}
                                                    {activity.iconType === 'default' && <Activity className="w-4 h-4 text-gray-400" />}
                                                </div>
                                                <div className="absolute top-8 left-1/2 -ml-px w-px h-full bg-gray-800 -z-0 last:hidden"></div>
                                            </div>

                                            {/* Content Column */}
                                            <div className="grid grid-rows-[auto_auto] gap-1.5">
                                                <div className="text-sm text-gray-200 font-medium leading-tight">
                                                    <span className="text-gray-400 mr-1.5 font-normal">{activity.action}</span>
                                                    {activity.title}
                                                </div>
                                                <div className="grid grid-flow-col auto-cols-max gap-2 items-center text-xs text-gray-500">
                                                    <a href={`https://github.com/${activity.repo}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors font-medium">
                                                        {activity.repo}
                                                    </a>
                                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                    <span>{new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-gray-700 transition-colors">
        <div className="p-3 bg-gray-800/50 rounded-lg">
            {icon}
        </div>
        <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
        </div>
    </div>
);

export default GitPulse;
