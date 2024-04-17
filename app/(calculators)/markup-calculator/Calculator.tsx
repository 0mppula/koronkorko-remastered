'use client';

import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
import NumberInputWithIcon from '@/components/Form/NumberInputWithIcon';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { markupCalculatorSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import CalculatationReport from './CalculatationReport';

export interface ReportProps {
	profit: number;
	markup: number;
}

const Calculator = () => {
	const [report, setReport] = useState<ReportProps | null>(null);

	const { toast } = useToast();
	const form = useForm<z.infer<typeof markupCalculatorSchema>>({
		resolver: zodResolver(markupCalculatorSchema),
		defaultValues: {
			cost: 0,
			salesPrice: 0,
		},
	});

	const onSubmit = (values: z.infer<typeof markupCalculatorSchema>) => {
		const { salesPrice, cost } = values;

		const profit = salesPrice - cost;
		const markup = (profit / cost) * 100;

		setReport({ profit, markup });
	};

	const resetForm = () => {
		form.reset();
		setReport(null);
		toast({
			description: 'Form cleared',
		});
	};

	return (
		<>
			<FormContainer>
				<FormControlsTop reset={resetForm} />

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
											<NumberInputWithIcon
												{...field}
												iconType="currency"
												name="cost"
												onBlur={(e) => {
													if (e.target.value === '') {
														form.setValue('cost', 0);
													}
												}}
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
											<NumberInputWithIcon
												{...field}
												iconType="currency"
												type="number"
												onBlur={(e) => {
													if (e.target.value === '') {
														form.setValue('salesPrice', 0);
													}
												}}
												name="salesPrice"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Button type="submit" className="w-full">
							Calculate
						</Button>
					</form>
				</Form>
			</FormContainer>

			{report && <CalculatationReport report={report} />}
		</>
	);
};

export default Calculator;
