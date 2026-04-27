import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCardBySlug } from '@/lib/db/cards';
import EditCardClient from './_EditCardClient';

interface Props {
  params: { slug: string };
}

export default async function EditCardPage({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) notFound();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩...</div>}>
      <EditCardClient card={card} />
    </Suspense>
  );
}
