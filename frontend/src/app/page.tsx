import { Suspense } from 'react';
import { CommandCenterPage } from '@/views/command-center';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
      <CommandCenterPage />
    </Suspense>
  );
}
