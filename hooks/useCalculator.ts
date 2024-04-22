import { API_URLS, QUERY_KEYS } from '@/constants/api';
import {
	deleteCalculation,
	renameCalculation,
	saveCalculation,
	updateCalculation,
} from '@/lib/queryFns/calculations';
import { IHasFormDataAndName, InferredCalculationNameSchema } from '@/types/calculations';
import { useCallback, useState } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import useDeleteCalculationMutation from './useDeleteCalculationMutation';
import useRenameCalculationMutation from './useRenameCalculationMutation';
import useSaveCalculationMutation from './useSaveCalculationMutation';
import useUpdateCalculationMutation from './useUpdateCalculationMutation';

interface IUseCalculator<TFormData extends FieldValues, TReportProps> {
	calcFn: (formData: TFormData) => TReportProps;
	defaultValues: TFormData;
	form: UseFormReturn<TFormData, any, undefined>;
	apiUrl: (typeof API_URLS)[number];
	queryKey: (typeof QUERY_KEYS)[number];
}

const useCalculator = <
	TFormData extends FieldValues,
	TReportProps,
	TCalculation extends IHasFormDataAndName<TFormData>
>({
	calcFn,
	defaultValues,
	form,
	apiUrl,
	queryKey,
}: IUseCalculator<TFormData, TReportProps>) => {
	const [activeCalculation, setActiveCalculation] = useState<TCalculation | null>(null);
	const [report, setReport] = useState<TReportProps | null>(null);
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [renameModalOpen, setRenameModalOpen] = useState(false);

	const { mutate: saveMutation } = useSaveCalculationMutation<TCalculation, TFormData>(
		queryKey,
		setActiveCalculation,
		saveCalculation,
		setSaveModalOpen
	);

	const { mutate: deleteMutation } = useDeleteCalculationMutation<TReportProps, TCalculation>(
		queryKey,
		activeCalculation,
		setActiveCalculation,
		setReport,
		deleteCalculation
	);

	const { mutate: renameMutation } = useRenameCalculationMutation<TCalculation>(
		queryKey,
		setActiveCalculation,
		setRenameModalOpen,
		renameCalculation
	);

	const { mutate: updateMutation } = useUpdateCalculationMutation<TFormData, TCalculation>(
		queryKey,
		setActiveCalculation,
		updateCalculation
	);

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
		report,
		setReport,
		saveModalOpen,
		setSaveModalOpen,
		importModalOpen,
		setImportModalOpen,
		renameModalOpen,
		setRenameModalOpen,
		activeCalculation,
		setActiveCalculation,
	};
};

export default useCalculator;
