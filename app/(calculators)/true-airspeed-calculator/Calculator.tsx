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
	TRUE_AIRSPEED_CALCULATIONS_API_URL,
	TRUE_AIRSPEED_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateTrueAirspeed } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { createTrueAirspeedFormDataSchema } from '@/schemas';
import { ITrueAirspeedFormData, TrueAirspeedReportProps } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrueAirspeedCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export const trueAirspeedUnitFields: UnitFields<ITrueAirspeedFormData> = {
	calibratedAirspeed: 'speed',
	pressureAltitude: 'altitude',
	outsideAirTemperature: 'temperature',
};

// Base units.
const defaultValues: ITrueAirspeedFormData = {
	calibratedAirspeed: 120,
	pressureAltitude: 5000,
	outsideAirTemperature: 5,
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createTrueAirspeedFormDataSchema(units), [units]);

	const form = useForm<ITrueAirspeedFormData>({
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
	} = useCalculator<ITrueAirspeedFormData, TrueAirspeedReportProps, TrueAirspeedCalculation>({
		apiUrl: TRUE_AIRSPEED_CALCULATIONS_API_URL,
		queryKey: TRUE_AIRSPEED_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateTrueAirspeed,
		unitFields: trueAirspeedUnitFields,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<TrueAirspeedCalculation[] | null>({
		queryKey: [TRUE_AIRSPEED_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(TRUE_AIRSPEED_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<ITrueAirspeedFormData, TrueAirspeedCalculation>
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
								name="calibratedAirspeed"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Calibrated Airspeed (CAS)"
											shortLabel="CAS"
										/>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="calibratedAirspeed"
												iconType="unit"
												unitSymbol={getUnitSymbol('speed', units.speed)}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="pressureAltitude"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Pressure Altitude</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="pressureAltitude"
												iconType="unit"
												unitSymbol={getUnitSymbol(
													'altitude',
													units.altitude
												)}
												min0={false}
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
								name="outsideAirTemperature"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Outside Air Temperature</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="outsideAirTemperature"
												iconType="unit"
												unitSymbol={getUnitSymbol(
													'temperature',
													units.temperature
												)}
												min0={false}
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
