import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata = {
  title: 'Privacy Policy · DearDay',
  description: 'How DearDay collects, uses, and protects your personal information.'
};

const LAST_UPDATED = 'May 3, 2026';

export default function PrivacyPage() {
  return (
    <PageContainer>
      <article className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif text-hydrangea-700 mb-2">Privacy Policy</h1>
        <p className="text-xs text-hydrangea-400 mb-6">Last updated: {LAST_UPDATED}</p>

        <p className="text-sm text-hydrangea-600 leading-relaxed mb-6">
          DearDay (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the website at dearday.sg. This Privacy
          Policy explains how we collect, use, store, and protect your personal information in
          compliance with Singapore&rsquo;s Personal Data Protection Act (PDPA) 2012.
        </p>

        <Section title="1. Information we collect">
          <p>When you use DearDay, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Account information</strong>: name, email address, profile picture (via Google OAuth)</li>
            <li><strong>Invitation content</strong>: titles, dates, places, messages, recipient names you enter</li>
            <li><strong>RSVP responses</strong>: attendance status, attendee names, replies submitted by recipients</li>
            <li><strong>Usage data</strong>: page views, device type, browser, approximate location (via Vercel Analytics and Google Analytics, if enabled)</li>
          </ul>
        </Section>

        <Section title="2. How we use your information">
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and deliver your invitations and process RSVPs</li>
            <li>To authenticate you and protect your account</li>
            <li>To improve site performance and user experience</li>
            <li>To communicate service updates or critical notices</li>
            <li>To display relevant advertising via Google AdSense (see Section 5)</li>
          </ul>
        </Section>

        <Section title="3. Data sharing">
          <p>We do not sell your personal information. We share data only with the following service providers:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Google</strong> — for authentication and (optionally) advertising</li>
            <li><strong>Supabase</strong> — database and storage hosting (region: ap-southeast-1, Singapore)</li>
            <li><strong>Vercel</strong> — application hosting and analytics</li>
          </ul>
          <p className="mt-2">Each provider has its own privacy policy and data handling practices.</p>
        </Section>

        <Section title="4. Data retention">
          <p>
            We keep your account and invitation data while your account is active. You may delete
            individual invitations at any time from the management page. Deleting an invitation
            also removes all related recipients and RSVP records.
          </p>
        </Section>

        <Section title="5. Cookies and advertising">
          <p>
            We use essential cookies for authentication and language preference. We may use Google
            AdSense to display ads on public pages (excluding individual invitation pages). Google
            and its partners may use cookies to serve ads based on prior visits to our site or other
            sites. You can opt out of personalized advertising at{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer"
               className="text-hydrangea-500 underline">Google Ads Settings</a>.
          </p>
        </Section>

        <Section title="6. Your rights (PDPA)">
          <p>Under Singapore&rsquo;s PDPA, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Request access to the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Withdraw consent and request deletion of your data</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us via the{' '}
            <Link href="/contact" className="text-hydrangea-500 underline">contact page</Link>.
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We use HTTPS for all traffic, encrypted database connections, and OAuth-based
            authentication. While we apply industry-standard safeguards, no online service is
            completely secure — please use a strong account on Google for protection.
          </p>
        </Section>

        <Section title="8. Children&rsquo;s privacy">
          <p>
            DearDay is not intended for children under 13. We do not knowingly collect data from
            children. If you believe a child has provided us with personal data, please contact us
            for removal.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at the top
            reflects the most recent change. Material changes will be communicated via the site or
            email.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            For questions about this Privacy Policy, please use our{' '}
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
