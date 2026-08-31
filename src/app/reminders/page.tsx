import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listReminders, getReminderOptIn } from '@/lib/actions/reminders';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import RemindersClient from './_RemindersClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RemindersPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <PageContainer noPadding>
        <MobileHeader title="Reminders" back />
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-hydrangea-400 mb-4">Sign in to manage your reminders.</p>
          <Link
            href="/cards"
            className="inline-block px-5 py-2.5 rounded-full bg-hydrangea-500 text-white text-sm font-medium"
          >
            Sign in
          </Link>
        </div>
      </PageContainer>
    );
  }

  const [reminders, optIn] = await Promise.all([
    listReminders(),
    getReminderOptIn()
  ]);

  return (
    <PageContainer noPadding>
      <MobileHeader title="Reminders" back />
      <RemindersClient initialReminders={reminders} initialOptIn={optIn} />
    </PageContainer>
  );
}
