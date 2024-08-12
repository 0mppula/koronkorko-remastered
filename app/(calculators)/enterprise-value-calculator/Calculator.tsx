'use client';

import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
import FormGroup from '@/components/Form/FormGroup';
import NumberInputWithIcon from '@/components/Form/NumberInputWithIcon';
import SubmitButton from '@/components/Form/SubmitButton';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	ENTERPRICE_VALUE_CALCULATIONS_API_URL,
	ENTERPRICE_VALUE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { calculateEnterpriseValue } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { enterpriseValueFormDataSchema } from '@/schemas';
import { EnterpriseValueReportProps, IEnterpriseValueFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnterpriseValueCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export interface ReportProps {
	report: EnterpriseValueReportProps;
}

const defaultValues: IEnterpriseValueFormData = {
	sharesOutstanding: 0,
	sharePrice: 0,
	cash: 0,
	debt: 0,
};

const Calculator = () => {
	const form = useForm<IEnterpriseValueFormData>({
		resolver: zodResolver(enterpriseValueFormDataSchema),
		defaultValues,
	});

	const {
		resetForm,
		handleSaveUpdateStart,
		activeCalculation,
		handleClose,
		setRenameModalOpen,
		saveModalOpen,
		closeSaveModal,
		handleSave,
		renameModalOpen,
		closeRenameModal,
		handleRename,
		importModalOpen,
		handleImportStart,
		handleDelete,
		ifFieldIsEmpty,
		handleImport,
		closeImportModal,
		onCalculate,
		report,
	} = useCalculator<
		IEnterpriseValueFormData,
		EnterpriseValueReportProps,
		EnterpriseValueCalculation
	>({
		apiUrl: ENTERPRICE_VALUE_CALCULATIONS_API_URL,
		queryKey: ENTERPRICE_VALUE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateEnterpriseValue,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<EnterpriseValueCalculation[] | null>({
		queryKey: [ENTERPRICE_VALUE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(ENTERPRICE_VALUE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IEnterpriseValueFormData, EnterpriseValueCalculation>
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
												placeholder="100"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('sharePrice', 0);
												}}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="sharesOutstanding"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Shares Outstanding</FormLabel>

										<FormControl>
											<Input
												{...field}
												name="sharesOutstanding"
												placeholder="1000000"
												type="number"
												step="1"
												min={0}
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('sharesOutstanding', 0);
												}}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</FormGroup>

						<FormGroup>
							<FormField
								control={form.control}
								name="cash"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Total Cash</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="cash"
												onBlur={(e) => {
													ifFieldIsEmpty(e) && form.setValue('cash', 0);
												}}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="debt"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Total Debt</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="debt"
												onBlur={(e) => {
													ifFieldIsEmpty(e) && form.setValue('debt', 0);
												}}
											/>
										</FormControl>
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
