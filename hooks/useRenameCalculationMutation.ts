import { IRenameCalculationParam } from '@/lib/queryFns/markup-calculations';
import { IHasId } from '@/types/calculations';
import { MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

const useRenameCalculationMutation = <TCalculation extends IHasId>(
	queryKey: string,
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>,
	setRenameModalOpen: (value: SetStateAction<boolean>) => void,
	mutationFn: MutationFunction<TCalculation, IRenameCalculationParam<TCalculation>>
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

	return mutation;
};

export default useRenameCalculationMutation;
