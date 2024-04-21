import { HasId } from '@/types/calculations';
import { MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

const useUpdateCalculationMutation = <TCalculation extends HasId>(
	queryKey: string,
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>,
	mutationFn: MutationFunction<TCalculation, TCalculation>
) => {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn,
		onMutate(variables) {
			const prevCalculations: TCalculation[] | undefined = queryClient.getQueryData([
				queryKey,
			]);

			const uneditedCalculation = prevCalculations?.find(
				(record) => record.id === variables.id
			);

			queryClient.setQueryData<TCalculation[]>([queryKey], (old) => {
				if (!old) return;

				const index = old.findIndex((record) => record.id === variables.id);

				old.splice(index, 1, variables);

				return old;
			});

			setActiveCalculation(variables);

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
