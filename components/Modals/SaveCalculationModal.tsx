'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FREE_PLAN_CALCULATION_LIMIT } from '@/constants/data';
import { cn } from '@/lib/utils';
import { calculationNameFormDataSchema } from '@/schemas';
import { ICalculationNameFormData, IHasFormDataAndName } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { FieldValues, useForm } from 'react-hook-form';
import { ImSpinner8 } from 'react-icons/im';
import { Form } from '../ui/form';

interface SaveCalculationModalProps<TCalculation> {
	isOpen: boolean;
	calculations?: TCalculation[] | null;
	handleClose: () => void;
	handleSave: (data: ICalculationNameFormData) => void;
	handleSaveUpdateStart: () => void;
	saveLoading: boolean;
}

const SaveCalculationModal = <
	TFormData extends FieldValues,
	TCalculation extends IHasFormDataAndName<TFormData>
>({
	isOpen,
	calculations,
	handleClose,
	handleSave,
	handleSaveUpdateStart,
	saveLoading,
}: SaveCalculationModalProps<TCalculation>) => {
	const session = useSession();
	const form = useForm<ICalculationNameFormData>({
		resolver: zodResolver(calculationNameFormDataSchema),
		defaultValues: {
			name: '',
		},
	});

	const calculationCount = calculations?.length ?? 0;

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (open) {
					form.reset();
				} else {
					handleClose();
				}
			}}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							onClick={handleSaveUpdateStart}
							variant="ghost"
							size="icon"
							className="h-8 w-8"
						>
							{saveLoading ? (
								<ImSpinner8 className="h-4 w-4 animate-spin" />
							) : (
								<Save className="h-4 w-4" aria-hidden />
							)}

							<span className="sr-only">Save calculation</span>
						</Button>
					</DialogTrigger>
				</TooltipTrigger>

				<TooltipContent>
					<p>Save calculation</p>
				</TooltipContent>
			</Tooltip>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Save Calculation</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Calculation name</FormLabel>

									<FormControl>
										<Input
											placeholder="Calculation name"
											{...field}
											maxLength={30}
										/>
									</FormControl>

									{session.data?.user.plan !== 'premium' && (
										<FormDescription
											className={cn(
												'text-success',
												calculationCount >= FREE_PLAN_CALCULATION_LIMIT &&
													'text-destructive'
											)}
										>
											Saves left{' '}
											{FREE_PLAN_CALCULATION_LIMIT - calculationCount === 0
												? 0
												: FREE_PLAN_CALCULATION_LIMIT - calculationCount}
										</FormDescription>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-center items-end gap-4">
							<Button
								onClick={handleClose}
								type="button"
								variant="secondary"
								className="basis-1/2"
							>
								Cancel
							</Button>

							<Button type="submit" className="basis-1/2">
								Save
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default SaveCalculationModal;
