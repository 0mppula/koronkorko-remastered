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
import { MARKUP_CALCULATIONS_API_URL, MARKUP_CALCULATIONS_QUERY_KEY } from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { calculateMarkup } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { markupFormDataSchema } from '@/schemas';
import { IMarkupFormData, MarkupReportProps } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { MarkupCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Report from './Report';

const defaultValues: IMarkupFormData = {
	cost: 0,
	salesPrice: 0,
};

const Calculator = () => {
	const form = useForm<IMarkupFormData>({
		resolver: zodResolver(markupFormDataSchema),
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
	} = useCalculator<IMarkupFormData, MarkupReportProps, MarkupCalculation>({
		apiUrl: MARKUP_CALCULATIONS_API_URL,
		queryKey: MARKUP_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateMarkup,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<MarkupCalculation[] | null>({
		queryKey: [MARKUP_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(MARKUP_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IMarkupFormData, MarkupCalculation>
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
								name="cost"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Cost</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="cost"
												onBlur={(e) => {
													ifFieldIsEmpty(e) && form.setValue('cost', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="salesPrice"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Sales Price</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="salesPrice"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('salesPrice', 0);
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
