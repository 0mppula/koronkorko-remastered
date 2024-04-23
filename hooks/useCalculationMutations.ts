import { QUERY_KEYS } from '@/constants/api';
import {
	IDeleteCalculationParam,
	IRenameCalculationParam,
	ISaveCalculationParam,
	IUpdateCalculationParam,
} from '@/lib/queryFns/calculations';
import { IHasFormDataAndName } from '@/types/calculations';
import { MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import useLoadingStore from './useLoadingStore';

interface IUseCalculationMutations<
	TFormData extends FieldValues,
	TReportProps,
	TCalculation extends IHasFormDataAndName<TFormData>
> {
	queryKey: (typeof QUERY_KEYS)[number];
	activeCalculation: TCalculation | null;
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>;
	setReport: Dispatch<SetStateAction<TReportProps | null>>;
	setSaveModalOpen: (value: SetStateAction<boolean>) => void;
	setRenameModalOpen: (value: SetStateAction<boolean>) => void;
	deleteMutationFn: MutationFunction<TCalculation, IDeleteCalculationParam>;
	renameMutationFn: MutationFunction<TCalculation, IRenameCalculationParam<TCalculation>>;
	saveMutationFn: MutationFunction<TCalculation, ISaveCalculationParam<TFormData>>;
	updateMutationFn: MutationFunction<
		TCalculation,
		IUpdateCalculationParam<TFormData, TCalculation>
	>;
	form: UseFormReturn<TFormData, any, undefined>;
	defaultValues: TFormData;
}

const useCalculationMutations = <
	TFormData extends FieldValues,
	TReportProps,
	TCalculation extends IHasFormDataAndName<TFormData>
>({
	queryKey,
	activeCalculation,
	setActiveCalculation,
	setReport,
	setSaveModalOpen,
	setRenameModalOpen,
	deleteMutationFn,
	renameMutationFn,
	saveMutationFn,
	updateMutationFn,
	form,
	defaultValues,
}: IUseCalculationMutations<TFormData, TReportProps, TCalculation>) => {
	const queryClient = useQueryClient();
	const { setIsGlobalLoading } = useLoadingStore();

	const saveMutation = useMutation<TCalculation, unknown, ISaveCalculationParam<TFormData>>({
		mutationFn: saveMutationFn,
		onMutate: () => {
			setIsGlobalLoading(true);
		},
		onSuccess: (calculation) => {
			toast.success('Calculation created');
			setActiveCalculation(calculation);
			setSaveModalOpen(false);
		},
		onError: () => {
			toast.error(
				'Something went wrong while saving your calculation. Please try again later.'
			);
		},
		onSettled: () => {
			setIsGlobalLoading(false);
			queryClient.invalidateQueries({ queryKey: [queryKey] });
		},
	});

	const deleteMutation = useMutation<TCalculation, unknown, IDeleteCalculationParam>({
		mutationFn: deleteMutationFn,
		onMutate: (params) => {
			const prevCalculations: TCalculation[] | undefined = queryClient.getQueryData([
				queryKey,
			]);

			queryClient.setQueryData<TCalculation[]>([queryKey], (old) => {
				return old?.filter((record) => record.id !== params.id);
			});

			return { prevCalculations };
		},
		onSuccess: (variables) => {
			toast.success('Calculation deleted');

			if (activeCalculation?.id === variables.id) {
				setActiveCalculation(null);
				setReport(null);
				form.reset(defaultValues);
			}
		},
		onError: () => {
			toast.error(
				'Something went wrong while deleting your calculation. Please try again later.'
			);

			queryClient.invalidateQueries({ queryKey: [queryKey] });
		},
	});

	const renameMutation = useMutation({
		mutationFn: renameMutationFn,
		onMutate(params) {
			const prevCalculations: TCalculation[] | undefined = queryClient.getQueryData([
				queryKey,
			]);

			const uneditedCalculation = prevCalculations?.find(
				(record) => record.id === params.updatedCalculation.id
			);

			queryClient.setQueryData<TCalculation[]>([queryKey], (old) => {
				if (!old) return;

				const index = old.findIndex((record) => record.id === params.updatedCalculation.id);

				old.splice(index, 1, params.updatedCalculation);

				return old;
			});

			setActiveCalculation(params.updatedCalculation);
			setRenameModalOpen(false);

			return { uneditedCalculation };
		},
		onSuccess: () => {
			toast.success('Calculation renamed');
		},
		onError: (err, _, context) => {
			toast.error(
				'Something went wrong while renaming your calculation. Please try again later.'
			);

			setActiveCalculation(context?.uneditedCalculation || null);
			setRenameModalOpen(true);

			queryClient.invalidateQueries({ queryKey: [queryKey] });
		},
	});

	const updateMutation = useMutation({
		mutationFn: updateMutationFn,
		onMutate(params) {
			const prevCalculations: TCalculation[] | undefined = queryClient.getQueryData([
				queryKey,
			]);

			const uneditedCalculation = prevCalculations?.find(
				(record) => record.id === params.updatedCalculation.id
			);

			queryClient.setQueryData<TCalculation[]>([queryKey], (old) => {
				if (!old) return;

				const index = old.findIndex((record) => record.id === params.updatedCalculation.id);

				old.splice(index, 1, params.updatedCalculation);

				return old;
			});

			setActiveCalculation(params.updatedCalculation);

			return { uneditedCalculation };
		},
		onSuccess: () => {
			toast.success('Calculation updated');
		},
		onError: (err, _, context) => {
			toast.error(
				'Something went wrong while saving your calculation. Please try again later.'
			);

			setActiveCalculation(context?.uneditedCalculation || null);

			queryClient.invalidateQueries({ queryKey: [queryKey] });
		},
	});

	return { saveMutation, deleteMutation, renameMutation, updateMutation };
};

export default useCalculationMutations;
