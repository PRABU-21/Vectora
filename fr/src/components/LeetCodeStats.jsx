import { useMemo, useState } from "react";
import { getLeetCodeProfile } from "../data/api";

export default function LeetCodeStats({
  username,
  onUsernameChange,
  onFetch,
  data,
  loading,
  error,
  showManual = true,
}) {
  const isControlled = useMemo(
    () =>
      typeof onUsernameChange === "function" &&
      typeof onFetch === "function" &&
      typeof username !== "undefined",
    [onFetch, onUsernameChange, username],
  );

  // Manual (top) input state
  const [manualUsername, setManualUsername] = useState("");
  const [manualData, setManualData] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  // Auto (resume) input state derives from parent control
  const autoValue = isControlled ? username ?? "" : "";
  const autoData = isControlled ? data : null;
  const autoLoading = isControlled ? loading : false;
  const autoError = isControlled ? error : "";

  const runManualFetch = async () => {
    const trimmed = manualUsername.trim();
    if (!trimmed) {
      setManualError("Enter a LeetCode username");
      setManualData(null);
      return;
    }

    setManualLoading(true);
    setManualError("");
    try {
      const res = await getLeetCodeProfile(trimmed);
      if (!res?.success) {
        setManualData(null);
        setManualError(res?.message || "Failed to fetch data");
      } else {
        setManualData(res);
      }
    } catch (err) {
      setManualError(
        err?.response?.data?.message || err?.message || "Failed to fetch data",
      );
      setManualData(null);
    } finally {
      setManualLoading(false);
    }
  };

  const runAutoFetch = () => {
    if (!isControlled) return;
    const trimmed = (autoValue || "").trim();
    onFetch(trimmed);
  };

  const renderStats = (payload) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-white border border-indigo-100">
          <p className="text-xs text-gray-500">Ranking</p>
          <p className="text-xl font-semibold text-indigo-700">
            {payload.ranking ?? "-"}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-100">
          <p className="text-xs text-gray-500">Reputation</p>
          <p className="text-xl font-semibold text-emerald-700">
            {payload.reputation ?? "-"}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-white border border-amber-100">
          <p className="text-xs text-gray-500">Star Rating</p>
          <p className="text-xl font-semibold text-amber-700">
            {payload.starRating ?? "-"}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-100">
          <p className="text-xs text-gray-500">Solved / Total</p>
          <p className="text-xl font-semibold text-blue-700">
            {payload.overall?.solvedCount ?? 0} / {payload.overall?.totalCount ?? 0}
          </p>
        </div>
      </div>

      {payload.activity && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-white border border-orange-100">
            <p className="text-xs text-gray-500">Current Streak</p>
            <p className="text-xl font-semibold text-orange-700">
              {payload.activity.currentStreak ?? 0} days
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-white border border-rose-100">
            <p className="text-xs text-gray-500">Max Streak</p>
            <p className="text-xl font-semibold text-rose-700">
              {payload.activity.maxStreak ?? 0} days
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-white border border-sky-100">
            <p className="text-xs text-gray-500">Active Years</p>
            <p className="text-sm font-semibold text-sky-700">
              {(payload.activity.activeYears || []).join(", ") || "-"}
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">By Difficulty</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(payload.solvedStats || []).map((stat) => (
            <div
              key={stat.difficulty}
              className="rounded-lg bg-white border border-gray-200 p-3"
            >
              <p className="text-xs text-gray-500">{stat.difficulty}</p>
              <p className="text-lg font-semibold text-gray-800">{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      {payload.topics?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">Top Topics</p>
          <div className="flex flex-wrap gap-2">
            {payload.topics.slice(0, 8).map((topic) => (
              <span
                key={topic.name}
                className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
              >
                {topic.name} ({topic.solved})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {showManual && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600">Manual lookup</div>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              placeholder="Enter LeetCode username"
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={runManualFetch}
              disabled={manualLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {manualLoading ? "Loading..." : "Fetch"}
            </button>
          </div>
          {manualError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {manualError}
            </div>
          )}
          {manualData && manualData.success && renderStats(manualData)}
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-600">From resume (auto)</div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            placeholder="Auto-detected LeetCode username"
            value={autoValue}
            onChange={(e) => onUsernameChange?.(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 bg-gray-50 focus:bg-white focus:border-blue-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={runAutoFetch}
            disabled={autoLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
          >
            {autoLoading ? "Loading..." : "Fetch"}
          </button>
        </div>
        {autoError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {autoError}
          </div>
        )}
        {autoData && autoData.success && renderStats(autoData)}
      </div>
    </div>
  );
}
