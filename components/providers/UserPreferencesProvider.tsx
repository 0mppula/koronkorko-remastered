'use client';

import { USER_QUERY_KEY } from '@/constants/api';
import { currencies, themes } from '@/constants/data';
import useCurrencyStore from '@/hooks/useCurrency';
import useLoadingStore from '@/hooks/useLoadingStore';
import useUnitsStore from '@/hooks/useUnits';
import { getUser, updateUserPreferences } from '@/lib/queryFns/auth';
import { withDefaultUnitPreferences } from '@/lib/units';
import { User } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { PropsWithChildren, useEffect } from 'react';
import { toast } from 'sonner';
import LargeSpinner from '../Spinners/LargeSpinner';

const isValidTheme = (value?: string | null): value is (typeof themes)[number] =>
	themes.some((t) => t === value);

const isValidCurrency = (value?: string | null): value is (typeof currencies)[number]['value'] =>
	currencies.some((c) => c.value === value);

const UserPreferencesProvider = ({ children }: PropsWithChildren) => {
	const { theme, setTheme } = useTheme();
	const { status: sessionStatus } = useSession();
	const { currency, setCurrency } = useCurrencyStore();
	const { units, setUnits } = useUnitsStore();
	const { isGlobalLoading, setIsGlobalLoading } = useLoadingStore();
	const queryClient = useQueryClient();

	const { data, isLoading, isFetching } = useQuery<User | null>({
		queryKey: [USER_QUERY_KEY, { sessionStatus }],
		queryFn: () => getUser(sessionStatus),
		enabled: sessionStatus === 'authenticated',
		refetchOnWindowFocus: false,
	});

	const { mutate } = useMutation({
		mutationFn: updateUserPreferences,
		onMutate: () => {
			setIsGlobalLoading(true);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
		},
		onError: () => {
			toast.error('Something went wrong while fetching your info. Please try again later.');
		},
		onSettled: () => {
			setIsGlobalLoading(false);
		},
	});

	// Fill in missing preferences, keeping valid stored values and falling back to local ones.
	useEffect(() => {
		const storedTheme = data?.preferences?.theme;
		const storedCurrency = data?.preferences?.currency;

		if (storedCurrency && storedTheme && data?.preferences?.units) return;

		mutate({
			sessionStatus,
			theme: isValidTheme(storedTheme) ? storedTheme : theme || 'system',
			currency: isValidCurrency(storedCurrency) ? storedCurrency : currency,
			units,
		});
	}, [data?.preferences]);

	// Override the local preferences with the user's valid stored preferences.
	useEffect(() => {
		const storedTheme = data?.preferences?.theme;
		const storedCurrency = data?.preferences?.currency;

		if (isValidTheme(storedTheme)) {
			setTheme(storedTheme);
		}

		if (isValidCurrency(storedCurrency)) {
			setCurrency(storedCurrency);
		}

		if (data?.preferences?.units) {
			setUnits(withDefaultUnitPreferences(data.preferences.units));
		}
	}, [data?.preferences]);

	return (
		<>
			{(isLoading || isFetching || sessionStatus === 'loading' || isGlobalLoading) && (
				<LargeSpinner />
			)}

			{children}
		</>
	);
};

export default UserPreferencesProvider;
