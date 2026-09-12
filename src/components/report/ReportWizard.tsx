'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CaseRecord } from '@/types/database.types';
import { AlertTriangle, ArrowRight, Camera, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DuplicateCandidate {
  id: string;
  public_id: string;
  address: string;
  confirmation_count: number;
}

export function ReportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [address, setAddress] = useState('Broadway & 21st St, Sacramento, CA');
  const [lat] = useState(38.57283);
  const [lng] = useState(-121.48291);
  const [severity, setSeverity] = useState<'MINOR' | 'SIGNIFICANT' | 'DANGEROUS'>('SIGNIFICANT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Handle Photo Selection & EXIF extraction simulation
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    // Auto-advance to Step 2 (Location Confirmation)
    setStep(2);
  };

  // Step 2 -> Step 3: Check Proximity Duplicates
  const handleLocationNext = async () => {
    try {
      const res = await fetch(`/api/cases/nearby?lat=${lat}&lng=${lng}&radius=300`);
      const json = await res.json();
      const nearby: CaseRecord[] = json.data || [];

      if (nearby.length > 0) {
        setDuplicates(
          nearby.map((c) => ({
            id: c.id,
            public_id: c.public_id,
            address: c.address,
            confirmation_count: c.confirmation_count,
          }))
        );
        setStep(3); // Show duplicate detection
      } else {
        setStep(4); // Skip to publish details
      }
    } catch {
      setStep(4);
    }
  };

  // Step 4: Final Submit
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Reported Road Defect',
          description,
          lat,
          lng,
          address,
          severity,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.public_id) {
        router.push(`/case/${json.data.public_id}`);
      } else {
        router.push('/map');
      }
    } catch (err) {
      console.error('Publish error:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 p-0.5 shadow-md">
          <Image
            src="/logo.png"
            alt="Pothole America Logo"
            width={32}
            height={32}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <span className="font-extrabold text-slate-200 tracking-tight text-sm">
          Pothole America Field Report
        </span>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 text-xs font-semibold text-slate-400">
        <span className={step >= 1 ? 'text-amber-400' : ''}>1. Photo</span>
        <span>→</span>
        <span className={step >= 2 ? 'text-amber-400' : ''}>2. Location</span>
        <span>→</span>
        <span className={step >= 3 ? 'text-amber-400' : ''}>3. Validation</span>
        <span>→</span>
        <span className={step >= 4 ? 'text-amber-400' : ''}>4. Publish</span>
      </div>

      {/* Screen 1: Photo Capture */}
      {step === 1 && (
        <Card className="border-slate-800 bg-slate-900/90 text-center py-8">
          <CardHeader>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Camera className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-100">
              Photograph the Hazard
            </CardTitle>
            <CardDescription className="text-slate-400">
              Take a clear picture showing the defect and street context. GPS coordinates will be
              extracted automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow-lg shadow-amber-500/20 transition-all">
              <Camera className="w-5 h-5 mr-2" />
              Take or Upload Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {/* Screen 2: Location Confirmation */}
      {step === 2 && (
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
              <MapPin className="w-4 h-4" /> Detected Location
            </div>
            <CardTitle className="text-xl font-bold text-slate-100">
              Confirm Road Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {photoPreview && (
              <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-800 relative mb-4">
                <img
                  src={photoPreview}
                  alt="Captured hazard"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <label
                htmlFor="address-input"
                className="text-xs font-semibold text-slate-400 block mb-1"
              >
                Street Address
              </label>
              <input
                id="address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleLocationNext}
                className="flex-1 gap-2 font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                Next: Check Duplicates <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screen 3: Duplicate Detection */}
      {step === 3 && (
        <Card className="border-amber-500/30 bg-slate-900/90 shadow-2xl">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-100">
              Someone may have already reported this!
            </CardTitle>
            <CardDescription className="text-slate-300">
              Instead of scattering complaints across multiple tickets, joining an existing case
              increases civic pressure on the city.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {duplicates.map((dup) => (
              <div
                key={dup.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex justify-between items-center"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {dup.public_id}
                  </span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{dup.address}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    👥 {dup.confirmation_count} neighbors confirm
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(`/case/${dup.public_id}`)}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs"
                >
                  Join Case
                </Button>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">This is a different problem?</span>
              <Button variant="outline" size="sm" onClick={() => setStep(4)}>
                Continue New Report →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screen 4: Severity, Description & Publish */}
      {step === 4 && (
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-100">
              Case Details & Severity
            </CardTitle>
            <CardDescription className="text-slate-400">
              This case will be immediately published to the community and queued for agency
              routing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Severity Level
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['MINOR', 'SIGNIFICANT', 'DANGEROUS'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      severity === lvl
                        ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="title-input"
                className="text-xs font-semibold text-slate-300 block mb-1"
              >
                Headline Summary
              </label>
              <input
                id="title-input"
                type="text"
                required
                placeholder="e.g. Deep wheel-bending pothole on eastbound lane"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label
                htmlFor="description-input"
                className="text-xs font-semibold text-slate-300 block mb-1"
              >
                Additional Details (Optional)
              </label>
              <textarea
                id="description-input"
                rows={3}
                placeholder="Any context regarding traffic hazard, bike lanes, or duration..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <Button
              onClick={handlePublish}
              disabled={submitting || !title}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 mt-4"
            >
              {submitting ? 'Publishing Public Case...' : 'Publish Public Case'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
