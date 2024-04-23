import db from '@/lib/db';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { AuthOptions, getServerSession } from 'next-auth';
import { Adapter } from 'next-auth/adapters';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
	adapter: PrismaAdapter(db) as Adapter,
	providers: [
		GitHubProvider({
			clientId: process.env.GITHUB_ID as string,
			clientSecret: process.env.GITHUB_SECRET as string,
		}),
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		}),
	],
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	callbacks: {
		async jwt({ token }) {
			const db_user = await db.user.findFirst({
				where: {
					email: token?.email as string,
				},
			});

			if (db_user) {
				token.id = db_user.id;
			}

			return token;
		},
		async session({ token, session }) {
			if (token) {
				session.user.id = token.id;
				session.user.name = token.name;
				session.user.email = token.email;
				session.user.image = token.picture;
			}

			return session;
		},
	},
	debug: process.env.NODE_ENV === 'development',
	secret: process.env.NEXTAUTH_SECRET as string,
	pages: { signIn: '/' },
};

export const getAuthSession = () => {
	return getServerSession(authOptions);
};
