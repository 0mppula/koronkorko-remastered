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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	GLIDE_DISTANCE_CALCULATIONS_API_URL,
	GLIDE_DISTANCE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { windTypes } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateGlideDistance } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { createGlideDistanceFormDataSchema } from '@/schemas';
import { GlideDistanceReportProps, IGlideDistanceFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { GlideDistanceCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export const glideDistanceUnitFields: UnitFields<IGlideDistanceFormData> = {
	altitude: 'altitude',
	terrainElevation: 'altitude',
	glideTrueAirspeed: 'speed',
	windSpeed: 'speed',
};

// Base units.
const defaultValues: IGlideDistanceFormData = {
	altitude: 4000,
	terrainElevation: 1000,
	glideRatio: 9,
	glideTrueAirspeed: null,
	windSpeed: null,
	windType: 'headwind',
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createGlideDistanceFormDataSchema(units), [units]);

	const form = useForm<IGlideDistanceFormData>({
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
	} = useCalculator<IGlideDistanceFormData, GlideDistanceReportProps, GlideDistanceCalculation>({
		apiUrl: GLIDE_DISTANCE_CALCULATIONS_API_URL,
		queryKey: GLIDE_DISTANCE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateGlideDistance,
		unitFields: glideDistanceUnitFields,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<GlideDistanceCalculation[] | null>({
		queryKey: [GLIDE_DISTANCE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(GLIDE_DISTANCE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const altitudeSymbol = getUnitSymbol('altitude', units.altitude);
	const speedSymbol = getUnitSymbol('speed', units.speed);

	return (
		<>
			<FormContainer>
				<FormControlsTop<IGlideDistanceFormData, GlideDistanceCalculation>
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
								name="altitude"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Altitude</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="altitude"
												iconType="unit"
												unitSymbol={altitudeSymbol}
												min0={false}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="terrainElevation"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Terrain Elevation</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="terrainElevation"
												iconType="unit"
												unitSymbol={altitudeSymbol}
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
								name="glideRatio"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Glide Ratio</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="glideRatio"
												iconType="unit"
												unitSymbol=":1"
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="glideTrueAirspeed"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Glide True Airspeed (optional)</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												value={field.value ?? ''}
												name="glideTrueAirspeed"
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

						<FormGroup inline>
							<FormField
								control={form.control}
								name="windSpeed"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Wind Speed (optional)</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												value={field.value ?? ''}
												name="windSpeed"
												iconType="unit"
												unitSymbol={speedSymbol}
												placeholder=""
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="windType"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel label="Wind Type" shortLabel="Type" />

										<Select
											onValueChange={field.onChange}
											value={field.value ?? ''}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Headwind or tailwind" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{windTypes.map((type) => (
													<SelectItem
														key={`windType-${type.value}`}
														value={type.value}
													>
														{type.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

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
