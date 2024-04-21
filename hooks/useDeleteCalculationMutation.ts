import { MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

interface HasId {
	id: string;
}

const useDeleteCalculationMutation = <TReportProps, TCalculation extends HasId, TVariables = void>(
	queryKey: string,
	activeCalculation: TCalculation | null,
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>,
	setReport: Dispatch<SetStateAction<TReportProps | null>>,
	mutationFn: MutationFunction<TCalculation, TVariables>
) => {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation<TCalculation, unknown, TVariables>({
		mutationFn,
		onMutate: (id) => {
			const prevCalculations: TCalculation[] | undefined = queryClient.getQueryData([
				queryKey,
			]);

			queryClient.setQueryData<TCalculation[]>([queryKey], (old) => {
				return old?.filter((record) => record.id !== id);
			});

			return { prevCalculations };
		},
		onSuccess: (variables) => {
			toast.success('Calculation deleted');

			if (activeCalculation?.id === variables.id) {
				setActiveCalculation(null);
				setReport(null);
			}
		},
		onError: () => {
			toast.error(
				'Something went wrong while deleting your calculation. Please try again later.'
			);

			queryClient.invalidateQueries({ queryKey: [queryKey] });
		},
	});

	return deleteMutation;
};

export default useDeleteCalculationMutation;
