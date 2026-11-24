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
import {
	CLOUD_BASE_CALCULATIONS_API_URL,
	CLOUD_BASE_CALCULATIONS_QUERY_KEY,
} from '@/constants/api';
import useCalculator from '@/hooks/useCalculator';
import useUnitsStore from '@/hooks/useUnits';
import { calculateCloudBase } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { getUnitSymbol, UnitFields } from '@/lib/units';
import { createCloudBaseFormDataSchema } from '@/schemas';
import { CloudBaseReportProps, ICloudBaseFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { CloudBaseCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

export const cloudBaseUnitFields: UnitFields<ICloudBaseFormData> = {
	temperature: 'temperature',
	dewPoint: 'temperature',
	elevation: 'altitude',
};

// Base units.
const defaultValues: ICloudBaseFormData = {
	temperature: 15,
	dewPoint: 5,
	elevation: null,
};

const Calculator = () => {
	const { units } = useUnitsStore();

	const schema = useMemo(() => createCloudBaseFormDataSchema(units), [units]);

	const form = useForm<ICloudBaseFormData>({
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
	} = useCalculator<ICloudBaseFormData, CloudBaseReportProps, CloudBaseCalculation>({
		apiUrl: CLOUD_BASE_CALCULATIONS_API_URL,
		queryKey: CLOUD_BASE_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateCloudBase,
		unitFields: cloudBaseUnitFields,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<CloudBaseCalculation[] | null>({
		queryKey: [CLOUD_BASE_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(CLOUD_BASE_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	const temperatureSymbol = getUnitSymbol('temperature', units.temperature);

	return (
		<>
			<FormContainer>
				<FormControlsTop<ICloudBaseFormData, CloudBaseCalculation>
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
								name="temperature"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Temperature</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="temperature"
												iconType="unit"
												unitSymbol={temperatureSymbol}
												min0={false}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="dewPoint"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Dew Point</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="dewPoint"
												iconType="unit"
												unitSymbol={temperatureSymbol}
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
								name="elevation"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Field Elevation</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												value={field.value ?? ''}
												name="elevation"
												iconType="unit"
												unitSymbol={getUnitSymbol(
													'altitude',
													units.altitude
												)}
												min0={false}
												placeholder="Optional"
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
