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
	PRICE_TO_EARNINGS_RATIO_CALCULATIONS_API_URL,
	PRICE_TO_EARNINGS_RATIO_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { calculateEarningsPerShare } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { priceToEarningsRatioFormDataSchema } from '@/schemas';
import {
	IPriceToEarningsRatioFormData,
	PriceToEarningsRatioReportProps,
} from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { PriceToEarningsRatioCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Report from './Report';

const defaultValues: IPriceToEarningsRatioFormData = {
	sharePrice: 0,
	earningsPerShare: 0,
};

const Calculator = () => {
	const form = useForm<IPriceToEarningsRatioFormData>({
		resolver: zodResolver(priceToEarningsRatioFormDataSchema),
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
		IPriceToEarningsRatioFormData,
		PriceToEarningsRatioReportProps,
		PriceToEarningsRatioCalculation
	>({
		apiUrl: PRICE_TO_EARNINGS_RATIO_CALCULATIONS_API_URL,
		queryKey: PRICE_TO_EARNINGS_RATIO_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateEarningsPerShare,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<PriceToEarningsRatioCalculation[] | null>({
		queryKey: [PRICE_TO_EARNINGS_RATIO_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(PRICE_TO_EARNINGS_RATIO_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IPriceToEarningsRatioFormData, PriceToEarningsRatioCalculation>
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
								name="sharePrice"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Share Price</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="sharePrice"
												iconType="currency"
												placeholder="100"
												step="0.01"
												type="number"
												min={0}
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

							<FormField
								control={form.control}
								name="earningsPerShare"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Earnings per Share"
											shortLabel="EPS"
										/>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="earningsPerShare"
												iconType="currency"
												placeholder="100"
												step="0.01"
												type="number"
												min0={false}
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('earningsPerShare', 0);
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
		</>
	);
};

export default Calculator;
