'use client';

import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
import FormGroup from '@/components/Form/FormGroup';
import HoursMinutesInput from '@/components/Form/HoursMinutesInput';
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
	TIME_SPEED_DISTANCE_CALCULATIONS_API_URL,
	TIME_SPEED_DISTANCE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { timeSpeedDistanceSolveForOptions } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateTimeSpeedDistance } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { createTimeSpeedDistanceFormDataSchema } from '@/schemas';
import { ITimeSpeedDistanceFormData, TimeSpeedDistanceReportProps } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { TimeSpeedDistanceCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export const timeSpeedDistanceUnitFields: UnitFields<ITimeSpeedDistanceFormData> = {
	distance: 'distance',
	groundspeed: 'speed',
};

// Base units: NM, kt and minutes. FAA PHAK example: 210 NM at 140 kt.
const defaultValues: ITimeSpeedDistanceFormData = {
	solveFor: 'time',
	distance: 210,
	groundspeed: 140,
	time: null,
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createTimeSpeedDistanceFormDataSchema(units), [units]);

	const form = useForm<ITimeSpeedDistanceFormData>({
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
		ITimeSpeedDistanceFormData,
		TimeSpeedDistanceReportProps,
		TimeSpeedDistanceCalculation
	>({
		apiUrl: TIME_SPEED_DISTANCE_CALCULATIONS_API_URL,
		queryKey: TIME_SPEED_DISTANCE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateTimeSpeedDistance,
		unitFields: timeSpeedDistanceUnitFields,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<TimeSpeedDistanceCalculation[] | null>({
		queryKey: [TIME_SPEED_DISTANCE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(TIME_SPEED_DISTANCE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const solveFor = form.watch('solveFor');

	return (
		<>
			<FormContainer>
				<FormControlsTop<ITimeSpeedDistanceFormData, TimeSpeedDistanceCalculation>
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
												// Errors of the hidden field would show stale when it's shown again.
												form.clearErrors();
												field.onChange(value);
											}}
											className="flex flex-wrap gap-x-6 gap-y-2 pt-1"
										>
											{timeSpeedDistanceSolveForOptions.map((option) => (
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

						<FormGroup>
							{solveFor !== 'distance' && (
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

							{solveFor !== 'groundspeed' && (
								<FormField
									control={form.control}
									name="groundspeed"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>Groundspeed</FormLabel>
											<FormControl>
												<NumberInputWithIcon
													{...field}
													value={field.value ?? ''}
													name="groundspeed"
													iconType="unit"
													unitSymbol={getUnitSymbol('speed', units.speed)}
													placeholder=""
												/>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{solveFor !== 'time' && (
								<FormField
									control={form.control}
									name="time"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>Time</FormLabel>
											<FormControl>
												<HoursMinutesInput {...field} name="time" />
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
