import { API_URLS, QUERY_KEYS } from '@/constants/api';
import {
	deleteCalculation,
	renameCalculation,
	saveCalculation,
	updateCalculation,
} from '@/lib/queryFns/calculations';
import {
	BASE_UNITS,
	formDataFromBaseUnits,
	formDataToBaseUnits,
	UnitFields,
	UnitPreferences,
	unitQuantities,
} from '@/lib/units';
import { ICalculationNameFormData, IHasFormDataAndName } from '@/types/calculations';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import useCalculationMutations from './useCalculationMutations';
import useUnitsStore from './useUnits';

interface IUseCalculator<TFormData extends FieldValues, TReportProps> {
	calcFn: (formData: TFormData) => TReportProps;
	defaultValues: TFormData;
	form: UseFormReturn<TFormData, any, undefined>;
	apiUrl: (typeof API_URLS)[number];
	queryKey: (typeof QUERY_KEYS)[number];
	// Fields entered in the user's units; defaultValues, calcFn and saved data use base units.
	unitFields?: UnitFields<TFormData>;
}

const useCalculator = <
	TFormData extends FieldValues,
	TReportProps,
	TCalculation extends IHasFormDataAndName<TFormData>,
>({
	calcFn,
	defaultValues,
	form,
	apiUrl,
	queryKey,
	unitFields,
}: IUseCalculator<TFormData, TReportProps>) => {
	const [activeCalculation, setActiveCalculation] = useState<TCalculation | null>(null);
	const [report, setReport] = useState<TReportProps | null>(null);
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [renameModalOpen, setRenameModalOpen] = useState(false);

	const { status: sessionStatus } = useSession();
	const { units } = useUnitsStore();

	const isAuthenticated = sessionStatus === 'authenticated';

	const toBaseUnits = useCallback(
		(formData: TFormData) =>
			unitFields ? formDataToBaseUnits(formData, unitFields, units) : formData,
		[unitFields, units]
	);

	const fromBaseUnits = useCallback(
		(formData: TFormData) =>
			unitFields ? formDataFromBaseUnits(formData, unitFields, units) : formData,
		[unitFields, units]
	);

	const formDefaultValues = useMemo(
		() => fromBaseUnits(defaultValues),
		[fromBaseUnits, defaultValues]
	);

	// Starts at base units so the base-unit defaults are converted on mount.
	const prevUnitsRef = useRef<UnitPreferences>(BASE_UNITS);

	// Keep the same physical values in the form when the user changes units.
	useEffect(() => {
		if (!unitFields) return;

		const prevUnits = prevUnitsRef.current;
		prevUnitsRef.current = units;

		if (
			unitQuantities.every(({ value: quantity }) => prevUnits[quantity] === units[quantity])
		) {
			return;
		}

		form.reset(
			formDataFromBaseUnits(
				formDataToBaseUnits(form.getValues(), unitFields, prevUnits),
				unitFields,
				units
			)
		);
	}, [unitFields, units, form]);

	const {
		deleteMutation: { mutate: deleteMutate },
		renameMutation: { mutate: renameMutate },
		saveMutation: { mutate: saveMutate },
		updateMutation: { mutate: updateMutate },
	} = useCalculationMutations<TFormData, TReportProps, TCalculation>({
		queryKey,
		activeCalculation,
		setActiveCalculation,
		setReport,
		setSaveModalOpen,
		setRenameModalOpen,
		deleteMutationFn: deleteCalculation,
		renameMutationFn: renameCalculation,
		saveMutationFn: saveCalculation,
		updateMutationFn: updateCalculation,
		defaultValues: formDefaultValues,
		form,
	});

	const onCalculate = useCallback(
		(formData: TFormData) => {
			setReport(calcFn(toBaseUnits(formData)));
		},
		[setReport, calcFn, toBaseUnits]
	);

	const resetForm = useCallback(() => {
		setReport(null);
		toast.success('Calculator cleared');

		form.reset(formDefaultValues);
	}, [setReport, formDefaultValues, form]);

	const handleSaveUpdateStart = useCallback(async () => {
		const startIfFormIsValid = (_: TFormData) => {
			if (activeCalculation) {
				// Only update if the form data has changed (compared in the user's units)
				if (
					JSON.stringify(fromBaseUnits(activeCalculation.formData)) !==
					JSON.stringify(form.getValues())
				) {
					updateMutate({
						apiUrl,
						updatedCalculation: {
							...activeCalculation,
							formData: toBaseUnits(form.getValues()),
						},
					});
				} else {
					toast.success('Calculation updated');
				}
			} else {
				setSaveModalOpen(true);
			}
		};

		if (isAuthenticated) {
			// Runs the body of the function only if the form is valid, else it will show errors.
			form.handleSubmit(startIfFormIsValid, () => toast.error('Invalid field values'))();
		} else {
			toast.error('Please login to save calculation');
		}
	}, [
		activeCalculation,
		updateMutate,
		apiUrl,
		form,
		setSaveModalOpen,
		isAuthenticated,
		fromBaseUnits,
		toBaseUnits,
	]);

	const closeSaveModal = useCallback(() => {
		setSaveModalOpen(false);
	}, [setSaveModalOpen]);

	const closeRenameModal = useCallback(() => {
		setRenameModalOpen(false);
	}, [setRenameModalOpen]);

	const closeImportModal = useCallback(() => {
		setImportModalOpen(false);
	}, [setImportModalOpen]);

	const handleSave = useCallback(
		(data: ICalculationNameFormData) => {
			saveMutate({
				apiUrl,
				name: data.name,
				formData: toBaseUnits(form.getValues()),
			});
		},
		[saveMutate, apiUrl, form, toBaseUnits]
	);

	const handleRename = useCallback(
		(data: ICalculationNameFormData) => {
			if (!activeCalculation) return;
			// Only update if the name has changed
			if (activeCalculation.name === data.name) {
				setRenameModalOpen(false);
			} else {
				renameMutate({
					apiUrl,
					updatedCalculation: { ...activeCalculation, name: data.name },
				});
			}
		},
		[activeCalculation, renameMutate, apiUrl, setRenameModalOpen]
	);

	const handleClose = useCallback(() => {
		setActiveCalculation(null);
		setReport(null);
		form.reset(formDefaultValues);
		toast.success('Calculation closed');
	}, [setActiveCalculation, setReport, form, formDefaultValues]);

	const handleDelete = useCallback(
		(id: string) => {
			deleteMutate({ apiUrl, id });
		},
		[deleteMutate, apiUrl]
	);

	const handleImport = useCallback(
		async (calculation: TCalculation) => {
			const { formData, name } = calculation;

			setActiveCalculation(calculation);
			setImportModalOpen(false);
			form.reset(fromBaseUnits(formData));

			// Stored values may be invalid (e.g. saved before stricter validation), so only
			// calculate if they pass the form schema. Otherwise show the field errors to fix.
			if (await form.trigger()) {
				toast.success(`${name} imported`);
				setReport(calcFn(formData));
			} else {
				toast.error(`${name} has invalid values. Fix them and calculate again.`);
				setReport(null);
			}
		},
		[setActiveCalculation, setImportModalOpen, setReport, calcFn, form, fromBaseUnits]
	);

	const handleImportStart = useCallback(() => {
		if (isAuthenticated) {
			setImportModalOpen(true);
		} else {
			toast.error('Please login to import a calculation');
		}
	}, [isAuthenticated, setImportModalOpen]);

	const ifFieldIsEmpty = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
		return e.target.value === '';
	}, []);

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
		ifFieldIsEmpty,
		closeRenameModal,
		handleImportStart,
		closeImportModal,
	};
};

export default useCalculator;
