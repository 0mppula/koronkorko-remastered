'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';
import UserPreferencesProvider from './UserPreferencesProvider';

const queryClient = new QueryClient();

const Providers = ({ children }: PropsWithChildren) => {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<SessionProvider>
					<UserPreferencesProvider>{children}</UserPreferencesProvider>
				</SessionProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
};

export default Providers;
