import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata = {
  title: 'Terms of Service · DearDay',
  description: 'Terms governing your use of the DearDay digital invitation service.'
};

const LAST_UPDATED = 'May 3, 2026';

export default function TermsPage() {
  return (
    <PageContainer>
      <article className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif text-hydrangea-700 mb-2">Terms of Service</h1>
        <p className="text-xs text-hydrangea-400 mb-6">Last updated: {LAST_UPDATED}</p>

        <p className="text-sm text-hydrangea-600 leading-relaxed mb-6">
          By accessing or using DearDay (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of
          Service. Please read them carefully.
        </p>

        <Section title="1. Service description">
          <p>
            DearDay is a digital invitation platform that allows users to create, share, and manage
            event invitations and RSVPs. The Service is provided as-is, with ongoing improvements
            during early access.
          </p>
        </Section>

        <Section title="2. Account">
          <p>
            You must sign in with a valid Google account to create invitations. You are responsible
            for keeping your account secure. You may not share, sell, or transfer your account.
          </p>
        </Section>

        <Section title="3. User content">
          <p>
            You retain ownership of the content you create (titles, messages, photos, recipient lists).
            By using DearDay, you grant us a limited, non-exclusive license to host, display, and
            distribute your content solely to operate the Service (e.g., showing your invitation to
            recipients you choose).
          </p>
          <p className="mt-2">
            You agree not to upload content that is illegal, offensive, infringes copyrights, or
            violates the privacy of others.
          </p>
        </Section>

        <Section title="4. Acceptable use">
          <p>You may not:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Use the Service to send spam or unsolicited communications</li>
            <li>Attempt to access or interfere with other users&rsquo; data</li>
            <li>Reverse engineer, scrape, or copy the Service for commercial reuse</li>
            <li>Upload malicious files or scripts</li>
          </ul>
        </Section>

        <Section title="5. Free service & changes">
          <p>
            The Service is currently free during early access. We may introduce paid plans, usage
            limits, or feature changes in the future. Any major changes will be announced in advance.
          </p>
        </Section>

        <Section title="6. Disclaimer">
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee
            uninterrupted availability, accuracy, or that data will never be lost. Always keep your
            own copy of important information (event details, guest lists).
          </p>
        </Section>

        <Section title="7. Limitation of liability">
          <p>
            To the fullest extent permitted by law, DearDay and Steward+AI shall not be liable for
            any indirect, incidental, or consequential damages arising from your use of the Service,
            including (but not limited to) missed RSVPs, lost data, or third-party actions.
          </p>
        </Section>

        <Section title="8. Data retention & automatic deletion">
          <p>
            <strong>Cards are kept only from the day they are created until the event date,
            and are automatically deleted afterwards.</strong> For cards without an event date
            (thank/congrats), the card and its associated data (recipients, RSVPs, uploaded images)
            are deleted 30 days after creation. Once deleted, data cannot be recovered. Always keep
            your own copy of any information you may need later (guest names, RSVP results).
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            You may delete your invitations at any time from the management page. We may suspend or
            terminate accounts that violate these Terms or applicable law.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These Terms are governed by the laws of Singapore. Disputes shall be resolved in the
            courts of Singapore.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these Terms? Visit our{' '}
            <Link href="/contact" className="text-hydrangea-500 underline">contact page</Link>.
          </p>
        </Section>
      </article>
    </PageContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 text-sm text-hydrangea-600 leading-relaxed">
      <h2 className="text-base font-semibold text-hydrangea-700 mb-2">{title}</h2>
      {children}
    </section>
  );
}
