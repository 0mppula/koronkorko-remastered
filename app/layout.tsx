import Footer from '@/components/Footer.tsx';
import Nav from '@/components/Nav';
import ToTop from '@/components/ToTop';
import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { appName } from '@/constants';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

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
			<body className={cn(poppins.className, 'overflow-y-scroll')}>
				<Providers>
					<Nav />

					<main className="pt-16 flex flex-col min-h-[calc(100vh-3.5rem-1.6px)] max-w-6xl items-center mx-auto px-4 md:px-8 pb-32">
						{children}
					</main>

					<Footer />

					<ToTop />
					<Toaster />
				</Providers>
			</body>
		</html>
	);
}
