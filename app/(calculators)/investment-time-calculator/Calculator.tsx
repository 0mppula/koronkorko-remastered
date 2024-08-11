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
	INVESTMENT_TIME_CALCULATIONS_API_URL,
	INVESTMENT_TIME_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { calculateInvestmentTime } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { investmentTimeFormDataSchema } from '@/schemas';
import { IInvestmentTimeFormData, InvestmentTimeReportProps } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvestmentTimeCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

const defaultValues: IInvestmentTimeFormData = {
	startingBalance: 0,
	endingBalance: 0,
	annualInterestRate: 0,
};

const Calculator = () => {
	const form = useForm<IInvestmentTimeFormData>({
		resolver: zodResolver(investmentTimeFormDataSchema),
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
		IInvestmentTimeFormData,
		InvestmentTimeReportProps,
		InvestmentTimeCalculation
	>({
		apiUrl: INVESTMENT_TIME_CALCULATIONS_API_URL,
		queryKey: INVESTMENT_TIME_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateInvestmentTime,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<InvestmentTimeCalculation[] | null>({
		queryKey: [INVESTMENT_TIME_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(INVESTMENT_TIME_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	// Reset starting and ending balance errors when they have been corrected.
	const handleOnChangeText = (
		e: ChangeEvent<HTMLInputElement>,
		onChange: (...event: string[]) => void
	) => {
		onChange(e.target.value);

		if (
			form.getValues('startingBalance') < form.getValues('endingBalance') &&
			form.formState.isSubmitted
		) {
			form.trigger(['startingBalance', 'endingBalance']);
		}
	};

	return (
		<>
			<FormContainer>
				<FormControlsTop<IInvestmentTimeFormData, InvestmentTimeCalculation>
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
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													handleOnChangeText(e, field.onChange)
												}
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
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													handleOnChangeText(e, field.onChange)
												}
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

						<FormGroup>
							<FormField
								control={form.control}
								name="annualInterestRate"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Annual interest rate</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="annualInterestRate"
												iconType="percentage"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('annualInterestRate', 0);
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
