import { Suspense } from 'react';
import SinglePageWizard from './_components/SinglePageWizard';
import { getAllTemplateConfigs } from '@/lib/actions/templateConfig';

export const dynamic = 'force-dynamic';

export default async function NewCardPage() {
  // admin이 DB에 저장한 템플릿 설정(allowedLayouts override)을 미리 가져와 wizard에 전달
  const configsMap = await getAllTemplateConfigs();
  const configs: Record<string, string[]> = {};
  configsMap.forEach((v, k) => { configs[k] = v; });
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩...</div>}>
      <SinglePageWizard templateConfigs={configs} />
    </Suspense>
  );
}
