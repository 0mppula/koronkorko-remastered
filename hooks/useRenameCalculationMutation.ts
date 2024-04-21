import { HasId } from '@/types/calculations';
import { MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

const useRenameCalculationMutation = <TCalculation extends HasId>(
	queryKey: string,
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>,
	setRenameModalOpen: (value: SetStateAction<boolean>) => void,
	mutationFn: MutationFunction<TCalculation, TCalculation>
) => {
	const queryClient = useQueryClient();

	const renameMutation = useMutation({
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

	return renameMutation;
};

export default useRenameCalculationMutation;
