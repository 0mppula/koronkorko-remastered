import { ISaveCalculationParam } from '@/lib/queryFns/markup-calculations';
import { MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import useLoadingStore from './useLoadingStore';

const useSaveCalculationMutation = <TCalculation, TFormData>(
	queryKey: string,
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>,
	mutationFn: MutationFunction<TCalculation, ISaveCalculationParam<TFormData>>,
	setSaveModalOpen: (value: SetStateAction<boolean>) => void
) => {
	const queryClient = useQueryClient();
	const { setIsGlobalLoading } = useLoadingStore();

	const mutation = useMutation<TCalculation, unknown, ISaveCalculationParam<TFormData>>({
		mutationFn,
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

	return mutation;
};

export default useSaveCalculationMutation;
