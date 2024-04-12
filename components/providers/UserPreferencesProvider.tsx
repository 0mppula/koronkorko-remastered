'use client';

import { currencies } from '@/constants';
import useAuthLoadingStore from '@/hooks/useAuthLoading';
import useCurrencyStore from '@/hooks/useCurrency';
import { getUser, updateUserPreferences } from '@/lib/queryFns/auth';
import { User } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { PropsWithChildren, useEffect } from 'react';
import LargeSpinner from '../Spinners/LargeSpinner';

const UserPreferencesProvider = ({ children }: PropsWithChildren) => {
	const { theme, setTheme } = useTheme();
	const { status: sessionStatus } = useSession();
	const { currency, setCurrency } = useCurrencyStore();
	const { isLoadingUserPreferences, setIsLoadingUserPreferences } = useAuthLoadingStore();
	const queryClient = useQueryClient();

	const { data, isLoading, isFetching } = useQuery<User | null>({
		queryKey: ['user', { sessionStatus }],
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

	// If the user doesnt have preferences yet, set them to match the current theme and currency.
	useEffect(() => {
		if (data?.preferences?.currency && data?.preferences?.theme) return;

		mutate({
			sessionStatus,
			theme: theme || 'system',
			currency,
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
			{(isLoading ||
				isFetching ||
				sessionStatus === 'loading' ||
				isLoadingUserPreferences) && <LargeSpinner />}

			{children}
		</>
	);
};

export default UserPreferencesProvider;
