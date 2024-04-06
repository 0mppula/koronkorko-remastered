'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface NextSessionProviderProps {
	children: React.ReactNode;
}

const NextSessionProvider = ({ children }: NextSessionProviderProps) => {
	return <SessionProvider>{children}</SessionProvider>;
};

export default NextSessionProvider;
