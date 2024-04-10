import db from '@/lib/db';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth, { AuthOptions } from 'next-auth';
import { Adapter, AdapterUser } from 'next-auth/adapters';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

function CustomPrismaAdapter(p: typeof prisma): Adapter {
	// @ts-ignore
	return {
		// @ts-ignore
		...PrismaAdapter(p),
		async createUser(user) {
			const created = await p?.user.create({
				data: {
					...user,
					preferences: {
						theme: 'system',
						currency: {
							name: 'dollar',
							value: 'usd',
							label: '$',
							locale: 'en-US',
						},
					},
				},
			});

			return created as AdapterUser;
		},
	};
}

export const authOptions: AuthOptions = {
	adapter: CustomPrismaAdapter(db) as Adapter,
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
