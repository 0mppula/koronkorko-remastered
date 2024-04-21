import { IUpdateCalculationParam } from '@/lib/queryFns/markup-calculations';
import { IHasFormData } from '@/types/calculations';
import { MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

const useUpdateCalculationMutation = <TFormData, TCalculation extends IHasFormData<TFormData>>(
	queryKey: string,
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>,
	mutationFn: MutationFunction<TCalculation, IUpdateCalculationParam<TFormData, TCalculation>>
) => {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn,
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

	return mutation;
};

export default useUpdateCalculationMutation;
