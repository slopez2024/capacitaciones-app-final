'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
  url: string;
  size?: number;
  title?: string;
}

export default function QRDisplay({ url, size = 200, title }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {title && <p className="text-sm text-slate-500 font-medium">{title}</p>}
      <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#ffffff"
          fgColor="#1e1b4b"
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-xs text-slate-400 break-all text-center max-w-xs">
        {url}
      </p>
    </div>
  );
}
