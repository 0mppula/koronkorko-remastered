'use client';

import DynamicFormLabel from '@/components/Form/DynamicFormLabel';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	DIVIDEND_YIELD_CALCULATIONS_API_URL,
	DIVIDEND_YIELD_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { contributionFrequencies } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import { calculateDividendYield } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { dividendYieldFormDataSchema } from '@/schemas';
import { DividendYieldReportProps, IDividendYieldFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { DividendYieldCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Report from './Report';
import Info from './Info';

const defaultValues: IDividendYieldFormData = {
	distributionFrequency: 1,
	dividendAmount: 0,
	sharePrice: 0,
};

const Calculator = () => {
	const form = useForm<IDividendYieldFormData>({
		resolver: zodResolver(dividendYieldFormDataSchema),
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
	} = useCalculator<IDividendYieldFormData, DividendYieldReportProps, DividendYieldCalculation>({
		apiUrl: DIVIDEND_YIELD_CALCULATIONS_API_URL,
		queryKey: DIVIDEND_YIELD_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateDividendYield,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<DividendYieldCalculation[] | null>({
		queryKey: [DIVIDEND_YIELD_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(DIVIDEND_YIELD_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IDividendYieldFormData, DividendYieldCalculation>
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
								name="dividendAmount"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Dividend Amount</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="dividendAmount"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('dividendAmount', 0);
												}}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="distributionFrequency"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Distribution Frequency"
											shortLabel="Frequency"
										/>

										<Select
											onValueChange={field.onChange}
											value={String(field.value)}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a distribution type" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{contributionFrequencies.map((multiplier) => (
													<SelectItem
														key={`distributionFrequency-${multiplier.value}`}
														value={String(multiplier.value)}
													>
														{multiplier.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FormGroup>

						<FormGroup>
							<FormField
								control={form.control}
								name="sharePrice"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Share Price</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="sharePrice"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('sharePrice', 0);
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
