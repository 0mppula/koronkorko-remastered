'use client';

import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
import FormGroup from '@/components/Form/FormGroup';
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
import {
	BREAK_EVEN_POINT_CALCULATIONS_API_URL,
	BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { calcualteBreakEvenPoint } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { breakEvenPointCalculatorSchema } from '@/schemas';
import { InferredBreakEvenPointCalculatorSchema } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { BreakEvenPointCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Report from './Report';

export interface BreakEvenPointReportProps {
	breakEvenPointUnits: number;
	breakEvenPointMoney: number;
	contributionMarginMoney: number;
	contributionMarginPercent: number;
}

const defaultValues: InferredBreakEvenPointCalculatorSchema = {
	fixedCosts: 0,
	variableCostPerUnit: 0,
	pricePerUnit: 0,
};

const Calculator = () => {
	const form = useForm<InferredBreakEvenPointCalculatorSchema>({
		resolver: zodResolver(breakEvenPointCalculatorSchema),
		defaultValues,
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
		report,
		saveModalOpen,
		importModalOpen,
		setImportModalOpen,
		renameModalOpen,
		setRenameModalOpen,
		activeCalculation,
	} = useCalculator<
		InferredBreakEvenPointCalculatorSchema,
		BreakEvenPointReportProps,
		BreakEvenPointCalculation
	>({
		apiUrl: BREAK_EVEN_POINT_CALCULATIONS_API_URL,
		queryKey: BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calcualteBreakEvenPoint,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<BreakEvenPointCalculation[] | null>({
		queryKey: [BREAK_EVEN_POINT_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(BREAK_EVEN_POINT_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<SaveCalculationModal
				isOpen={saveModalOpen}
				handleClose={closeSaveModal}
				handleSave={handleSave}
			/>

			<ImportCalculationModal<
				InferredBreakEvenPointCalculatorSchema,
				BreakEvenPointCalculation
			>
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
						<FormGroup>
							<FormField
								control={form.control}
								name="fixedCosts"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Fixed Costs</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="fixedCosts"
												onBlur={(e) => {
													if (e.target.value === '') {
														form.setValue('fixedCosts', 0);
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
								name="variableCostPerUnit"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Variable Cost Per Unit</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="variableCostPerUnit"
												onBlur={(e) => {
													if (e.target.value === '') {
														form.setValue('variableCostPerUnit', 0);
													}
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FormGroup>

						<FormGroup>
							<FormField
								control={form.control}
								name="pricePerUnit"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Price Per Unit</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="pricePerUnit"
												onBlur={(e) => {
													if (e.target.value === '') {
														form.setValue('pricePerUnit', 0);
													}
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FormGroup>

						<Button type="submit" className="w-full">
							Calculate
						</Button>
					</form>
				</Form>
			</FormContainer>

			{report && <Report report={report} />}
		</>
	);
};

export default Calculator;
