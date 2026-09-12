import { ReportWizard } from '@/components/report/ReportWizard';

export const metadata = {
  title: 'Report a Road Hazard — Pothole America',
  description:
    'Photograph a road defect, automatically detect duplicates, and publish an open community case.',
};

export default function ReportPage() {
  return (
    <main className="flex-1 flex flex-col justify-center py-6">
      <ReportWizard />
    </main>
  );
}
