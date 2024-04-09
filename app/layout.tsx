import NextSessionProvider from '@/components/providers/NextSessionProvider';
import { Toaster } from '@/components/ui/toaster';
import { appName } from '@/constants';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav/Nav';

const poppins = Poppins({
	weight: ['100', '200', '300', '400', '500', '600', '700'],
	subsets: ['latin'],
	style: ['normal', 'italic'],
});

export const metadata: Metadata = {
	title: `Home - ${appName}`,
	description:
		'KoronKorko is a finance web-application with various types of easy to use finance calculators.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={poppins.className}>
				<main className="pt-16 flex flex-col min-h-[calc(100vh-3.5rem)] max-w-6xl mt-10 items-center mx-auto px-4 sm:px-8 pb-32">
					<NextSessionProvider>
						<Nav />

						{children}

						<Toaster />
					</NextSessionProvider>
				</main>
			</body>
		</html>
	);
}
