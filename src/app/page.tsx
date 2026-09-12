import { CivicHazardFeed } from '@/components/home/CivicHazardFeed';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pothole America — Public Infrastructure Accountability',
  description:
    'Every pothole becomes an open community case. Browse verified road defects, track city responses, and confirm repairs.',
};

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <CivicHazardFeed />
    </div>
  );
}
