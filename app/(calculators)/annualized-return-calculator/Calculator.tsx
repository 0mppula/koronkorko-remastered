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
	ANNUALIZED_RETURN_CALCULATIONS_API_URL,
	ANNUALIZED_RETURN_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { durationMultipliers } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import { calculateAnnualizedReturn } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { annualizedReturnFormDataSchema } from '@/schemas';
import { AnnualizedReturnReportProps, IAnnualizedReturnFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnnualizedReturnCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

const defaultValues: IAnnualizedReturnFormData = {
	startingBalance: 0,
	endingBalance: 0,
	duration: 0,
	durationMultiplier: 12,
};

const Calculator = () => {
	const form = useForm<IAnnualizedReturnFormData>({
		resolver: zodResolver(annualizedReturnFormDataSchema),
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
		IAnnualizedReturnFormData,
		AnnualizedReturnReportProps,
		AnnualizedReturnCalculation
	>({
		apiUrl: ANNUALIZED_RETURN_CALCULATIONS_API_URL,
		queryKey: ANNUALIZED_RETURN_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateAnnualizedReturn,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<AnnualizedReturnCalculation[] | null>({
		queryKey: [ANNUALIZED_RETURN_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(ANNUALIZED_RETURN_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IAnnualizedReturnFormData, AnnualizedReturnCalculation>
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

							<FormField
								control={form.control}
								name="endingBalance"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Ending Value</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="endingBalance"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('endingBalance', 0);
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

			<Info />
		</>
	);
};

export default Calculator;
