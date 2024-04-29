'use client';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { USER_QUERY_KEY } from '@/constants/api';
import useCurrencyStore from '@/hooks/useCurrency';
import useLoadingStore from '@/hooks/useLoadingStore';
import { updateUserPreferences } from '@/lib/queryFns/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const ThemeToggler = () => {
	const { currency } = useCurrencyStore();
	const queryClient = useQueryClient();
	const { status: sessionStatus } = useSession();
	const { theme, setTheme } = useTheme();
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
				'Something went wrong while saving your theme preferences. Please try again'
			);
		},
		onSettled: () => {
			setIsGlobalLoading(false);
		},
	});

	const handleThemeChange = (themeParam: string) => {
		if (themeParam === theme) return;

		setTheme(themeParam);

		if (sessionStatus === 'authenticated') {
			mutate({ sessionStatus, theme: themeParam, currency });
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" suppressHydrationWarning>
					<Sun
						aria-hidden
						className="h-[1.375rem] w-[1.375rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
					/>
					<Moon
						aria-hidden
						className="absolute h-[1.375rem] w-[1.375rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
					/>
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => handleThemeChange('light')}>
					<Sun aria-hidden className="mr-2 h-[1.125rem] w-[1.125rem]" /> Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleThemeChange('dark')}>
					<Moon aria-hidden className="mr-2 h-[1.125rem] w-[1.125rem]" /> Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleThemeChange('system')}>
					<Laptop aria-hidden className="mr-2 h-[1.125rem] w-[1.125rem]" /> System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ThemeToggler;
