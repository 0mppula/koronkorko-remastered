'use client';

import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
import FormGroup from '@/components/Form/FormGroup';
import NumberInputWithIcon from '@/components/Form/NumberInputWithIcon';
import SubmitButton from '@/components/Form/SubmitButton';
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
import { breakEvenPointFormDataSchema } from '@/schemas';
import { BreakEvenPointReportProps, IBreakEvenPointFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { BreakEvenPointCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

const defaultValues: IBreakEvenPointFormData = {
	fixedCosts: 0,
	variableCostPerUnit: 0,
	pricePerUnit: 0,
};

const Calculator = () => {
	const form = useForm<IBreakEvenPointFormData>({
		resolver: zodResolver(breakEvenPointFormDataSchema),
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
		renameModalOpen,
		setRenameModalOpen,
		activeCalculation,
		ifFieldIsEmpty,
		closeRenameModal,
		handleImportStart,
		closeImportModal,
	} = useCalculator<
		IBreakEvenPointFormData,
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
			<FormContainer>
				<FormControlsTop<IBreakEvenPointFormData, BreakEvenPointCalculation>
					reset={resetForm}
					handleSaveUpdateStart={handleSaveUpdateStart}
					activeCalculation={activeCalculation}
					closeCalculation={handleClose}
					renameStart={() => setRenameModalOpen(true)}
					isSaveModalOpen={saveModalOpen}
					handleCloseSaveModal={closeSaveModal}
					handleSave={handleSave}
					isRenameModalOpen={renameModalOpen}
					handleCloseRenameModal={closeRenameModal}
					handleRename={handleRename}
					isImportModalOpen={importModalOpen}
					handleImportStart={handleImportStart}
					handleDelete={handleDelete}
					calculations={calculations}
					isLoading={isCalculationsLoading || isFetching}
					handleImport={handleImport}
					closeImportModal={closeImportModal}
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
													ifFieldIsEmpty(e) &&
														form.setValue('fixedCosts', 0);
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
													ifFieldIsEmpty(e) &&
														form.setValue('variableCostPerUnit', 0);
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
													ifFieldIsEmpty(e) &&
														form.setValue('pricePerUnit', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FormGroup>

						<SubmitButton />
					</form>
				</Form>
			</FormContainer>

			{report && <Report report={report} />}

			<Info />
		</>
	);
};

export default Calculator;
