'use client';

import { ButtonWithIcon } from '@/components/ButtonWithIcon';
import FormContainer from '@/components/Form/FormContainer';
import FormControlsTop from '@/components/Form/FormControlsTop';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	WEIGHT_AND_BALANCE_CALCULATIONS_API_URL,
	WEIGHT_AND_BALANCE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import { fuelTypes, stationTypes } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateWeightAndBalance } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import {
	createRowId,
	getUnitFractionDigits,
	getUnitSymbol,
	INCH_IN_MILLIMETRES,
	POUND_IN_KILOGRAMS,
	UnitFields,
	US_GALLON_IN_LITRES,
	withRowIds,
} from '@/lib/units';
import { getFuelUnitContext } from '@/lib/utils';
import { createWeightAndBalanceFormDataSchema } from '@/schemas';
import { IWeightAndBalanceFormData, WeightAndBalanceReportProps } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { WeightAndBalanceCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

const MAX_STATIONS = 20;

export const weightAndBalanceUnitFields: UnitFields<IWeightAndBalanceFormData> = {
	stations: { weight: 'weight', fuel: 'fuel', arm: 'arm' },
	maxTakeoffWeight: 'weight',
};

const lb = (value: number) => value * POUND_IN_KILOGRAMS;
const inches = (value: number) => value * INCH_IN_MILLIMETRES;

// Base units: kg, L and mm. FAA PHAK Fig. 10-5 (p. 10-7), front seat occupants split in two.
const defaultValues: IWeightAndBalanceFormData = {
	stations: [
		{ name: 'Empty aircraft', type: 'weight', weight: lb(2100), fuel: null, arm: inches(78.3) },
		{ name: 'Pilot', type: 'weight', weight: lb(170), fuel: null, arm: inches(85) },
		{ name: 'Front passenger', type: 'weight', weight: lb(170), fuel: null, arm: inches(85) },
		{ name: 'Rear passengers', type: 'weight', weight: lb(350), fuel: null, arm: inches(121) },
		{ name: 'Baggage', type: 'weight', weight: lb(80), fuel: null, arm: inches(150) },
		{
			name: 'Fuel',
			type: 'fuel',
			weight: null,
			fuel: 75 * US_GALLON_IN_LITRES,
			arm: inches(75),
		},
	],
	fuelType: 'avgas',
	maxTakeoffWeight: lb(3400),
};

// With base units the unit effect doesn't reset the form on mount, so the rows get ids here.
const initialFormValues = withRowIds(defaultValues, weightAndBalanceUnitFields);

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createWeightAndBalanceFormDataSchema(units), [units]);

	const form = useForm<IWeightAndBalanceFormData>({
		resolver: zodResolver(schema),
		defaultValues: initialFormValues,
	});

	const { fields, append, remove } = useFieldArray({ control: form.control, name: 'stations' });

	const stations = useWatch({ control: form.control, name: 'stations' });
	const hasFuelStation = stations?.some((station) => station?.type === 'fuel');

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
		IWeightAndBalanceFormData,
		WeightAndBalanceReportProps,
		WeightAndBalanceCalculation
	>({
		apiUrl: WEIGHT_AND_BALANCE_CALCULATIONS_API_URL,
		queryKey: WEIGHT_AND_BALANCE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateWeightAndBalance,
		unitFields: weightAndBalanceUnitFields,
		getUnitContext: getFuelUnitContext,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<WeightAndBalanceCalculation[] | null>({
		queryKey: [WEIGHT_AND_BALANCE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(WEIGHT_AND_BALANCE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const weightSymbol = getUnitSymbol('weight', units.weight);
	const fuelSymbol = getUnitSymbol('fuel', units.fuel);
	const armSymbol = getUnitSymbol('arm', units.arm);
	const armFractionDigits = getUnitFractionDigits('arm', units.arm);
	const stationsError = form.formState.errors.stations?.root?.message;

	const addStation = () => {
		append({
			rowId: createRowId(),
			name: `Station ${fields.length + 1}`,
			type: 'weight',
			weight: 0,
			fuel: null,
			arm: 0,
		});
	};

	return (
		<>
			<FormContainer>
				<FormControlsTop<IWeightAndBalanceFormData, WeightAndBalanceCalculation>
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
						{fields.map((field, index) => {
							const type = stations?.[index]?.type ?? field.type;

							return (
								<div
									key={field.id}
									role="group"
									aria-label={`Station ${index + 1}`}
									className="rounded-md border border-input p-3 sm:p-4"
								>
									<div className="mb-2 flex items-center justify-between gap-2">
										<p className="font-semibold">Station {index + 1}</p>

										<ButtonWithIcon
											type="button"
											variant="outline"
											size="sm"
											icon={Trash2}
											iconPosition="left"
											aria-label={`Remove station ${index + 1}`}
											disabled={fields.length <= 1}
											onClick={() => remove(index)}
										>
											Remove
										</ButtonWithIcon>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<FormField
											control={form.control}
											name={`stations.${index}.name`}
											render={({ field }) => (
												<FormItem className="w-full">
													<FormLabel>Name</FormLabel>
													<FormControl>
														<Input
															{...field}
															maxLength={30}
															autoComplete="off"
															className="bg-card"
														/>
													</FormControl>

													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`stations.${index}.type`}
											render={({ field }) => (
												<FormItem className="w-full">
													<FormLabel>Type</FormLabel>

													<Select
														onValueChange={(value) => {
															// Errors of the hidden field would show stale when it's shown again.
															form.clearErrors();
															field.onChange(value);
														}}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select a type" />
															</SelectTrigger>
														</FormControl>

														<SelectContent>
															{stationTypes.map((stationType) => (
																<SelectItem
																	key={`stationType-${stationType.value}`}
																	value={stationType.value}
																>
																	{stationType.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>

													<FormMessage />
												</FormItem>
											)}
										/>

										{type === 'fuel' ? (
											<FormField
												control={form.control}
												name={`stations.${index}.fuel`}
												render={({ field }) => (
													<FormItem className="w-full">
														<FormLabel>Fuel</FormLabel>
														<FormControl>
															<NumberInputWithIcon
																{...field}
																value={field.value ?? ''}
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
										) : (
											<FormField
												control={form.control}
												name={`stations.${index}.weight`}
												render={({ field }) => (
													<FormItem className="w-full">
														<FormLabel>Weight</FormLabel>
														<FormControl>
															<NumberInputWithIcon
																{...field}
																value={field.value ?? ''}
																iconType="unit"
																unitSymbol={weightSymbol}
																placeholder=""
															/>
														</FormControl>

														<FormMessage />
													</FormItem>
												)}
											/>
										)}

										<FormField
											control={form.control}
											name={`stations.${index}.arm`}
											render={({ field }) => (
												<FormItem className="w-full">
													<FormLabel>Arm</FormLabel>
													<FormControl>
														<NumberInputWithIcon
															{...field}
															value={field.value ?? ''}
															iconType="unit"
															unitSymbol={armSymbol}
															fractionDigits={armFractionDigits}
															min0={false}
															placeholder=""
														/>
													</FormControl>

													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							);
						})}

						{stationsError && (
							<p className="text-sm font-medium text-destructive">{stationsError}</p>
						)}

						<ButtonWithIcon
							type="button"
							variant="outline"
							icon={Plus}
							iconPosition="left"
							disabled={fields.length >= MAX_STATIONS}
							onClick={addStation}
						>
							Add station
						</ButtonWithIcon>

						<div className="flex flex-col gap-4 sm:flex-row">
							{hasFuelStation && (
								<FormField
									control={form.control}
									name="fuelType"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>Fuel Type</FormLabel>

											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
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
							)}

							<FormField
								control={form.control}
								name="maxTakeoffWeight"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Maximum Takeoff Weight (optional)</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												value={field.value ?? ''}
												iconType="unit"
												unitSymbol={weightSymbol}
												placeholder=""
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

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
