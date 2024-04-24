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
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	PRESENT_VALUE_CALCULATIONS_API_URL,
	PRESENT_VALUE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { durationMultipliers } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import { calculatePresentValue } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { presentValueFormDataSchema } from '@/schemas';
import { IPresentValueFormData, PresentValueReportProps } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { PresentValueCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Report from './Report';

const defaultValues: IPresentValueFormData = {
	startingBalance: 0,
	discountRate: 0,
	duration: 0,
	durationMultiplier: 12,
};

const Calculator = () => {
	const form = useForm<IPresentValueFormData>({
		resolver: zodResolver(presentValueFormDataSchema),
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
	} = useCalculator<IPresentValueFormData, PresentValueReportProps, PresentValueCalculation>({
		apiUrl: PRESENT_VALUE_CALCULATIONS_API_URL,
		queryKey: PRESENT_VALUE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculatePresentValue,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<PresentValueCalculation[] | null>({
		queryKey: [PRESENT_VALUE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(PRESENT_VALUE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IPresentValueFormData, PresentValueCalculation>
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
										<FormLabel>Future Value</FormLabel>

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
								name="discountRate"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Discount Rate</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="discountRate"
												iconType="percentage"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('discountRate', 0);
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
								name="duration"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Duration</FormLabel>

										<FormControl>
											<Input
												{...field}
												name="duration"
												placeholder="10"
												type="number"
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
										<FormLabel>Duration Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={String(field.value)}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a verified email to display" />
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
