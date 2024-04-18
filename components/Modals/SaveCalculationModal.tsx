'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { calculationNameSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '../ui/form';

interface SaveCalculationModalProps {
	isOpen: boolean;
	handleClose: () => void;
	save: (data: z.infer<typeof calculationNameSchema>) => void;
}

const SaveCalculationModal = ({ isOpen, handleClose, save }: SaveCalculationModalProps) => {
	const form = useForm<z.infer<typeof calculationNameSchema>>({
		resolver: zodResolver(calculationNameSchema),
		defaultValues: {
			name: '',
		},
	});

	return (
		<Dialog
			open={isOpen}
			onOpenChange={() => {
				form.reset();
				handleClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Save Your Calculation</DialogTitle>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(save)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Calculation name</FormLabel>

										<FormControl>
											<Input placeholder="shadcn" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit">Submit</Button>
						</form>
					</Form>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};

export default SaveCalculationModal;
