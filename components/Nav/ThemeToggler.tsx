'use client';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useCurrencyStore from '@/hooks/useCurrency';
import { updateUserPreferences } from '@/lib/queryFns/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';

const ThemeToggler = () => {
	const { currency } = useCurrencyStore();
	const queryClient = useQueryClient();
	const { status: sessionStatus } = useSession();
	const { theme, setTheme } = useTheme();

	const { mutate } = useMutation({
		mutationFn: updateUserPreferences,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['user'] });
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
					<Sun className="h-[1.375rem] w-[1.375rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-[1.375rem] w-[1.375rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => handleThemeChange('light')}>
					<Sun className="mr-2 h-[1.125rem] w-[1.125rem]" /> Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleThemeChange('dark')}>
					<Moon className="mr-2 h-[1.125rem] w-[1.125rem]" /> Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleThemeChange('system')}>
					<Laptop className="mr-2 h-[1.125rem] w-[1.125rem]" /> System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ThemeToggler;
