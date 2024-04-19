'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { calculationNameSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { MarkupCalculation } from '@prisma/client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '../ui/form';

interface RenameCalculationModalProps {
	isOpen: boolean;
	handleClose: () => void;
	edit: (data: z.infer<typeof calculationNameSchema>) => void;
	activeCalculation: MarkupCalculation | null;
}

const RenameCalculationModal = ({
	isOpen,
	handleClose,
	edit,
	activeCalculation,
}: RenameCalculationModalProps) => {
	const form = useForm<z.infer<typeof calculationNameSchema>>({
		resolver: zodResolver(calculationNameSchema),
		defaultValues: {
			name: '',
		},
	});

	useEffect(() => {
		if (isOpen) {
			form.reset({
				name: activeCalculation?.name,
			});
		}
	}, [isOpen, form]);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename Calculation</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(edit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Calculation name</FormLabel>

									<FormControl>
										<Input placeholder="Calculation name" {...field} />
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
