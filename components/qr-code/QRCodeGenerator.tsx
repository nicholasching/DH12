"use client";

import QRCode from "react-qr-code";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QRCodeGeneratorProps {
  drawingId: string;
  baseUrl?: string;
}

export function QRCodeGenerator({
  drawingId,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const qrUrl = `${baseUrl}/drawing/${drawingId}`;
  const qrData = JSON.stringify({
    type: "drawing",
    drawingId,
    url: qrUrl,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center p-4 -mt-2">
      {/* Title - Raised */}
      <h2 className="text-lg font-bold text-black -mt-1">Draw on Another Device</h2>
      
      {/* Description */}
      {/* <p className="text-xs text-gray-600 text-center leading-tight">
        Edit drawings on another device and see changes as you make them
      </p> */}
      
      {/* QR Code with corner brackets */}
      <div className="relative inline-block p-3 mb-6">
        {/* Corner brackets */}
        <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-black" />
        <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-black" />
        <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-black" />
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-black" />
        
        {/* QR Code */}
        <div className="bg-white p-0">
          <QRCode value={qrData} size={156} />
        </div>
      </div>
      
      {/* Link placeholder */}
      <div className="text-sm text-gray-400 text-center max-w-[260px] truncate">
      </div>
      
      {/* Copy link button */}
      <button
        onClick={handleCopy}
        className="w-full px-4 py-2 bg-gray-200 gap-3 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
