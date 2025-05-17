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
	LIQUIDATION_PRICE_CALCULATIONS_API_URL,
	LIQUIDATION_PRICE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { calculateLiquidationPrice } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { liquidationPriceFormDataSchema } from '@/schemas';
import { ILiquidationPriceFormData, LiquidationPriceReportProps } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { LiquidationPriceCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

const defaultValues: ILiquidationPriceFormData = {
	entryPrice: 0,
	leverageRatio: 0,
};

const Calculator = () => {
	const form = useForm<ILiquidationPriceFormData>({
		resolver: zodResolver(liquidationPriceFormDataSchema),
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
		ILiquidationPriceFormData,
		LiquidationPriceReportProps,
		LiquidationPriceCalculation
	>({
		apiUrl: LIQUIDATION_PRICE_CALCULATIONS_API_URL,
		queryKey: LIQUIDATION_PRICE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateLiquidationPrice,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<LiquidationPriceCalculation[] | null>({
		queryKey: [LIQUIDATION_PRICE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(LIQUIDATION_PRICE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<ILiquidationPriceFormData, LiquidationPriceCalculation>
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
								name="entryPrice"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Entry Price</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="entryPrice"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('entryPrice', 0);
												}}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="leverageRatio"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Leverage Ratio</FormLabel>
										<FormControl>
											<Input
												{...field}
												name="leverageRatio"
												placeholder="2.5"
												step="0.01"
												type="number"
												max={200}
												min={0}
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('leverageRatio', 0);
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
