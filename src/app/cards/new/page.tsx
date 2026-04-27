import { Suspense } from 'react';
import WizardShell from './_components/WizardShell';

export default function NewCardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩...</div>}>
      <WizardShell />
    </Suspense>
  );
}
