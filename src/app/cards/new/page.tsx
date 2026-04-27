import { Suspense } from 'react';
import SinglePageWizard from './_components/SinglePageWizard';

export default function NewCardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩...</div>}>
      <SinglePageWizard />
    </Suspense>
  );
}
