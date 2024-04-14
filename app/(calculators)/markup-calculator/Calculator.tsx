'use client';

import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { markupCalculatorSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface CalculatorProps {}

const Calculator = ({}: CalculatorProps) => {
	const form = useForm<z.infer<typeof markupCalculatorSchema>>({
		resolver: zodResolver(markupCalculatorSchema),
		defaultValues: {
			cost: 0,
			salesPrice: 0,
		},
	});

	function onSubmit(values: z.infer<typeof markupCalculatorSchema>) {
		console.log(values);
	}

	return (
		<FormContainer>
			<FormControlsTop />

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<div className="flex flex-col xs:flex-row gap-4">
						<FormField
							control={form.control}
							name="cost"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Cost</FormLabel>

									<FormControl>
										<Input
											{...field}
											name="cost"
											onBlur={(e) => form.setValue('cost', 0)}
											type="number"
											step="0.01"
											placeholder="1000"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="salesPrice"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Sales Price</FormLabel>

									<FormControl>
										<Input
											{...field}
											type="number"
											onBlur={() => form.setValue('salesPrice', 0)}
											name="salesPrice"
											step="0.01"
											placeholder="1000"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Button type="submit" className="w-full">
						Submit
					</Button>
				</form>
			</Form>
		</FormContainer>
	);
};

export default Calculator;
