'use client';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { USER_QUERY_KEY, currencies } from '@/constants';
import useCurrencyStore from '@/hooks/useCurrency';
import useLoadingStore from '@/hooks/useLoadingStore';
import { updateUserPreferences } from '@/lib/queryFns/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const PreferredCurrencyToggler = () => {
	const { currency, setCurrency } = useCurrencyStore();
	const queryClient = useQueryClient();
	const { status: sessionStatus } = useSession();
	const { resolvedTheme } = useTheme();
	const { setIsGlobalLoading } = useLoadingStore();

	const { mutate } = useMutation({
		mutationFn: updateUserPreferences,
		onMutate: () => {
			setIsGlobalLoading(true);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
		},
		onError: () => {
			toast.error(
				'Something went wrong while saving your currency preferences. Please try again'
			);
		},
		onSettled: () => {
			setIsGlobalLoading(false);
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
