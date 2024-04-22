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
import { MARKUP_CALCULATIONS_API_URL, MARKUP_CALCULATIONS_QUERY_KEY } from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { getCalculations } from '@/lib/queryFns/calculations';
import { markupCalculatorSchema } from '@/schemas';
import { InferredMarkupCalculatorSchema } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { MarkupCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import CalculationReport from './CalculatationReport';

export interface MarkupReportProps {
	profit: number;
	markup: number;
}

const defaultValues: InferredMarkupCalculatorSchema = {
	cost: 0,
	salesPrice: 0,
};

const calculateMarkup = (formData: InferredMarkupCalculatorSchema) => {
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

	const form = useForm<InferredMarkupCalculatorSchema>({
		resolver: zodResolver(markupCalculatorSchema),
		defaultValues,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<MarkupCalculation[] | null>({
		queryKey: [MARKUP_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(MARKUP_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const {
		onCalculate,
		resetForm,
		handleSaveUpdateStart,
		closeSaveModal,
		handleSave,
		handleRename,
		handleClose,
		handleDelete,
		handleImport,
	} = useCalculator<InferredMarkupCalculatorSchema, MarkupReportProps, MarkupCalculation>(
		setReport,
		calculateMarkup,
		defaultValues,
		form,
		activeCalculation,
		MARKUP_CALCULATIONS_API_URL,
		setSaveModalOpen,
		setRenameModalOpen,
		setActiveCalculation,
		setImportModalOpen,
		MARKUP_CALCULATIONS_QUERY_KEY
	);

	return (
		<>
			<SaveCalculationModal
				isOpen={saveModalOpen}
				handleClose={closeSaveModal}
				handleSave={handleSave}
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
				handleRename={handleRename}
				activeCalculation={activeCalculation}
			/>

			<FormContainer>
				<FormControlsTop
					reset={resetForm}
					saveUpdateStart={handleSaveUpdateStart}
					activeCalculation={activeCalculation}
					closeCalculation={handleClose}
					importStart={() => setImportModalOpen(true)}
					renameStart={() => setRenameModalOpen(true)}
				/>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onCalculate)} className="space-y-4">
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
