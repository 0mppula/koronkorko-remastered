'use client';

import { currencies } from '@/constants';
import useCurrencyStore from '@/hooks/useCurrency';
import { User } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { PropsWithChildren, useEffect, useState } from 'react';
import LargeSpinner from '../Spinners/LargeSpinner';
import { toast } from '../ui/use-toast';

const getUser = async (
	sessionStatus: 'loading' | 'authenticated' | 'unauthenticated'
): Promise<User | null> => {
	if (sessionStatus !== 'authenticated') {
		return null;
	}

	try {
		const response = await axios.get('/api/auth');
		const data = await response.data;

		return data.data;
	} catch (error) {
		toast({
			variant: 'destructive',
			description: 'Something went wrong while fetching your info. Please try again later.',
		});

		return null;
	}
};

const updateUserPreferences = async (variables: {
	sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
	theme: string;
	currency: string;
}) => {
	if (variables.sessionStatus !== 'authenticated') {
		return null;
	}

	try {
		const response = await axios.put('/api/auth/preferences', {
			theme: variables.theme,
			currency: variables.currency,
		});
		const data = await response.data;

		return data.data;
	} catch (error) {}
};

const UserPreferencesProvider = ({ children }: PropsWithChildren) => {
	const [isLoadingUserPreferences, setIsLoadingUserPreferences] = useState(false);

	const { resolvedTheme, setTheme } = useTheme();
	const { status: sessionStatus } = useSession();
	const { currency, setCurrency } = useCurrencyStore();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery<User | null>({
		queryKey: ['user'],
		queryFn: () => getUser(sessionStatus),
	});

	const { mutate } = useMutation({
		mutationFn: updateUserPreferences,
		onMutate: () => {
			setIsLoadingUserPreferences(true);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['user'] });
		},
		onSettled: () => {
			setIsLoadingUserPreferences(false);
		},
	});

	useEffect(() => {
		if (sessionStatus === 'authenticated') {
			queryClient.invalidateQueries({ queryKey: ['user'] });
		}
	}, [sessionStatus]);

	// If the user doesnt have preferences yet, set them to match the current theme and currency.
	useEffect(() => {
		if (data?.preferences?.currency && data?.preferences?.theme) return;

		mutate({
			sessionStatus,
			theme: resolvedTheme || 'system',
			currency: currency,
		});
	}, [data?.preferences]);

	// Override the theme and currency with the user's preferences.
	useEffect(() => {
		if (data?.preferences?.theme) {
			setTheme(data.preferences.theme);
		}

		if (data?.preferences?.currency) {
			setCurrency(data.preferences.currency as (typeof currencies)[number]['value']);
		}
	}, [data?.preferences]);

	return (
		<>
			{(isLoading || sessionStatus === 'loading' || isLoadingUserPreferences) && (
				<LargeSpinner />
			)}

			{children}
		</>
	);
};

export default UserPreferencesProvider;
