import { notFound } from 'next/navigation';
import { getCardBySlug } from '@/lib/db/cards';
import ManageClient from './_ManageClient';

interface Props {
  params: { slug: string };
}

export default async function ManagePage({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) notFound();

  return <ManageClient slug={card.slug} cardTitle={card.title} cardId={card.id} />;
}
