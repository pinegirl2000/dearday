import Link from 'next/link';
import { Mail } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

const CONTACT_EMAIL = 'dearday@stewardai.ai';

export const metadata = {
  title: 'Contact · DearDay',
  description: 'Get in touch with the DearDay team.'
};

export default function ContactPage() {
  return (
    <PageContainer>
      <article className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif text-hydrangea-700 mb-4">Contact us</h1>

        <p className="text-sm text-hydrangea-600 leading-relaxed mb-6">
          We&rsquo;d love to hear from you. Whether you have feedback, a question, a partnership idea,
          or a privacy request, send us a message and we&rsquo;ll get back to you within 3 business days.
        </p>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-hydrangea-500 text-white text-sm font-medium shadow active:scale-95 transition"
        >
          <Mail className="w-4 h-4" />
          {CONTACT_EMAIL}
        </a>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-hydrangea-700 mb-2">Operator</h2>
          <p className="text-sm text-hydrangea-600 leading-relaxed">
            Steward+AI<br />
            Singapore<br />
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-hydrangea-700 mb-2">Privacy & data requests</h2>
          <p className="text-sm text-hydrangea-600 leading-relaxed">
            For data access, correction, or deletion requests under Singapore&rsquo;s PDPA, please
            email us with the subject line &ldquo;PDPA request&rdquo;. See our{' '}
            <Link href="/privacy" className="text-hydrangea-500 underline">Privacy Policy</Link>{' '}
            for details.
          </p>
        </section>
      </article>
    </PageContainer>
  );
}
