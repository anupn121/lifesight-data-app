"use client";

export default function TopNav() {
  return (
    <div className="bg-black border-b border-[#1d2939] flex items-center justify-between px-4 h-[51px]">
      {/* Left: Workspace */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#2b7fff] rounded shadow-sm flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white rounded-[1px]" />
          </div>
          <span className="text-[#e5e7eb] text-sm font-medium tracking-[-0.15px]">
            Nexa
          </span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#667085]">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Ask Mia Button */}
        <button className="bg-[#f9fafb] border border-[#d0d5dd] rounded-md flex items-center gap-2 px-3.5 py-1.5 h-8 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#6932ef" strokeWidth="1.5"/>
            <circle cx="8" cy="8" r="2" fill="#6932ef"/>
          </svg>
          <span className="text-[#1d2939] text-sm font-medium">Ask Mia</span>
        </button>

        {/* Inbox Button */}
        <div className="relative">
          <button className="bg-[#f9fafb] border border-[#d0d5dd] rounded-md flex items-center gap-2 px-3.5 py-1.5 h-8 hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8H10.6667L9.33333 10H6.66667L5.33333 8H2" stroke="#344054" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.63333 3.40667L2 8V12C2 12.3536 2.14048 12.6928 2.39052 12.9428C2.64057 13.1929 2.97971 13.3333 3.33333 13.3333H12.6667C13.0203 13.3333 13.3594 13.1929 13.6095 12.9428C13.8595 12.6928 14 12.3536 14 12V8L12.3667 3.40667C12.2793 3.14624 12.1122 2.92208 11.889 2.76474C11.6658 2.6074 11.3981 2.52448 11.1247 2.52667H4.87533C4.60187 2.52448 4.33421 2.6074 4.11101 2.76474C3.88782 2.92208 3.72068 3.14624 3.63333 3.40667Z" stroke="#344054" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#1d2939] text-sm font-medium">2 Unread</span>
          </button>
          <div className="absolute top-1 left-[17px] w-[5px] h-[5px] bg-[#f04438] rounded-full" />
        </div>

        {/* Separator */}
        <div className="w-px h-3 bg-white/10" />

        {/* Avatar */}
        <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-purple-400 to-blue-500 border border-white/20" />
      </div>
    </div>
  );
}
