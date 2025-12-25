import { Suspense } from 'react';
import ViewerClient from './ViewerClient';

export default function ViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">Loading IFC Viewer...</div>
      }
    >
      <ViewerClient />
    </Suspense>
  );
}

