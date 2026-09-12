'use client';

import { Button } from '@/components/ui/button';
import { client } from '@/lib/api-client';
import { Check, Users } from 'lucide-react';
import { useState, useTransition } from 'react';

export function ConfirmButton({
  caseId,
  initialCount,
}: {
  caseId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (confirmed || isPending) return;

    // Optimistic increment
    setConfirmed(true);
    setCount((prev) => prev + 1);

    startTransition(async () => {
      try {
        const res = await client.api.cases[':id'].confirm.$post({
          param: { id: caseId },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.confirmation_count) {
            setCount(data.confirmation_count);
          }
        }
      } catch (err) {
        console.error('Failed to confirm case:', err);
        // Rollback on network failure
        setConfirmed(false);
        setCount((prev) => prev - 1);
      }
    });
  };

  return (
    <Button
      variant={confirmed ? 'secondary' : 'default'}
      size="default"
      onClick={handleConfirm}
      disabled={confirmed || isPending}
      className="gap-2 font-semibold shadow-md"
    >
      {confirmed ? <Check className="w-4 h-4 text-emerald-400" /> : <Users className="w-4 h-4" />}
      <span>
        {count} {count === 1 ? 'Resident Confirmed' : 'Residents Confirm'}
      </span>
      {!confirmed && <span className="opacity-75">— I See This Too</span>}
    </Button>
  );
}
