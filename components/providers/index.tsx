'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';

const Providers = ({ children }: PropsWithChildren) => {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<SessionProvider>{children}</SessionProvider>
		</ThemeProvider>
	);
};

export default Providers;
