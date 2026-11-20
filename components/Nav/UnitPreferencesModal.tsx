'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { USER_QUERY_KEY } from '@/constants/api';
import useCurrencyStore from '@/hooks/useCurrency';
import useLoadingStore from '@/hooks/useLoadingStore';
import useUnitsStore from '@/hooks/useUnits';
import { updateUserPreferences } from '@/lib/queryFns/auth';
import { getUnitOptions, UnitPreferences, unitQuantities } from '@/lib/units';
import { unitPreferencesSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const UnitPreferencesModal = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { units, setUnits } = useUnitsStore();
	const { currency } = useCurrencyStore();
	const queryClient = useQueryClient();
	const { status: sessionStatus } = useSession();
	const { resolvedTheme } = useTheme();
	const { setIsGlobalLoading } = useLoadingStore();

	const form = useForm<UnitPreferences>({
		resolver: zodResolver(unitPreferencesSchema),
		defaultValues: units,
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
			toast.error(
				'Something went wrong while saving your unit preferences. Please try again'
			);
		},
		onSettled: () => {
			setIsGlobalLoading(false);
		},
	});

	const handleOpenChange = (open: boolean) => {
		if (open) {
			form.reset(units);
		}

		setIsOpen(open);
	};

	const onSubmit = (values: UnitPreferences) => {
		setIsOpen(false);

		if (unitQuantities.every(({ value: quantity }) => values[quantity] === units[quantity])) {
			return;
		}

		setUnits(values);

		if (sessionStatus === 'authenticated') {
			mutate({ sessionStatus, theme: resolvedTheme || 'system', currency, units: values });
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<SlidersHorizontal className="h-[1.25rem] w-[1.25rem]" aria-hidden />

					<span className="sr-only">Set unit preferences</span>
				</Button>
			</DialogTrigger>

			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Unit Preferences</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{unitQuantities.map((quantity) => (
							<FormField
								key={quantity.value}
								control={form.control}
								name={quantity.value}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{quantity.label}</FormLabel>

										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={`Select a ${quantity.value} unit`}
													/>
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{getUnitOptions(quantity.value).map((option) => (
													<SelectItem
														key={`${quantity.value}-${option.value}`}
														value={option.value}
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<FormMessage />
									</FormItem>
								)}
							/>
						))}

						<Button type="submit" className="w-full">
							Save
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default UnitPreferencesModal;
