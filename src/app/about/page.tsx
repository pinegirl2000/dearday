import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata = {
  title: 'About · DearDay',
  description: 'DearDay is a digital invitation service that helps you invite the people who matter most to your dearest day.'
};

export default function AboutPage() {
  return (
    <PageContainer>
      <article className="max-w-2xl mx-auto px-4 py-8 prose-sm prose-hydrangea">
        <h1 className="text-2xl font-serif text-hydrangea-700 mb-4">About DearDay</h1>

        <section className="mb-6">
          <h2 className="text-base font-semibold text-hydrangea-700 mt-6 mb-2">Our mission</h2>
          <p className="text-sm text-hydrangea-600 leading-relaxed">
            DearDay is a digital invitation service for life&rsquo;s most precious moments — weddings,
            birthdays, openings, baptisms, gatherings. We believe sending an invitation should feel
            personal and warm, even when it&rsquo;s digital. Every card you send is a small act of
            inviting someone into a day you care about.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-base font-semibold text-hydrangea-700 mt-6 mb-2">What we offer</h2>
          <ul className="text-sm text-hydrangea-600 leading-relaxed list-disc pl-5 space-y-1">
            <li>Beautiful, mobile-first invitation cards with multiple envelope and background designs</li>
            <li>Personalized links for each recipient</li>
            <li>Real-time RSVP collection with attendee details</li>
            <li>Free to create and share — no card limit during early access</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-base font-semibold text-hydrangea-700 mt-6 mb-2">Who we are</h2>
          <p className="text-sm text-hydrangea-600 leading-relaxed">
            DearDay is built and operated by <strong>Steward+AI</strong>, based in Singapore.
            We&rsquo;re a small team focused on creating thoughtful tools for everyday celebrations.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-base font-semibold text-hydrangea-700 mt-6 mb-2">Get in touch</h2>
          <p className="text-sm text-hydrangea-600 leading-relaxed">
            Questions, feedback, or partnership ideas? Visit our{' '}
            <Link href="/contact" className="text-hydrangea-500 underline">contact page</Link>.
          </p>
        </section>
      </article>
    </PageContainer>
  );
}
