'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { calculationNameFormDataSchema } from '@/schemas';
import { CalculationType, ICalculationNameFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { SquarePen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form } from '../ui/form';

interface RenameCalculationModalProps {
	isOpen: boolean;
	handleClose: () => void;
	handleRename: (data: ICalculationNameFormData) => void;
	activeCalculation: CalculationType | null;
	renameStart: () => void;
}

const RenameCalculationModal = ({
	isOpen,
	handleClose,
	handleRename,
	activeCalculation,
	renameStart,
}: RenameCalculationModalProps) => {
	const form = useForm<ICalculationNameFormData>({
		resolver: zodResolver(calculationNameFormDataSchema),
		defaultValues: {
			name: '',
		},
	});

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (open) {
					form.reset({
						name: activeCalculation?.name,
					});
				} else {
					handleClose();
				}
			}}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							onClick={renameStart}
							variant="ghost"
							size="icon"
							className="h-8 w-8"
						>
							<SquarePen className="h-4 w-4" aria-hidden />

							<span className="sr-only">Rename calculation</span>
						</Button>
					</DialogTrigger>
				</TooltipTrigger>

				<TooltipContent>
					<p>Rename calculation</p>
				</TooltipContent>
			</Tooltip>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename Calculation</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleRename)} className="space-y-4">
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

export default RenameCalculationModal;
