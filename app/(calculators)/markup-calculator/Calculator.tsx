'use client';

import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
import NumberInputWithIcon from '@/components/Form/NumberInputWithIcon';
import ImportCalculationModal from '@/components/Modals/ImportCalculationModal';
import RenameCalculationModal from '@/components/Modals/RenameCalculationModal';
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
import { MARKUP_CALCULATIONS_QUERY_KEY } from '@/constants';
import useLoadingStore from '@/hooks/useLoadingStore';
import {
	ISaveCalculationParam,
	deleteCalculation,
	getCalculations,
	renameCalculation,
	saveCalculation,
	updateCalculation,
} from '@/lib/queryFns/markup-calculations';
import { calculationNameSchema, markupCalculatorSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { MarkupCalculation } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import CalculationReport from './CalculatationReport';

export interface MarkupReportProps {
	profit: number;
	markup: number;
}

const defaultValues: z.infer<typeof markupCalculatorSchema> = {
	cost: 0,
	salesPrice: 0,
};

const calculateMarkup = (formData: z.infer<typeof markupCalculatorSchema>) => {
	const { cost, salesPrice } = formData;

	const profit = salesPrice - cost;
	const markup = (profit / cost) * 100;

	return { profit, markup };
};

const Calculator = () => {
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [renameModalOpen, setRenameModalOpen] = useState(false);
	const [activeCalculation, setActiveCalculation] = useState<MarkupCalculation | null>(null);
	const [report, setReport] = useState<MarkupReportProps | null>(null);

	const queryClient = useQueryClient();
	const { setIsGlobalLoading } = useLoadingStore();
	const { toast } = useToast();

	const form = useForm<z.infer<typeof markupCalculatorSchema>>({
		resolver: zodResolver(markupCalculatorSchema),
		defaultValues,
	});

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<MarkupCalculation[]>({
		queryKey: [MARKUP_CALCULATIONS_QUERY_KEY],
		queryFn: getCalculations,
	});

	const { mutate: saveMutation } = useMutation<MarkupCalculation, unknown, ISaveCalculationParam>(
		{
			mutationFn: saveCalculation,
			onMutate: () => {
				setIsGlobalLoading(true);
			},
			onSuccess: (calculation) => {
				toast({ description: 'Calculation created' });
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
				queryClient.invalidateQueries({ queryKey: [MARKUP_CALCULATIONS_QUERY_KEY] });
			},
		}
	);

	const { mutate: deleteMutation } = useMutation<MarkupCalculation, unknown, string>({
		mutationFn: deleteCalculation,
		onMutate: (id) => {
			const prevCalculations: MarkupCalculation[] | undefined = queryClient.getQueryData([
				MARKUP_CALCULATIONS_QUERY_KEY,
			]);

			queryClient.setQueryData<MarkupCalculation[]>(
				[MARKUP_CALCULATIONS_QUERY_KEY],
				(old) => {
					return old?.filter((record) => record.id !== id);
				}
			);

			return { prevCalculations };
		},
		onSuccess: (variables) => {
			toast({ description: 'Calculation deleted' });

			if (activeCalculation?.id === variables.id) {
				setActiveCalculation(null);
				setReport(null);
			}
		},
		onError: () => {
			toast({
				variant: 'destructive',
				description:
					'Something went wrong while deleting your calculation. Please try again later.',
			});

			queryClient.invalidateQueries({ queryKey: [MARKUP_CALCULATIONS_QUERY_KEY] });
		},
	});

	const { mutate: renameMutation } = useMutation({
		mutationFn: renameCalculation,
		onMutate(variables) {
			const prevCalculations: MarkupCalculation[] | undefined = queryClient.getQueryData([
				MARKUP_CALCULATIONS_QUERY_KEY,
			]);

			const uneditedCalculation = prevCalculations?.find(
				(record) => record.id === variables.id
			);

			queryClient.setQueryData<MarkupCalculation[]>(
				[MARKUP_CALCULATIONS_QUERY_KEY],
				(old) => {
					if (!old) return;

					const index = old.findIndex((record) => record.id === variables.id);

					old.splice(index, 1, variables);

					return old;
				}
			);

			setActiveCalculation(variables);
			setRenameModalOpen(false);

			return { uneditedCalculation };
		},
		onSuccess: () => {
			toast({ description: 'Calculation renamed' });
		},
		onError: (err, _, context) => {
			toast({
				variant: 'destructive',
				description:
					'Something went wrong while renaming your calculation. Please try again later.',
			});

			setActiveCalculation(context?.uneditedCalculation || null);
			setRenameModalOpen(true);

			queryClient.invalidateQueries({ queryKey: [MARKUP_CALCULATIONS_QUERY_KEY] });
		},
	});

	const { mutate: updateMutation } = useMutation({
		mutationFn: updateCalculation,
		onMutate(variables) {
			const prevCalculations: MarkupCalculation[] | undefined = queryClient.getQueryData([
				MARKUP_CALCULATIONS_QUERY_KEY,
			]);

			const uneditedCalculation = prevCalculations?.find(
				(record) => record.id === variables.id
			);

			queryClient.setQueryData<MarkupCalculation[]>(
				[MARKUP_CALCULATIONS_QUERY_KEY],
				(old) => {
					if (!old) return;

					const index = old.findIndex((record) => record.id === variables.id);

					old.splice(index, 1, variables);

					return old;
				}
			);

			setActiveCalculation(variables);
			setRenameModalOpen(false);

			return { uneditedCalculation };
		},
		onSuccess: () => {
			toast({ description: 'Calculation updated' });
		},
		onError: (err, _, context) => {
			toast({
				variant: 'destructive',
				description:
					'Something went wrong while saving your calculation. Please try again later.',
			});

			setActiveCalculation(context?.uneditedCalculation || null);

			queryClient.invalidateQueries({ queryKey: [MARKUP_CALCULATIONS_QUERY_KEY] });
		},
	});

	const onSubmit = (values: z.infer<typeof markupCalculatorSchema>) => {
		setReport(calculateMarkup(values));
	};

	const resetForm = () => {
		setReport(null);
		toast({ description: 'Form cleared' });
		form.reset(defaultValues);
	};

	const handleSaveUpdateStart = () => {
		if (activeCalculation) {
			updateMutation({ ...activeCalculation, formData: form.getValues() });
		} else {
			setSaveModalOpen(true);
		}
	};

	const closeSaveModal = () => {
		setSaveModalOpen(false);
	};

	const handleSave = (data: z.infer<typeof calculationNameSchema>) => {
		saveMutation({ name: data.name, formData: form.getValues() });
	};

	const handleEdit = (data: z.infer<typeof calculationNameSchema>) => {
		if (!activeCalculation) return;
		renameMutation({ ...activeCalculation, name: data.name });
	};

	const handleDelete = (id: string) => {
		deleteMutation(id);
	};

	const handleCloseCalculation = () => {
		setActiveCalculation(null);
		setReport(null);
		form.reset(defaultValues);
		toast({
			description: 'Calculation closed',
		});
	};

	const handleImport = (calculation: MarkupCalculation) => {
		const { formData, name } = calculation;

		setActiveCalculation(calculation);
		toast({ description: `${name} imported` });
		setImportModalOpen(false);
		setReport(calculateMarkup(formData));

		form.reset(formData);
	};

	return (
		<>
			<SaveCalculationModal
				isOpen={saveModalOpen}
				handleClose={closeSaveModal}
				save={handleSave}
			/>

			<ImportCalculationModal
				isOpen={importModalOpen}
				setImportModalOpen={setImportModalOpen}
				handleDelete={handleDelete}
				calculations={calculations}
				isLoading={isCalculationsLoading || isFetching}
				handleImport={handleImport}
			/>

			<RenameCalculationModal
				isOpen={renameModalOpen}
				handleClose={() => setRenameModalOpen(false)}
				edit={handleEdit}
				activeCalculation={activeCalculation}
			/>

			<FormContainer>
				<FormControlsTop
					reset={resetForm}
					saveUpdateStart={handleSaveUpdateStart}
					activeCalculation={activeCalculation}
					handleCloseCalculation={handleCloseCalculation}
					importCalculationStart={() => setImportModalOpen(true)}
					rename={() => setRenameModalOpen(true)}
				/>

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

			{report && <CalculationReport report={report} />}
		</>
	);
};

export default Calculator;
