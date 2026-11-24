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
import { HEADING_CALCULATIONS_API_URL, HEADING_CALCULATIONS_QUERY_KEY } from '@/constants/api';
import { variationDirections } from '@/constants/data';
import useCalculator from '@/hooks/useCalculator';
import { calculateHeading } from '@/lib/calculatorFns';
import { getCalculations } from '@/lib/queryFns/calculations';
import { headingFormDataSchema } from '@/schemas';
import { HeadingReportProps, IHeadingFormData } from '@/types/calculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeadingCalculation } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Info from './Info';
import Report from './Report';

// PHAK Figure 16-16: TH 088°, 10° E, card correction −4° gives MH 078° and CH 074°.
const defaultValues: IHeadingFormData = {
	trueHeading: 88,
	variation: 10,
	variationDirection: 'east',
	deviationCorrection: -4,
};

const Calculator = () => {
	const form = useForm<IHeadingFormData>({
		resolver: zodResolver(headingFormDataSchema),
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
	} = useCalculator<IHeadingFormData, HeadingReportProps, HeadingCalculation>({
		apiUrl: HEADING_CALCULATIONS_API_URL,
		queryKey: HEADING_CALCULATIONS_QUERY_KEY,
		defaultValues,
		form,
		calcFn: calculateHeading,
	});

	const { status: sessionStatus } = useSession();

	const {
		data: calculations,
		isLoading: isCalculationsLoading,
		isFetching,
	} = useQuery<HeadingCalculation[] | null>({
		queryKey: [HEADING_CALCULATIONS_QUERY_KEY],
		queryFn: () => getCalculations(HEADING_CALCULATIONS_API_URL),
		staleTime: 1_000 * 60 * 10, // 10 minutes
		enabled: sessionStatus === 'authenticated',
	});

	return (
		<>
			<FormContainer>
				<FormControlsTop<IHeadingFormData, HeadingCalculation>
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
							name="trueHeading"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>True Heading</FormLabel>
									<FormControl>
										<NumberInputWithIcon
											{...field}
											name="trueHeading"
											iconType="unit"
											unitSymbol="°"
											placeholder="088"
										/>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>

						<FormGroup inline>
							<FormField
								control={form.control}
								name="variation"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Variation</FormLabel>
										<FormControl>
											<NumberInputWithIcon
												{...field}
												name="variation"
												iconType="unit"
												unitSymbol="°"
												onBlur={(e) => {
													ifFieldIsEmpty(e) &&
														form.setValue('variation', 0);
												}}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="variationDirection"
								render={({ field }) => (
									<FormItem className="w-full">
										<DynamicFormLabel
											label="Variation Direction"
											shortLabel="Direction"
										/>

										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select East or West" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{variationDirections.map((direction) => (
													<SelectItem
														key={`variationDirection-${direction.value}`}
														value={direction.value}
													>
														{direction.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<FormMessage />
									</FormItem>
								)}
							/>
						</FormGroup>

						<FormField
							control={form.control}
							name="deviationCorrection"
							render={({ field }) => (
								<FormItem className="w-full">
									<DynamicFormLabel
										label="Deviation Correction from the Compass Card"
										shortLabel="Deviation Correction"
									/>
									<FormControl>
										<NumberInputWithIcon
											{...field}
											value={field.value ?? ''}
											name="deviationCorrection"
											iconType="unit"
											unitSymbol="°"
											min0={false}
											placeholder="Optional"
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
