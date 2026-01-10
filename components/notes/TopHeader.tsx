"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Menu, Share2 } from "lucide-react";
import { useState } from "react";

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const { user } = useUser();
  const [showShareMenu, setShowShareMenu] = useState(false);

  return (
    <header className="h-14 bg-gray-100 border-b border-gray-300 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          aria-label="Menu"
        >
          <Menu size={20} className="text-gray-700" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
          {showShareMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-30">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Share Note
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Export PDF
              </button>
            </div>
          )}
        </div>

        <div className="w-8 h-8 flex items-center justify-center">
          <UserButton 
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}

