"use client";

import { QRCodeSVG } from "react-qr-code";
import { useState } from "react";

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
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <QRCodeSVG value={qrData} size={256} />
      <div className="text-sm text-gray-600 break-all max-w-xs text-center">
        {qrUrl}
      </div>
      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {copied ? "Copied!" : "Copy URL"}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Scan this QR code on your drawing device to open the drawing board
      </p>
    </div>
  );
}
