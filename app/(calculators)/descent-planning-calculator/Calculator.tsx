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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	DESCENT_PLANNING_CALCULATIONS_API_URL,
	DESCENT_PLANNING_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { descentInputOptions, descentSolveForOptions } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateDescentPlanning } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { createDescentPlanningFormDataSchema } from '@/schemas';
import { DescentPlanningReportProps, IDescentPlanningFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { DescentPlanningCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export const descentPlanningUnitFields: UnitFields<IDescentPlanningFormData> = {
	currentAltitude: 'altitude',
	targetAltitude: 'altitude',
	groundspeed: 'speed',
	verticalSpeed: 'verticalSpeed',
	distance: 'distance',
};

// Base units: ft, kt, ft/min, degrees and NM. FAA IPH p. 3-4: lose 6,000 ft at 120 kt and 600 fpm.
const defaultValues: IDescentPlanningFormData = {
	solveFor: 'topOfDescent',
	descentInput: 'verticalSpeed',
	currentAltitude: 7000,
	targetAltitude: 1000,
	groundspeed: 120,
	verticalSpeed: 600,
	descentAngle: 3,
	distance: null,
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createDescentPlanningFormDataSchema(units), [units]);

	const form = useForm<IDescentPlanningFormData>({
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
		IDescentPlanningFormData,
		DescentPlanningReportProps,
		DescentPlanningCalculation
	>({
		apiUrl: DESCENT_PLANNING_CALCULATIONS_API_URL,
		queryKey: DESCENT_PLANNING_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateDescentPlanning,
		unitFields: descentPlanningUnitFields,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<DescentPlanningCalculation[] | null>({
		queryKey: [DESCENT_PLANNING_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(DESCENT_PLANNING_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const solveFor = form.watch('solveFor');
	const descentInput = form.watch('descentInput');
	const altitudeSymbol = getUnitSymbol('altitude', units.altitude);

	return (
		<>
			<FormContainer>
				<FormControlsTop<IDescentPlanningFormData, DescentPlanningCalculation>
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
								name="solveFor"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Solve For</FormLabel>
										<FormControl>
											<RadioGroup
												ref={field.ref}
												name={field.name}
												value={field.value}
												onValueChange={(value) => {
													// Errors of a hidden field would show stale when it's shown again.
													form.clearErrors();
													field.onChange(value);
												}}
												className="flex flex-wrap gap-x-6 gap-y-2 pt-1"
											>
												{descentSolveForOptions.map((option) => (
													<FormItem
														key={`solveFor-${option.value}`}
														className="flex items-center gap-2 space-y-0"
													>
														<FormControl>
															<RadioGroupItem value={option.value} />
														</FormControl>
														<FormLabel className="font-normal">
															{option.label}
														</FormLabel>
													</FormItem>
												))}
											</RadioGroup>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							{solveFor === 'topOfDescent' && (
								<FormField
									control={form.control}
									name="descentInput"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>Descent By</FormLabel>
											<FormControl>
												<RadioGroup
													ref={field.ref}
													name={field.name}
													value={field.value}
													onValueChange={(value) => {
														form.clearErrors();
														field.onChange(value);
													}}
													className="flex flex-wrap gap-x-6 gap-y-2 pt-1"
												>
													{descentInputOptions.map((option) => (
														<FormItem
															key={`descentInput-${option.value}`}
															className="flex items-center gap-2 space-y-0"
														>
															<FormControl>
																<RadioGroupItem
																	value={option.value}
																/>
															</FormControl>
															<FormLabel className="font-normal">
																{option.label}
															</FormLabel>
														</FormItem>
													))}
												</RadioGroup>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</FormGroup>

						<FormGroup>
							<FormField
								control={form.control}
								name="currentAltitude"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Current Altitude</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="currentAltitude"
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
								name="targetAltitude"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Target Altitude</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="targetAltitude"
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
								name="groundspeed"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Groundspeed</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="groundspeed"
												iconType="unit"
												unitSymbol={getUnitSymbol('speed', units.speed)}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							{solveFor === 'topOfDescent' && descentInput === 'verticalSpeed' && (
								<FormField
									control={form.control}
									name="verticalSpeed"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>Vertical Speed</FormLabel>
											<FormControl>
												<NumberInputWithIcon
													{...field}
													value={field.value ?? ''}
													name="verticalSpeed"
													iconType="unit"
													unitSymbol={getUnitSymbol(
														'verticalSpeed',
														units.verticalSpeed
													)}
													placeholder=""
												/>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{solveFor === 'topOfDescent' && descentInput === 'angle' && (
								<FormField
									control={form.control}
									name="descentAngle"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>Descent Angle</FormLabel>
											<FormControl>
												<NumberInputWithIcon
													{...field}
													value={field.value ?? ''}
													name="descentAngle"
													iconType="unit"
													unitSymbol="°"
													placeholder=""
												/>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{solveFor === 'verticalSpeed' && (
								<FormField
									control={form.control}
									name="distance"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>Distance</FormLabel>
											<FormControl>
												<NumberInputWithIcon
													{...field}
													value={field.value ?? ''}
													name="distance"
													iconType="unit"
													unitSymbol={getUnitSymbol(
														'distance',
														units.distance
													)}
													placeholder=""
												/>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
							)}
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
