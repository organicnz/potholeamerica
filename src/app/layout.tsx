import { NavHeader } from '@/components/navigation/NavHeader';
import type { Metadata } from 'next';
import Image from 'next/image';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pothole America — Public Infrastructure Accountability',
  description:
    'Every pothole becomes an open community case—not a private 311 ticket. Neighbors confirm, cities respond, and the community verifies the fix.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.png', sizes: '128x128', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        <NavHeader />

        {/* Content Body */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Footer */}
        <footer className="glass-panel border-t border-slate-800/60 py-8 px-6 text-center text-xs text-slate-500">
          <div className="max-w-xl mx-auto flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Pothole America Logo"
                width={28}
                height={28}
                className="rounded-lg border border-amber-500/30"
              />
              <span className="font-bold text-slate-300 text-sm tracking-tight">
                Pothole America
              </span>
            </div>
            <p className="leading-relaxed">
              Not for emergencies. If a road defect poses immediate physical danger, call 911.
              Pothole America is an independent open civic platform modeled for community-verified
              public accountability.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
