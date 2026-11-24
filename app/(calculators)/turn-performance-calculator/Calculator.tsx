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
	TURN_PERFORMANCE_CALCULATIONS_API_URL,
	TURN_PERFORMANCE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateTurnPerformance } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { createTurnPerformanceFormDataSchema } from '@/schemas';
import { ITurnPerformanceFormData, TurnPerformanceReportProps } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { TurnPerformanceCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export const turnPerformanceUnitFields: UnitFields<ITurnPerformanceFormData> = {
	trueAirspeed: 'speed',
	stallSpeed: 'speed',
};

// Base units; the PHAK example (120 kt, 30°).
const defaultValues: ITurnPerformanceFormData = {
	trueAirspeed: 120,
	bankAngle: 30,
	stallSpeed: null,
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createTurnPerformanceFormDataSchema(units), [units]);

	const form = useForm<ITurnPerformanceFormData>({
		resolver: zodResolver(schema),
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
		closeRenameModal,
		handleImportStart,
		closeImportModal,
	} = useCalculator<
		ITurnPerformanceFormData,
		TurnPerformanceReportProps,
		TurnPerformanceCalculation
	>({
		apiUrl: TURN_PERFORMANCE_CALCULATIONS_API_URL,
		queryKey: TURN_PERFORMANCE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateTurnPerformance,
		unitFields: turnPerformanceUnitFields,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<TurnPerformanceCalculation[] | null>({
		queryKey: [TURN_PERFORMANCE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(TURN_PERFORMANCE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const speedSymbol = getUnitSymbol('speed', units.speed);

	return (
		<>
			<FormContainer>
				<FormControlsTop<ITurnPerformanceFormData, TurnPerformanceCalculation>
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
								name="trueAirspeed"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="True Airspeed (TAS)"
											shortLabel="TAS"
										/>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="trueAirspeed"
												iconType="unit"
												unitSymbol={speedSymbol}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="bankAngle"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Bank Angle</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="bankAngle"
												iconType="unit"
												unitSymbol="°"
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</FormGroup>

						<FormField
							control={form.control}
							name="stallSpeed"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Stall Speed (optional)</FormLabel>
									<FormControl>
										<NumberInputWithIcon
											{...field}
											value={field.value ?? ''}
											name="stallSpeed"
											iconType="unit"
											unitSymbol={speedSymbol}
											placeholder=""
										/>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>

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
