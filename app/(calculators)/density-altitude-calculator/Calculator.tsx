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
	DENSITY_ALTITUDE_CALCULATIONS_API_URL,
	DENSITY_ALTITUDE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateDensityAltitude } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { createDensityAltitudeFormDataSchema } from '@/schemas';
import { DensityAltitudeReportProps, IDensityAltitudeFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { DensityAltitudeCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export const densityAltitudeUnitFields: UnitFields<IDensityAltitudeFormData> = {
	fieldElevation: 'altitude',
	qnh: 'pressure',
	outsideAirTemperature: 'temperature',
};

// Base units: ISA at sea level.
const defaultValues: IDensityAltitudeFormData = {
	fieldElevation: 0,
	qnh: 1013.25,
	outsideAirTemperature: 15,
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createDensityAltitudeFormDataSchema(units), [units]);

	const form = useForm<IDensityAltitudeFormData>({
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
		IDensityAltitudeFormData,
		DensityAltitudeReportProps,
		DensityAltitudeCalculation
	>({
		apiUrl: DENSITY_ALTITUDE_CALCULATIONS_API_URL,
		queryKey: DENSITY_ALTITUDE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateDensityAltitude,
		unitFields: densityAltitudeUnitFields,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<DensityAltitudeCalculation[] | null>({
		queryKey: [DENSITY_ALTITUDE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(DENSITY_ALTITUDE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IDensityAltitudeFormData, DensityAltitudeCalculation>
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
								name="fieldElevation"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Field Elevation</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="fieldElevation"
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

							<FormField
								control={form.control}
								name="qnh"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="QNH / Altimeter Setting"
											shortLabel="QNH"
										/>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="qnh"
												iconType="unit"
												unitSymbol={getUnitSymbol(
													'pressure',
													units.pressure
												)}
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
