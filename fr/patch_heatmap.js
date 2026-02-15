const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Gitpluse.jsx');

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/);

    // We want to keep lines 1 to 1169 (indices 0 to 1168)
    // Line 1170 is likely the start of the old block (comment)
    // Line 1251 is the start of the next block (Charts Row 2 comment)
    // Indices:
    // Line 1 -> Index 0
    // Line 1169 -> Index 1168
    // Line 1170 -> Index 1169
    // Line 1251 -> Index 1250

    // Safety check: verify line 1251 content
    const checkLine = lines[1250] ? lines[1250].trim() : '';
    if (!checkLine.includes('Charts Row 2')) {
        console.warn("Warning: Line 1251 does not match expected content. It is:", checkLine);
        // We might be off by a few lines due to previous edits.
        // Let's search for the anchor lines instead.
    }

    // Find start anchor: "Contribution Heatmap - Yearly Activity"
    const startIdx = lines.findIndex(l => l.includes('Contribution Heatmap - Yearly Activity'));

    // Find end anchor: "Charts Row 2 - Detailed Contributions"
    const endIdx = lines.findIndex(l => l.includes('Charts Row 2 - Detailed Contributions'));

    if (startIdx === -1 || endIdx === -1) {
        console.error("Could not find anchor lines!");
        process.exit(1);
    }

    console.log(`Found anchors: Start ${startIdx}, End ${endIdx}`);

    const top = lines.slice(0, startIdx);
    const bottom = lines.slice(endIdx);

    const newHeatmap = `            {/* Contribution Heatmap - Yearly Activity */}
            <div className="mb-8 animate-fade-in-up animation-delay-1400">
              <div className="bg-gradient-to-br from-gray-900 via-[#0d1117] to-gray-900 border border-white/5 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-emerald-900/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-white/5 shadow-lg relative group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-0 bg-emerald-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                      <svg className="w-6 h-6 text-emerald-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">Yearly Activity</h3>
                      <div className="text-sm text-gray-400 mt-1 flex items-center gap-2 font-medium">
                        <span className="text-emerald-400">{detailedStats.contributionTimeline?.length || 0} contributions</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span>Last 365 days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-medium text-gray-500 bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
                    <span>Less</span>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 bg-gray-800/50 rounded-[3px]"></div>
                      <div className="w-3 h-3 bg-emerald-900/50 rounded-[3px] border border-emerald-900/30"></div>
                      <div className="w-3 h-3 bg-emerald-700/60 rounded-[3px] border border-emerald-700/30"></div>
                      <div className="w-3 h-3 bg-emerald-500/70 rounded-[3px] border border-emerald-500/30"></div>
                      <div className="w-3 h-3 bg-emerald-400/90 rounded-[3px] border border-emerald-400/30 shadow-[0_0_8px_rgba(52,211,153,0.4)]"></div>
                    </div>
                    <span>More</span>
                  </div>
                </div>

                <div className="w-full relative z-10 overflow-hidden">
                  <svg 
                    viewBox="0 0 840 130" 
                    className="w-full h-auto"
                    style={{ maxHeight: '220px' }}
                  >
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    {calendarWeeks.map((week, wIndex) => (
                      <g key={wIndex} transform={\`translate(\${wIndex * 15.5}, 0)\`}>
                        {week.map((day, dIndex) => (
                          <rect
                            key={\`\${wIndex}-\${dIndex}\`}
                            y={dIndex * 15 + 20}
                            width="11.5"
                            height="11.5"
                            rx="3"
                            ry="3"
                            className={\`transition-all duration-300 ease-out cursor-pointer hover:stroke-white hover:stroke-[1.5px] \${
                              day.count === 0 ? 'fill-gray-800/30' :
                              day.level === 1 ? 'fill-emerald-900/60' :
                              day.level === 2 ? 'fill-emerald-700/70' :
                              day.level === 3 ? 'fill-emerald-500/80' :
                              'fill-emerald-400/90 filter drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]'
                            }\`}
                            data-date={day.date}
                          >
                            <title>{\`\${day.count} contributions on \${day.date}\`}</title>
                          </rect>
                        ))}
                      </g>
                    ))}
                    
                    {/* Day Labels */}
                    <text x="-8" y="45" fontSize="10" fill="#64748b" textAnchor="end" alignmentBaseline="middle" fontWeight="500" style={{ fontFamily: 'monospace' }}>Mon</text>
                    <text x="-8" y="75" fontSize="10" fill="#64748b" textAnchor="end" alignmentBaseline="middle" fontWeight="500" style={{ fontFamily: 'monospace' }}>Wed</text>
                    <text x="-8" y="105" fontSize="10" fill="#64748b" textAnchor="end" alignmentBaseline="middle" fontWeight="500" style={{ fontFamily: 'monospace' }}>Fri</text>
                  </svg>
                </div>
              </div>
            </div>`;

    const newContent = [...top, newHeatmap, ...bottom].join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Successfully patched Gitpluse.jsx");

} catch (err) {
    console.error("Error splicing file:", err);
}
