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
import { CROSSWIND_CALCULATIONS_API_URL, CROSSWIND_CALCULATIONS_QUERY_KEY } from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateCrosswind } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { createCrosswindFormDataSchema } from '@/schemas';
import { CrosswindReportProps, ICrosswindFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { CrosswindCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export const crosswindUnitFields: UnitFields<ICrosswindFormData> = {
	windSpeed: 'speed',
	gustSpeed: 'speed',
};

// Base units. Calm wind is speed 0 with any direction.
const defaultValues: ICrosswindFormData = {
	runwayHeading: 360,
	windDirection: 360,
	windSpeed: 0,
	gustSpeed: null,
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createCrosswindFormDataSchema(units), [units]);

	const form = useForm<ICrosswindFormData>({
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
		ifFieldIsEmpty,
		closeRenameModal,
		handleImportStart,
		closeImportModal,
	} = useCalculator<ICrosswindFormData, CrosswindReportProps, CrosswindCalculation>({
		apiUrl: CROSSWIND_CALCULATIONS_API_URL,
		queryKey: CROSSWIND_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateCrosswind,
		unitFields: crosswindUnitFields,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<CrosswindCalculation[] | null>({
		queryKey: [CROSSWIND_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(CROSSWIND_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const speedSymbol = getUnitSymbol('speed', units.speed);

	return (
		<>
			<FormContainer>
				<FormControlsTop<ICrosswindFormData, CrosswindCalculation>
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
								name="runwayHeading"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Runway Heading (magnetic)"
											shortLabel="Runway"
										/>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="runwayHeading"
												iconType="unit"
												unitSymbol="°"
												placeholder="087"
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="windDirection"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Wind Direction (magnetic, from)"
											shortLabel="Wind Direction"
										/>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="windDirection"
												iconType="unit"
												unitSymbol="°"
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
								name="windSpeed"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Wind Speed</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="windSpeed"
												iconType="unit"
												unitSymbol={speedSymbol}
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('windSpeed', 0);
												}}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="gustSpeed"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Gust Speed (optional)</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												value={field.value ?? ''}
												name="gustSpeed"
												iconType="unit"
												unitSymbol={speedSymbol}
												placeholder=""
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
