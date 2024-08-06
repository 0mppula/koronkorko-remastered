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
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	DOLLAR_COST_AVERAGE_CALCULATIONS_API_URL,
	DOLLAR_COST_AVERAGE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { compoundFrequencies, depositFrequencies, durationMultipliers } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import { calculateDollarCostAverage } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { dollarCostAverageFormDataSchema } from '@/schemas';
import { DollarCostAverageReportProps, IDollarCostAverageFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarCostAverageCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Report from './Report';

export interface ReportProps {
	report: DollarCostAverageReportProps;
}

const defaultValues: IDollarCostAverageFormData = {
	initialInvestment: 0,
	sharePrice: 0,
	deposit: 0,
	depositFrequency: 30.416666666666666666666666666667,
	interestRate: 0,
	compoundFrequency: 12,
	duration: 0,
	durationMultiplier: 12,
};

const Calculator = () => {
	const form = useForm<IDollarCostAverageFormData>({
		resolver: zodResolver(dollarCostAverageFormDataSchema),
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
		IDollarCostAverageFormData,
		DollarCostAverageReportProps,
		DollarCostAverageCalculation
	>({
		apiUrl: DOLLAR_COST_AVERAGE_CALCULATIONS_API_URL,
		queryKey: DOLLAR_COST_AVERAGE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateDollarCostAverage,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<DollarCostAverageCalculation[] | null>({
		queryKey: [DOLLAR_COST_AVERAGE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(DOLLAR_COST_AVERAGE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IDollarCostAverageFormData, DollarCostAverageCalculation>
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
								name="initialInvestment"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Initial Investment</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="initialInvestment"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('initialInvestment', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

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

						<FormGroup>
							<FormField
								control={form.control}
								name="deposit"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Deposit</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="deposit"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('deposit', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="depositFrequency"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Deposit Frequency"
											shortLabel="Frequency"
										/>

										<Select
											onValueChange={field.onChange}
											value={String(field.value)}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a duration type" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{depositFrequencies.map((multiplier) => (
													<SelectItem
														key={`depositFrequency-${multiplier.value}`}
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

						<FormGroup inline>
							<FormField
								control={form.control}
								name="interestRate"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Annual interest rate"
											shortLabel="Interest rate"
										/>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="interestRate"
												iconType="percentage"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('interestRate', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="compoundFrequency"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Compound Interval"
											shortLabel="Interval"
										/>
										<Select
											onValueChange={field.onChange}
											value={String(field.value)}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a duration type" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{compoundFrequencies.map((multiplier) => (
													<SelectItem
														key={`compoundFrequency-${multiplier.value}`}
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

						<FormGroup inline>
							<FormField
								control={form.control}
								name="duration"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Duration</FormLabel>

										<FormControl>
											<Input
												{...field}
												name="duration"
												placeholder="10"
												step="0.01"
												type="number"
												max={200}
												min={0}
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('duration', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="durationMultiplier"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel label="Duration Type" shortLabel="Type" />

										<Select
											onValueChange={field.onChange}
											value={String(field.value)}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a duration type" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{durationMultipliers.map((multiplier) => (
													<SelectItem
														key={`durationMultiplier-${multiplier.value}`}
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

						<SubmitButton />
					</form>
				</Form>
			</FormContainer>

			{report && <Report report={report} />}
		</>
	);
};

export default Calculator;
