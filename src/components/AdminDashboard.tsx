import React, { useState } from 'react';
import { AppVersion } from '../types';
import {
  Layers,
  Download,
  HardDrive,
  Activity,
  TrendingUp,
  Sparkles,
  Calendar,
  ArrowUpRight,
  SlidersHorizontal,
  TrendingDown,
  Info,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  versions: AppVersion[];
}

export default function AdminDashboard({ versions }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'traffic' | 'trend'>('traffic');
  const [sortBy, setSortBy] = useState<'code' | 'downloads' | 'date'>('downloads');

  // Calculations
  const totalBuilds = versions.length;
  const totalDownloads = versions.reduce((sum, v) => sum + v.downloadCount, 0);

  // Helper to parse file sizes into bytes for summing
  const parseSizeToBytes = (sizeStr: string): number => {
    const match = sizeStr.match(/^([\d.]+)\s*(MB|KB|Bytes|GB)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'KB') return value * 1024;
    if (unit === 'MB') return value * 1024 * 1024;
    if (unit === 'GB') return value * 1024 * 1024 * 1024;
    return value;
  };

  const totalSizeBytes = versions.reduce((sum, v) => sum + parseSizeToBytes(v.fileSize), 0);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalSizeFormatted = formatBytes(totalSizeBytes);
  const avgSizeFormatted = formatBytes(totalBuilds > 0 ? totalSizeBytes / totalBuilds : 0);

  // Most active version
  const sortedByDownloads = [...versions].sort((a, b) => b.downloadCount - a.downloadCount);
  const topVersion = sortedByDownloads[0] || null;

  // Sorted list for sorting selector
  const getSortedVersions = () => {
    const list = [...versions];
    if (sortBy === 'code') {
      return list.sort((a, b) => b.versionCode - a.versionCode);
    } else if (sortBy === 'downloads') {
      return list.sort((a, b) => b.downloadCount - a.downloadCount);
    } else {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const sortedVersionsList = getSortedVersions();

  // Smart insights generation based on live data
  const generateInsights = () => {
    const insights: { type: 'success' | 'info' | 'warning'; text: string }[] = [];
    
    if (totalBuilds === 0) {
      insights.push({
        type: 'info',
        text: 'No indexed builds found. Upload a build file to unlock indexing telemetry.'
      });
      return insights;
    }

    if (topVersion && topVersion.downloadCount > 0) {
      const share = Math.round((topVersion.downloadCount / (totalDownloads || 1)) * 100);
      insights.push({
        type: 'success',
        text: `Version ${topVersion.versionString} is leading with ${topVersion.downloadCount} downloads, representing ${share}% of total user traffic.`
      });
    }

    // Check size inflation
    const sortedByCodeAsc = [...versions].sort((a, b) => a.versionCode - b.versionCode);
    if (sortedByCodeAsc.length >= 2) {
      const earliest = sortedByCodeAsc[0];
      const latest = sortedByCodeAsc[sortedByCodeAsc.length - 1];
      const sizeEarliest = parseSizeToBytes(earliest.fileSize);
      const sizeLatest = parseSizeToBytes(latest.fileSize);

      if (sizeLatest > sizeEarliest) {
        const pct = Math.round(((sizeLatest - sizeEarliest) / sizeEarliest) * 100);
        insights.push({
          type: 'info',
          text: `Binary payload grew by ${pct}% from initial release (v${earliest.versionString}) to current build (v${latest.versionString}) due to features and optimizations.`
        });
      }
    }

    // Clean up suggestion
    const inactiveReleases = versions.filter(v => v.downloadCount < totalDownloads * 0.05 && v.id !== topVersion?.id);
    if (inactiveReleases.length > 0 && versions.length > 3) {
      insights.push({
        type: 'warning',
        text: `Consider deprecating older builds (e.g. v${inactiveReleases[0].versionString}) which represent less than 5% of direct installations.`
      });
    }

    return insights;
  };

  const insightsList = generateInsights();

  // Draw smooth custom SVG Area/Line Chart for downloads
  // We plot points over versions
  const renderSVGChart = () => {
    if (versions.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center text-xs text-slate-500">
          Not enough historical release points to chart.
        </div>
      );
    }

    // Sort chronologically ascending to show progress left-to-right
    const chronoVersions = [...versions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const maxDownloads = Math.max(...chronoVersions.map(v => v.downloadCount), 5);
    
    const width = 600;
    const height = 160;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 20;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Calculate coords
    const points = chronoVersions.map((v, index) => {
      const x = paddingLeft + (chronoVersions.length > 1 ? (index / (chronoVersions.length - 1)) * graphWidth : graphWidth / 2);
      const y = paddingTop + graphHeight - (v.downloadCount / maxDownloads) * graphHeight;
      return { x, y, ver: v };
    });

    const pathD = points.length > 0 
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
      : '';

    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`
      : '';

    return (
      <div className="relative bg-slate-950/40 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Download Traction Velocity (Chronological)</span>
          </div>
          <span className="text-[10px] text-blue-300 font-mono">Max: {maxDownloads} dl</span>
        </div>
        
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + graphHeight / 2} x2={width - paddingRight} y2={paddingTop + graphHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + graphHeight} x2={width - paddingRight} y2={paddingTop + graphHeight} stroke="rgba(255,255,255,0.1)" />

          {/* Area under line */}
          {areaD && <path d={areaD} fill="url(#chartGlow)" />}

          {/* Trend Line */}
          {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Data Nodes */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="2"
                className="transition-all duration-200 group-hover:r-6 group-hover:fill-blue-500"
              />
              {/* Tooltip bubble simulation on hover */}
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="text-[9px] fill-blue-300 font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900"
              >
                v{p.ver.versionString} ({p.ver.downloadCount})
              </text>
              <text
                x={p.x}
                y={paddingTop + graphHeight + 12}
                textAnchor="middle"
                className="text-[8px] fill-slate-500 font-medium"
              >
                v{p.ver.versionString}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-slate-900/20 rounded-3xl border border-white/5 p-4 sm:p-6 mb-8">
      {/* Title with live state */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <span>Interactive Telemetry & Metrics</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time analytics engine tracking installation traffic, server resources, and release cadence.
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono">
            Gateway Engine Active
          </span>
        </div>
      </div>

      {/* Grid of Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Builds */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:border-white/10">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 bg-blue-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Builds</span>
            <Layers className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{totalBuilds}</span>
            <span className="text-[10px] text-blue-400 font-bold">Indexed</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Latest: {versions[0]?.versionString ? `v${versions[0].versionString}` : 'None'}
          </p>
        </div>

        {/* Metric 2: Downloads */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:border-white/10">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 bg-indigo-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Accumulated DLs</span>
            <Download className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {totalDownloads.toLocaleString()}
            </span>
            <span className="text-[10px] text-indigo-400 font-bold">Installs</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Avg: {totalBuilds > 0 ? Math.round(totalDownloads / totalBuilds) : 0} per version
          </p>
        </div>

        {/* Metric 3: Total Size */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:border-white/10">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 bg-purple-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Footprint</span>
            <HardDrive className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{totalSizeFormatted}</span>
            <span className="text-[10px] text-purple-400 font-bold">Storage</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Avg size: {avgSizeFormatted}
          </p>
        </div>

        {/* Metric 4: Trending Build */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:border-white/10">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Version</span>
            <Activity className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-white truncate max-w-[120px]">
              {topVersion ? `v${topVersion.versionString}` : 'None'}
            </span>
            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.2 rounded-md text-emerald-400 font-extrabold">
              Top
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Holds {topVersion ? Math.round((topVersion.downloadCount / (totalDownloads || 1)) * 100) : 0}% download share
          </p>
        </div>
      </div>

      {/* Main Panel Content (Split chart / quick tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Charts and Interactive Tabs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-slate-950/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('traffic')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'traffic'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Traffic Shares
            </button>
            <button
              onClick={() => setActiveTab('trend')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'trend'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📈 Installation Trend
            </button>
          </div>

          {activeTab === 'traffic' ? (
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Version Downloads Contribution
                </span>
                <span className="text-[10px] text-slate-400">Percentage share breakdown</span>
              </div>

              {versions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No data points available yet.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {sortedByDownloads.map((ver, idx) => {
                    const percentage = totalDownloads > 0 ? (ver.downloadCount / totalDownloads) * 100 : 0;
                    return (
                      <div key={ver.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-extrabold text-white">v{ver.versionString}</span>
                            {idx === 0 && (
                              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-1.5 py-0.1 rounded text-[9px] font-bold">
                                MVP
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {ver.downloadCount} dl ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              idx === 0
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                : idx === 1
                                ? 'bg-indigo-500'
                                : 'bg-indigo-500/40'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            renderSVGChart()
          )}
        </div>

        {/* Right Column: Mini Tables / Sorting & Smart AI Insights */}
        <div className="lg:col-span-5 space-y-4">
          {/* Smart Insights Panel */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950/40 p-5 rounded-2xl border border-indigo-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Sparkles className="h-10 w-10 text-indigo-400" />
            </div>
            
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5 mb-3.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Smart Cadence Insights</span>
            </h4>

            <div className="space-y-3">
              {insightsList.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs">
                  <div className="mt-0.5 shrink-0">
                    {insight.type === 'success' ? (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    ) : insight.type === 'warning' ? (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                    ) : (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400" />
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Table / Micro Sort */}
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Release Standings
              </span>
              <div className="flex items-center space-x-1.5">
                <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-white/5 rounded-lg text-[10px] font-bold text-slate-300 px-2 py-1 outline-none cursor-pointer focus:border-indigo-500 transition"
                >
                  <option value="downloads">Sort: DLs</option>
                  <option value="code">Sort: Code</option>
                  <option value="date">Sort: Date</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-white/5 max-h-[140px] overflow-y-auto pr-1">
              {sortedVersionsList.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-slate-500">
                  No versions indexed yet.
                </div>
              ) : (
                sortedVersionsList.map((ver, index) => (
                  <div key={ver.id} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-500 font-mono w-4">
                        #{index + 1}
                      </span>
                      <span className="font-extrabold text-white">v{ver.versionString}</span>
                      <span className="text-[9px] text-slate-500 font-mono bg-white/5 px-1 rounded">
                        ({ver.fileSize})
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
                      <span>{ver.downloadCount} dl</span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(ver.createdAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
