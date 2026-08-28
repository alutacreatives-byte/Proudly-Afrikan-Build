import React from 'react';
import { Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'resources';
  setActiveTab: (tab: 'studio' | 'resources') => void;
  savedCount: number;
  onNavigateToSection?: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  onNavigateToSection,
}) => {
  const handleNavClick = (sectionId: string) => {
    setActiveTab('studio');
    if (onNavigateToSection) {
      setTimeout(() => onNavigateToSection(sectionId), 50);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="w-full select-none pt-2 sm:pt-3 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* Top Editorial Ticker Bar matching screenshot */}
      <div className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-mono-code font-bold text-stone-800 pb-2.5 px-2 tracking-wider uppercase">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#181716] inline-block shrink-0"></span>
          <span className="tracking-wide">PROUDLY AFRIKAN EDUCATION</span>
          <span className="text-stone-400 font-light">|</span>
          <span className="text-stone-700 font-medium">TOOL 02: THE AI RESOURCE BUILDER</span>
        </div>
      </div>

      {/* Floating 3D Clay Navbar matching screenshot */}
      <div className="w-full clay-navbar px-4 sm:px-6 py-2.5 sm:py-3 transition-all">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo & Crest */}
          <div
            onClick={() => {
              setActiveTab('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Crimson Rounded Shield Badge with Logo & 3D bevel */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-b from-[#E6425E] to-[#C92A45] rounded-xl flex items-center justify-center p-1.5 shadow-[0_6px_14px_rgba(201,42,69,0.35),inset_0_1.5px_1.5px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
              <img
                src="https://sifisos.com/wp-content/uploads/2026/04/Proudly-Afrikan-Logoz.png"
                alt="Proudly Afrikan Logo"
                className="w-full h-full object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <h1 className="font-display font-black text-base sm:text-xl text-[#181716] tracking-tight uppercase leading-none">
                PROUDLY AFRIKAN
              </h1>
              <p className="font-mono-code text-[9px] sm:text-[10px] font-bold text-stone-600 tracking-wider uppercase mt-0.5">
                RESOURCE GENERATOR
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Text Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono-code font-bold uppercase tracking-wider text-stone-800">
              <button
                type="button"
                onClick={() => handleNavClick('builder-modes')}
                className="hover:text-[#D63651] transition cursor-pointer"
              >
                Builder
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('how-it-works')}
                className="hover:text-[#D63651] transition cursor-pointer"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('faq-section')}
                className="hover:text-[#D63651] transition cursor-pointer"
              >
                FAQ
              </button>
            </nav>

            {/* [ SAVED (X) ] 3D Pill Button */}
            <button
              id="nav-saved"
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 text-xs font-mono-code font-bold uppercase cursor-pointer flex items-center gap-1.5 transition ${
                activeTab === 'resources'
                  ? 'clay-btn-dark'
                  : 'clay-pill-3d text-[#181716]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-stone-700" />
              <span>SAVED ({savedCount})</span>
            </button>

            {/* Solid 3D Crimson [ MAKE RESOURCE ↗ ] Pill Button */}
            <button
              id="nav-make-resource"
              onClick={() => {
                setActiveTab('studio');
                handleNavClick('builder-modes');
              }}
              className="clay-btn-crimson px-5 py-2 text-xs font-mono-code font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <span>MAKE RESOURCE</span>
              <span className="text-sm font-black">↗</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
