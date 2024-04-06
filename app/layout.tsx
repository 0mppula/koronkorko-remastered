import NextSessionProvider from '@/components/providers/NextSessionProvider';
import { Toaster } from '@/components/ui/toaster';
import { appName } from '@/constants';
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
		<html lang="en">
			<NextSessionProvider>
				<body className={poppins.className}>
					{children}

					<Toaster />
				</body>
			</NextSessionProvider>
		</html>
	);
}
