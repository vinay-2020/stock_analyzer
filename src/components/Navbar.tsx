import React, { useState } from 'react';
import {
  TrendingDown,
  Activity,
  Layers,
  Zap,
  Sparkles,
  Database,
  BarChart2,
  Sliders,
  ShieldCheck,
  Compass,
  PieChart,
  Building2,
  TrendingUp,
  ChevronDown,
  FileCheck,
  Settings,
} from 'lucide-react';

export type ActiveResearchTab =
  | 'stocks'
  | 'sectors'
  | 'industries'
  | 'indices'
  | 'rsi'
  | 'ema'
  | 'cagr'
  | 'crisis'
  | 'divergence'
  | 'confluence'
  | 'validation'
  | 'audit'
  | 'ai_research';

interface NavbarProps {
  activeTab: ActiveResearchTab;
  onSelectTab: (tab: ActiveResearchTab) => void;
  universeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  universeCount,
}) => {
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  // PRIMARY DISPLAY TABS (Clean & Simple)
  const primaryTabs: { id: ActiveResearchTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'stocks',
      label: 'Stocks',
      icon: <Database className="w-4 h-4 text-emerald-400" />,
      badge: `${universeCount}`,
    },
    {
      id: 'sectors',
      label: 'Sectors',
      icon: <Building2 className="w-4 h-4 text-blue-400" />,
      badge: '18',
    },
    {
      id: 'industries',
      label: 'Industries',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      badge: '93',
    },
    {
      id: 'indices',
      label: 'Indices',
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      badge: '29',
    },
    {
      id: 'rsi',
      label: 'RSI Rebound',
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'ema',
      label: 'EMA Support',
      icon: <Sliders className="w-4 h-4 text-orange-400" />,
    },
    {
      id: 'cagr',
      label: 'CAGR Engine',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      badge: '15Y/10Y',
    },
  ];

  // SECONDARY / ON-DEMAND TABS
  const secondaryTabs: { id: ActiveResearchTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'crisis',
      label: '4-Cycle Crisis Engine',
      icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
      desc: 'NIFTY historical crash drawdowns & recovery timelines',
    },
    {
      id: 'confluence',
      label: 'Confluence & Targets',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      desc: 'Multi-factor composite scoring (+10% to +80% hit rates)',
    },
    {
      id: 'divergence',
      label: 'RSI Divergence',
      icon: <BarChart2 className="w-4 h-4 text-indigo-400" />,
      desc: 'Regular and Hidden bullish divergence detection',
    },
    {
      id: 'validation',
      label: 'Validation Test (3 Stocks)',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      desc: 'Hypothesis testing on 20MICRONS, ASTRAMICRO, APOLLO',
    },
    {
      id: 'audit',
      label: 'Data Governance Audit',
      icon: <FileCheck className="w-4 h-4 text-cyan-400" />,
      desc: 'Canonical dataset integrity & provenance verification',
    },
    {
      id: 'ai_research',
      label: 'AI Research Interpreter',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      desc: 'Ground-truth analytical interpretation via Gemini',
    },
  ];

  const isSecondaryActive = secondaryTabs.some((t) => t.id === activeTab);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Research Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-extrabold text-white tracking-tight">
                  HISTORICAL RESEARCH ENGINE
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                  1,120 Equities
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Historical Stock Opportunity & Rebound Research Engine · Code Calculates. AI Interprets. Human Decides.
              </div>
            </div>
          </div>

          {/* Secondary On-Demand Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isSecondaryActive
                  ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Advanced Research & Audit</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showSecondaryMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-2 z-50 divide-y divide-slate-800">
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Secondary / On-Demand Modules
                  </div>
                  {secondaryTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onSelectTab(tab.id);
                        setShowSecondaryMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition flex items-start gap-2.5 ${
                        activeTab === tab.id
                          ? 'bg-purple-950/60 text-purple-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="mt-0.5">{tab.icon}</div>
                      <div>
                        <div className="font-semibold">{tab.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{tab.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PRIMARY DISPLAY NAVIGATION TABS */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-800/60">
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onSelectTab(tab.id);
                  setShowSecondaryMenu(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${
                      isActive
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
