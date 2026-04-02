"use client";

import { useTheme } from "./ThemeContext";

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.33" />
    <path d="M8 1.33V3M8 13V14.67M1.33 8H3M13 8H14.67M3.29 3.29L4.23 4.23M11.77 11.77L12.71 12.71M3.29 12.71L4.23 11.77M11.77 4.23L12.71 3.29" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14 8.54A6 6 0 117.46 2 4.67 4.67 0 0014 8.54z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function TopNav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-[var(--topnav-bg)] border-b border-[var(--topnav-border)] flex items-center justify-between px-4 h-[44px]">
      {/* Left: Logo + Workspace name + chevron */}
      <div className="flex items-center gap-2">
        <div className="w-[20px] h-[20px] bg-[#2b7fff] rounded-[4px] flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-white rounded-[1px]" />
        </div>
        <span className="text-[var(--text-secondary)] text-[14px] font-medium">Nexa</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-[var(--text-label)]">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-[7px]">
        {/* Ask Mia Button */}
        <button className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[6px] flex items-center gap-2 px-3 h-[28px] hover:border-[var(--border-secondary)] transition-all duration-150">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#2dd4bf" strokeWidth="1.5"/>
            <circle cx="8" cy="8" r="2" fill="#2dd4bf"/>
          </svg>
          <span className="text-[var(--text-primary)] text-[12px] font-medium">Ask Mia</span>
        </button>

        {/* Divider */}
        <div className="w-px h-[12px] bg-[var(--border-primary)]" />

        {/* Bell / Notification icon */}
        <button className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[6px] flex items-center justify-center h-[28px] w-[28px] hover:border-[var(--border-secondary)] transition-all duration-150 text-[var(--text-muted)] relative">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M12 5.33C12 4.27 11.58 3.25 10.83 2.5C10.08 1.75 9.06 1.33 8 1.33C6.94 1.33 5.92 1.75 5.17 2.5C4.42 3.25 4 4.27 4 5.33C4 10 2 11.33 2 11.33H14C14 11.33 12 10 12 5.33Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.15 13.33C9.03 13.54 8.86 13.71 8.65 13.83C8.44 13.95 8.21 14.01 7.97 14.01C7.73 14.01 7.5 13.95 7.29 13.83C7.08 13.71 6.91 13.54 6.79 13.33" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* Green notification dot */}
          <div className="absolute top-[5px] right-[5px] w-[3px] h-[3px] bg-[#00e388] rounded-full" />
        </button>

        {/* Divider */}
        <div className="w-px h-[12px] bg-[var(--border-primary)]" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[6px] flex items-center justify-center h-[28px] w-[28px] hover:border-[var(--border-secondary)] transition-all duration-150 text-[var(--text-muted)]"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Avatar + chevron */}
        <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity duration-150">
          <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#027b8e] to-[#012e36] flex items-center justify-center text-white text-[9px] font-semibold">
            A
          </div>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-[var(--text-label)]">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
