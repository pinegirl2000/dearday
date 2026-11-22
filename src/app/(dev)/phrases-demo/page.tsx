import { notFound } from 'next/navigation';
import PhrasesDemoClient from './_PhrasesDemoClient';

export const metadata = { title: 'Phrases QA', robots: { index: false } };

export default function PhrasesDemoPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <PhrasesDemoClient />;
}
