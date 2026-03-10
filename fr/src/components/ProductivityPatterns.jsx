import React from 'react';
import { Zap, Clock, Calendar } from 'lucide-react';

const ProductivityPatterns = ({ data }) => {
    if (!data) return null;

    const { peakHour, peakDay, hourlyActivity, dailyActivity } = data;

    // Find max values for scaling bars
    const maxHourly = Math.max(...hourlyActivity.map(d => d.count), 1);
    const maxDaily = Math.max(...dailyActivity.map(d => d.count), 1);

    return (
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-800/50 pb-4">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white">Productivity Patterns</h3>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Peak Hour Card */}
                <div className="bg-[#0d1117] border border-gray-800/50 rounded-lg p-5 flex flex-col gap-1 relative overflow-hidden group">
                    <div className="absolute top-2 right-2 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-12 h-12 text-emerald-500" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider z-10">Peak Hour</span>
                    <div className="text-2xl font-bold text-emerald-400 z-10 leading-none mt-1">{peakHour}</div>
                </div>

                {/* Peak Day Card */}
                <div className="bg-[#0d1117] border border-gray-800/50 rounded-lg p-5 flex flex-col gap-1 relative overflow-hidden group">
                    <div className="absolute top-2 right-2 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-12 h-12 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider z-10">Peak Day</span>
                    <div className="text-2xl font-bold text-blue-400 z-10 leading-none mt-1">{peakDay}</div>
                </div>
            </div>

            {/* Activity by Hour Chart */}
            <div className="flex flex-col gap-3">
                <div className="text-xs text-gray-400 font-medium ml-1">Activity by Hour (24h)</div>
                <div className="h-24 w-full grid grid-cols-24 gap-[2px] items-end px-1">
                    {hourlyActivity.map((item, index) => {
                        const heightPercent = maxHourly > 0 ? (item.count / maxHourly) * 100 : 0;
                        const isPeak = item.count === maxHourly && maxHourly > 0;

                        return (
                            <div key={index} className="flex flex-col items-center h-full justify-end group relative cursor-help">
                                <div
                                    className={`w-full rounded-t-[2px] transition-all duration-500 ${isPeak ? 'bg-emerald-400' : 'bg-emerald-500/40 hover:bg-emerald-500/60'}`}
                                    style={{ height: `${Math.max(heightPercent, 5)}%` }} // Min height 5%
                                >
                                </div>
                                {/* Advanced Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none min-w-[80px]">
                                    <div className="bg-[#1f2428] text-gray-200 text-[10px] py-1.5 px-2.5 rounded border border-gray-700 shadow-xl text-center">
                                        <div className="font-bold text-white mb-0.5">{item.hour}</div>
                                        <div><span className="text-emerald-400 font-bold">{item.count}</span> commits</div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="w-2 h-2 bg-[#1f2428] border-r border-b border-gray-700 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Hour Markers */}
                <div className="flex justify-between text-[9px] text-gray-600 font-mono px-1 uppercase tracking-wider">
                    <span>12 AM</span>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                </div>
            </div>

            {/* Activity by Day Chart */}
            <div className="flex flex-col gap-3 mt-2">
                <div className="text-xs text-gray-400 font-medium ml-1">Activity by Day</div>
                <div className="h-24 w-full grid grid-cols-7 gap-3 items-end px-1">
                    {dailyActivity.map((item, index) => {
                        const heightPercent = maxDaily > 0 ? (item.count / maxDaily) * 100 : 0;
                        const isPeak = item.count === maxDaily && maxDaily > 0;

                        return (
                            <div key={index} className="flex flex-col items-center h-full justify-end group relative cursor-help w-full">
                                <div
                                    className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ${isPeak ? 'bg-blue-400' : 'bg-blue-500/40 hover:bg-blue-500/60'}`}
                                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                >
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium uppercase mt-2">{item.day}</div>

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none min-w-[80px] mb-8">
                                    <div className="bg-[#1f2428] text-gray-200 text-[10px] py-1.5 px-2.5 rounded border border-gray-700 shadow-xl text-center">
                                        <div className="font-bold text-white mb-0.5">{item.day}</div>
                                        <div><span className="text-blue-400 font-bold">{item.count}</span> commits</div>
                                    </div>
                                    <div className="w-2 h-2 bg-[#1f2428] border-r border-b border-gray-700 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProductivityPatterns;
