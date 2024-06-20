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
	EVENT_PROBABILITY_CALCULATIONS_API_URL,
	EVENT_PROBABILITY_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import { calculateEventProbability } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { eventProbabilityFormDataSchema } from '@/schemas';
import { EventProbabilityReportProps, IEventProbabilityFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventProbabilityCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Report from './Report';

export interface ReportProps {
	report: EventProbabilityReportProps;
}

const defaultValues: IEventProbabilityFormData = {
	eventProbabilityPercent: 5,
	eventTries: 10,
};

const Calculator = () => {
	const form = useForm<IEventProbabilityFormData>({
		resolver: zodResolver(eventProbabilityFormDataSchema),
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
		IEventProbabilityFormData,
		EventProbabilityReportProps,
		EventProbabilityCalculation
	>({
		apiUrl: EVENT_PROBABILITY_CALCULATIONS_API_URL,
		queryKey: EVENT_PROBABILITY_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateEventProbability,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<EventProbabilityCalculation[] | null>({
		queryKey: [EVENT_PROBABILITY_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(EVENT_PROBABILITY_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IEventProbabilityFormData, EventProbabilityCalculation>
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
								name="eventProbabilityPercent"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Event Probability</FormLabel>

										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="eventProbabilityPercent"
												iconType="percentage"
												step={0.000000000001}
												max={100}
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('eventProbabilityPercent', 0);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="eventTries"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Total Attempts</FormLabel>

										<FormControl>
											<Input
												{...field}
												name="eventTries"
												placeholder="10"
												step="1"
												type="number"
												max={200}
												min={0}
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('eventTries', 0);
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
