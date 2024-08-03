'use client';

import ContributionToggleInput from '@/components/Form/ContributionToggleInput';
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
	COMPOUND_INTEREST_CALCULATIONS_API_URL,
	COMPOUND_INTEREST_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import {
	compoundFrequencies,
	contributionFrequencies,
	durationMultipliers,
} from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import { calcualteCoumpoundInterest } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { compoundInterestFormDataSchema } from '@/schemas';
import { CompoundInterestReportProps, ICompoundInterestFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { CompoundInterestCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Breakdown from './Breakdown';
import Report from './Report';

export interface ReportProps {
	report: CompoundInterestReportProps;
}

const defaultValues: ICompoundInterestFormData = {
	startingBalance: 0,
	contribution: 0,
	contributionMultiplier: 1,
	contributionFrequency: 12,
	compoundFrequency: 12,
	interestRate: 0,
	durationMultiplier: 12,
	duration: 0,
};

const Calculator = () => {
	const form = useForm<ICompoundInterestFormData>({
		resolver: zodResolver(compoundInterestFormDataSchema),
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
		ICompoundInterestFormData,
		CompoundInterestReportProps,
		CompoundInterestCalculation
	>({
		apiUrl: COMPOUND_INTEREST_CALCULATIONS_API_URL,
		queryKey: COMPOUND_INTEREST_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calcualteCoumpoundInterest,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<CompoundInterestCalculation[] | null>({
		queryKey: [COMPOUND_INTEREST_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(COMPOUND_INTEREST_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const computedContributionMultiplier = form.watch('contributionMultiplier');

	const setContributionMultiplier = (value: 1 | -1) => {
		form.setValue('contributionMultiplier', value * -1);
	};

	return (
		<>
			<FormContainer>
				<FormControlsTop<ICompoundInterestFormData, CompoundInterestCalculation>
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
								name="startingBalance"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Initial Value</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="startingBalance"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('startingBalance', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FormGroup>

						<FormGroup inline>
							<FormField
								control={form.control}
								name="contribution"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Contributions</FormLabel>

										<FormControl>
											<ContributionToggleInput
												{...field}
												setContributionMultiplier={
													setContributionMultiplier
												}
												contributionMultiplier={
													computedContributionMultiplier as 1 | -1
												}
												name="contribution"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('contribution', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="contributionFrequency"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Contribution Frequency"
											shortLabel="Frequency"
										/>

										<Select
											onValueChange={field.onChange}
											defaultValue={String(field.value)}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a duration type" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{contributionFrequencies.map((multiplier) => (
													<SelectItem
														key={`contributionFrequency-${multiplier.value}`}
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
											defaultValue={String(field.value)}
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
											defaultValue={String(field.value)}
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

			{report && <Breakdown report={report} />}
		</>
	);
};

export default Calculator;
