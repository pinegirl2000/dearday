import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { pool } from './db';

/**
 * NextAuth 설정. Google OAuth만 사용.
 * signIn 콜백에서 dearday_user 테이블에 upsert하여 내부 user.id를 session에 노출.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== 'google') return false;
      try {
        await pool.query(
          `INSERT INTO dearday_user (provider, provider_id, email, name, image)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (provider, provider_id)
           DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name, image=EXCLUDED.image`,
          [account.provider, account.providerAccountId, user.email, user.name, user.image]
        );
        return true;
      } catch (e) {
        console.error('signIn upsert error:', e);
        return false;
      }
    },
    async jwt({ token, account }) {
      // 최초 로그인 시 dearday_user.id를 token에 저장
      if (account?.provider === 'google') {
        const { rows } = await pool.query<{ id: string }>(
          'SELECT id FROM dearday_user WHERE provider=$1 AND provider_id=$2',
          [account.provider, account.providerAccountId]
        );
        if (rows[0]) token.uid = rows[0].id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) {
        (session.user as any).id = token.uid;
      }
      return session;
    }
  }
};
