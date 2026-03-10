import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area
} from "recharts";
import { Activity, Calendar, Info } from 'lucide-react';

const ActivityBreakdown = ({ data }) => {
    // If no data, show empty state or loading
    if (!data || data.length === 0) {
        return (
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No activity data available</p>
                </div>
            </div>
        );
    }

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#161b22]/95 backdrop-blur-md border border-gray-700 p-4 rounded-xl shadow-2xl min-w-[200px]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-200 font-medium text-sm">{label}</span>
                    </div>
                    <div className="space-y-2">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full ring-1 ring-black/20"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-gray-300 capitalize">{entry.name}</span>
                                </div>
                                <span className="font-mono font-semibold text-white">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom Legend
    const CustomLegend = (props) => {
        const { payload } = props;
        return (
            <div className="flex justify-center flex-wrap gap-6 mt-4">
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex items-center gap-2 group cursor-default">
                        <div
                            className="w-3 h-3 rounded-sm transition-transform group-hover:scale-110"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors capitalize">
                            {entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Activity className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Activity Breakdown</h3>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                            Overview of your contributions over time
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-300">Last Year</span>
                </div>
            </div>

            {/* Chart Container */}
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPrs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#30363d"
                            vertical={false}
                            opacity={0.4}
                        />

                        <XAxis
                            dataKey="name"
                            stroke="#8b949e"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            minTickGap={30}
                            tick={{ fill: '#6e7681' }}
                        />

                        <YAxis
                            stroke="#8b949e"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            tick={{ fill: '#6e7681' }}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Legend content={<CustomLegend />} />

                        <Line
                            type="monotone"
                            dataKey="commits"
                            stroke="#10b981" // Emerald
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, fill: '#161b22' }}
                            animationDuration={1500}
                        />

                        <Line
                            type="monotone"
                            dataKey="prs"
                            name="Pull Requests"
                            stroke="#3b82f6" // Blue
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, fill: '#161b22' }}
                            animationDuration={1500}
                            animationBegin={200}
                        />

                        <Line
                            type="monotone"
                            dataKey="issues"
                            stroke="#f59e0b" // Amber
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, fill: '#161b22' }}
                            animationDuration={1500}
                            animationBegin={400}
                        />

                        <Line
                            type="monotone"
                            dataKey="reviews"
                            stroke="#8b5cf6" // Purple
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, fill: '#161b22' }}
                            animationDuration={1500}
                            animationBegin={600}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ActivityBreakdown;
