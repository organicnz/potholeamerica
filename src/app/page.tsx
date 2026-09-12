import { DualStatusBadge } from '@/components/cases/DualStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_CASES } from '@/server/mock-data';
import { ArrowRight, Eye, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 overflow-hidden border-b border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))]" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl shadow-amber-500/25 bg-slate-950/90 p-1 hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Pothole America Emblem"
                width={112}
                height={112}
                className="w-full h-full object-cover rounded-2xl"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Sacramento County Pilot Launch
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Every pothole becomes a <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              public community case.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-300 font-normal leading-relaxed">
            Not a closed, private 311 ticket. You photograph it, neighbors confirm it, Pothole
            America gets it to the correct government agency, everyone watches what happens, and the
            community—not just the agency—decides whether it was actually fixed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/report">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 font-bold text-base bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xl shadow-amber-500/25"
              >
                Report a Hazard
              </Button>
            </Link>

            <Link href="/map">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-8 font-bold text-base border-slate-700 bg-slate-900 hover:bg-slate-800"
              >
                Explore Public Map →
              </Button>
            </Link>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base mb-1">Crowdsourced Power</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Duplicate reports automatically consolidate into a single strong case with dozens of
              confirmed resident voices.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base mb-1">Dual-Status Visibility</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Government says <span className="text-slate-300 font-mono">CLOSED</span>? If it's
              still broken, the community status shows{' '}
              <span className="text-red-400 font-bold">❌ STILL OPEN</span>.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base mb-1">Community Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cases are only resolved when local residents photograph and verify the actual physical
              repair on the street.
            </p>
          </div>
        </div>
      </section>

      {/* Active Cases Feed */}
      <section className="py-12 px-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100">Live Pilot Cases</h2>
            <p className="text-xs text-slate-400">
              Recent road hazards being tracked in Sacramento
            </p>
          </div>

          <Link
            href="/map"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            View All on Map <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_CASES.map((c) => (
            <Card key={c.id} className="glass-card hover:border-slate-700 transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                    {c.public_id}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    👥 {c.confirmation_count} confirmed
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-slate-100 line-clamp-1">
                  {c.title}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{c.address}</span>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <DualStatusBadge
                    communityStatus={c.community_status}
                    officialStatus={c.official_status}
                  />
                  <Link
                    href={`/case/${c.public_id}`}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300"
                  >
                    Details →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
