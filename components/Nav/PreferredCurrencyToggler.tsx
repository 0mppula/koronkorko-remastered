'use client';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { currencies } from '@/constants';
import useAuthLoadingStore from '@/hooks/useAuthLoading';
import useCurrencyStore from '@/hooks/useCurrency';
import { updateUserPreferences } from '@/lib/queryFns/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';

const PreferredCurrencyToggler = () => {
	const { currency, setCurrency } = useCurrencyStore();
	const queryClient = useQueryClient();
	const { status: sessionStatus } = useSession();
	const { resolvedTheme } = useTheme();
	const { setIsLoadingUserPreferences } = useAuthLoadingStore();

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

	const handleCurrencyChange = (currencyParam: (typeof currencies)[number]['value']) => {
		if (currencyParam === currency) return;

		setCurrency(currencyParam);

		if (sessionStatus === 'authenticated') {
			mutate({ sessionStatus, theme: resolvedTheme || 'system', currency: currencyParam });
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" suppressHydrationWarning>
					<span className="text-[1.375rem]">
						{currencies.find((c) => c.value === currency)?.symbol}
					</span>

					<span className="sr-only">Set preferred currency</span>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
				{currencies.map((c) => (
					<DropdownMenuItem key={c.value} onClick={(e) => handleCurrencyChange(c.value)}>
						<span className="mr-2">{c.symbol}</span>
						<span>{c.value.toUpperCase()}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default PreferredCurrencyToggler;
