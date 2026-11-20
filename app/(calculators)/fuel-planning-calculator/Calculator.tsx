'use client';

import DynamicFormLabel from '@/components/Form/DynamicFormLabel';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	FUEL_PLANNING_CALCULATIONS_API_URL,
	FUEL_PLANNING_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { fuelTypes } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateFuelPlanning } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { getFuelUnitContext } from '@/lib/utils';
import { createFuelPlanningFormDataSchema } from '@/schemas';
import { FuelPlanningReportProps, IFuelPlanningFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { FuelPlanningCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

// A per-hour rate converts with the same factor as an amount.
export const fuelPlanningUnitFields: UnitFields<IFuelPlanningFormData> = {
	fuelBurnRate: 'fuel',
	taxiFuel: 'fuel',
	extraFuel: 'fuel',
};

// Base units: L/h, minutes and L.
const defaultValues: IFuelPlanningFormData = {
	fuelBurnRate: 30,
	flightTime: 60,
	reserveTime: 30,
	taxiFuel: null,
	extraFuel: null,
	fuelType: 'avgas',
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createFuelPlanningFormDataSchema(units), [units]);

	const form = useForm<IFuelPlanningFormData>({
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
	} = useCalculator<IFuelPlanningFormData, FuelPlanningReportProps, FuelPlanningCalculation>({
		apiUrl: FUEL_PLANNING_CALCULATIONS_API_URL,
		queryKey: FUEL_PLANNING_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateFuelPlanning,
		unitFields: fuelPlanningUnitFields,
		getUnitContext: getFuelUnitContext,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<FuelPlanningCalculation[] | null>({
		queryKey: [FUEL_PLANNING_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(FUEL_PLANNING_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const fuelSymbol = getUnitSymbol('fuel', units.fuel);

	return (
		<>
			<FormContainer>
				<FormControlsTop<IFuelPlanningFormData, FuelPlanningCalculation>
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
								name="fuelType"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Fuel Type</FormLabel>

										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a fuel type" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{fuelTypes.map((fuelType) => (
													<SelectItem
														key={`fuelType-${fuelType.value}`}
														value={fuelType.value}
													>
														{fuelType.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="fuelBurnRate"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Fuel Burn Rate"
											shortLabel="Burn Rate"
										/>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="fuelBurnRate"
												iconType="unit"
												unitSymbol={`${fuelSymbol}/h`}
												className="pr-24"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('fuelBurnRate', 0);
												}}
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
								name="flightTime"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Flight Time</FormLabel>
										<FormControl>
											<HoursMinutesInput {...field} name="flightTime" />
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="reserveTime"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Reserve Time</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="reserveTime"
												iconType="unit"
												unitSymbol="min"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('reserveTime', 0);
												}}
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
								name="taxiFuel"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Taxi Fuel (optional)</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												value={field.value ?? ''}
												name="taxiFuel"
												iconType="unit"
												unitSymbol={fuelSymbol}
												className="pr-20"
												placeholder=""
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="extraFuel"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Extra Fuel (optional)</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												value={field.value ?? ''}
												name="extraFuel"
												iconType="unit"
												unitSymbol={fuelSymbol}
												className="pr-20"
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
