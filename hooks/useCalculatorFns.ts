import { API_URLS } from '@/constants/api';
import {
	IDeleteCalculationParam,
	IRenameCalculationParam,
	ISaveCalculationParam,
	IUpdateCalculationParam,
} from '@/lib/queryFns/calculations';
import { IHasFormDataAndName, InferredCalculationNameSchema } from '@/types/calculations';
import { UseMutateFunction } from '@tanstack/react-query';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

const useCalculatorFns = <
	TFormData extends FieldValues,
	TReportProps,
	TCalculation extends IHasFormDataAndName<TFormData>
>(
	setReport: Dispatch<SetStateAction<TReportProps | null>>,
	calcFn: (formData: TFormData) => TReportProps,
	defaultValues: TFormData,
	form: UseFormReturn<TFormData, any, undefined>,
	activeCalculation: TCalculation | null,
	apiUrl: (typeof API_URLS)[number],
	setSaveModalOpen: Dispatch<SetStateAction<boolean>>,
	updateMutation: UseMutateFunction<
		TCalculation,
		Error,
		IUpdateCalculationParam<TFormData, TCalculation>
	>,
	saveMutation: UseMutateFunction<TCalculation, unknown, ISaveCalculationParam<TFormData>>,
	setRenameModalOpen: Dispatch<SetStateAction<boolean>>,
	renameMutation: UseMutateFunction<TCalculation, Error, IRenameCalculationParam<TCalculation>>,
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>,
	deleteMutation: UseMutateFunction<TCalculation, unknown, IDeleteCalculationParam>,
	setImportModalOpen: Dispatch<SetStateAction<boolean>>
) => {
	const onCalculate = useCallback(
		(formData: TFormData) => {
			setReport(calcFn(formData));
		},
		[setReport, calcFn]
	);

	const resetForm = useCallback(() => {
		setReport(null);
		toast.success('Form cleared');

		form.reset(defaultValues);
	}, [setReport, defaultValues, form]);

	const handleSaveUpdateStart = useCallback(() => {
		if (activeCalculation) {
			// Only update if the form data has changed
			if (JSON.stringify(activeCalculation.formData) !== JSON.stringify(form.getValues())) {
				updateMutation({
					apiUrl,
					updatedCalculation: { ...activeCalculation, formData: form.getValues() },
				});
			} else {
				toast.success('Calculation updated');
			}
		} else {
			setSaveModalOpen(true);
		}
	}, [activeCalculation, updateMutation, apiUrl, form, setSaveModalOpen]);

	const closeSaveModal = useCallback(() => {
		setSaveModalOpen(false);
	}, [setSaveModalOpen]);

	const handleSave = useCallback(
		(data: InferredCalculationNameSchema) => {
			saveMutation({
				apiUrl,
				name: data.name,
				formData: form.getValues(),
			});
		},
		[saveMutation, apiUrl, form]
	);

	const handleRename = useCallback(
		(data: InferredCalculationNameSchema) => {
			if (!activeCalculation) return;
			// Only update if the name has changed
			if (activeCalculation.name === data.name) {
				setRenameModalOpen(false);
			} else {
				renameMutation({
					apiUrl,
					updatedCalculation: { ...activeCalculation, name: data.name },
				});
			}
		},
		[activeCalculation, renameMutation, apiUrl, setRenameModalOpen]
	);

	const handleClose = useCallback(() => {
		setActiveCalculation(null);
		setReport(null);
		form.reset(defaultValues);
		toast.success('Calculation closed');
	}, [setActiveCalculation, setReport, form, defaultValues]);

	const handleDelete = useCallback(
		(id: string) => {
			deleteMutation({ apiUrl, id });
		},
		[deleteMutation, apiUrl]
	);

	const handleImport = useCallback(
		(calculation: TCalculation) => {
			const { formData, name } = calculation;

			setActiveCalculation(calculation);
			toast.success(`${name} imported`);
			setImportModalOpen(false);
			setReport(calcFn(formData));

			form.reset(formData);
		},
		[setActiveCalculation, setImportModalOpen, setReport, calcFn, form]
	);

	return {
		onCalculate,
		resetForm,
		handleSaveUpdateStart,
		closeSaveModal,
		handleSave,
		handleRename,
		handleClose,
		handleDelete,
		handleImport,
	};
};

export default useCalculatorFns;
