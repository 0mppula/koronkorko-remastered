'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { calculationNameSchema } from '@/schemas';
import { InferredCalculationNameSchema } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from '../ui/form';

interface SaveCalculationModalProps {
	isOpen: boolean;
	handleClose: () => void;
	handleSave: (data: InferredCalculationNameSchema) => void;
}

const SaveCalculationModal = ({ isOpen, handleClose, handleSave }: SaveCalculationModalProps) => {
	const form = useForm<InferredCalculationNameSchema>({
		resolver: zodResolver(calculationNameSchema),
		defaultValues: {
			name: '',
		},
	});

	useEffect(() => {
		if (isOpen) {
			form.reset();
		}
	}, [isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
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
