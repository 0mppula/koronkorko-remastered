import { IDeleteCalculationParam } from '@/lib/queryFns/markup-calculations';
import { IHasId } from '@/types/calculations';
import { MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

const useDeleteCalculationMutation = <TReportProps, TCalculation extends IHasId>(
	queryKey: string,
	activeCalculation: TCalculation | null,
	setActiveCalculation: Dispatch<SetStateAction<TCalculation | null>>,
	setReport: Dispatch<SetStateAction<TReportProps | null>>,
	mutationFn: MutationFunction<TCalculation, IDeleteCalculationParam>
) => {
	const queryClient = useQueryClient();

	const mutation = useMutation<TCalculation, unknown, IDeleteCalculationParam>({
		mutationFn,
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
			}
		},
		onError: () => {
			toast.error(
				'Something went wrong while deleting your calculation. Please try again later.'
			);

			queryClient.invalidateQueries({ queryKey: [queryKey] });
		},
	});

	return mutation;
};

export default useDeleteCalculationMutation;
