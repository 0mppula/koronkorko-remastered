'use client';

import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
import NumberInputWithIcon from '@/components/Form/NumberInputWithIcon';
import SaveCalculationModal from '@/components/Modals/SaveCalculationModal';
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
import useLoadingStore from '@/hooks/useLoadingStore';
import useMarkupalculatorStore from '@/hooks/useMarkupalculatorStore';
import { ISaveCalculationParam, saveCalculation } from '@/lib/queryFns/markup-calculations';
import { calculationNameSchema, markupCalculatorSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { MarkupCalculation } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import CalculatationReport from './CalculatationReport';

export interface ReportProps {
	profit: number;
	markup: number;
}

const Calculator = () => {
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [renameModalOpen, setRenameModalOpen] = useState(false);
	const [report, setReport] = useState<ReportProps | null>(null);

	const { setIsGlobalLoading } = useLoadingStore();
	const { activeCalculation, setActiveCalculation } = useMarkupalculatorStore();
	const { toast } = useToast();

	const form = useForm<z.infer<typeof markupCalculatorSchema>>({
		resolver: zodResolver(markupCalculatorSchema),
		defaultValues: {
			cost: 0,
			salesPrice: 0,
		},
	});

	const { mutate: saveMutation } = useMutation<MarkupCalculation, unknown, ISaveCalculationParam>(
		{
			mutationFn: saveCalculation,
			onMutate: () => {
				setIsGlobalLoading(true);
			},
			onSuccess: (calculation) => {
				toast({
					description: 'Calculation created successfully',
				});
				setActiveCalculation(calculation);
				setSaveModalOpen(false);
			},
			onError: () => {
				toast({
					variant: 'destructive',
					description:
						'Something went wrong while saving your calculation. Please try again later.',
				});
			},
			onSettled: () => {
				setIsGlobalLoading(false);
			},
		}
	);

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

	const handleSaveUpdateStart = () => {
		if (activeCalculation) {
			// update
			console.log('Update calculation');
		} else {
			setSaveModalOpen(true);
		}
	};

	const closeSaveModal = () => {
		setSaveModalOpen(false);
	};

	const handleSave = (data: z.infer<typeof calculationNameSchema>) => {
		saveMutation({ name: data.name, data: form.getValues() });
	};

	return (
		<>
			<SaveCalculationModal
				isOpen={saveModalOpen}
				handleClose={closeSaveModal}
				save={handleSave}
			/>

			<FormContainer>
				<FormControlsTop reset={resetForm} handleSaveUpdateStart={handleSaveUpdateStart} />

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
