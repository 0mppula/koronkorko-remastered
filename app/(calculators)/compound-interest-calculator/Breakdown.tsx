'use client';

import ReportSummaryContainer from '@/components/Form/ReportSummaryContainer';
import {
	ICompoundInterestChartData,
	createCounpoundInterestChartData,
} from '@/lib/createCounpoundInterestChartData';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import BreakdownControls from './BreakdownControls';
import { ReportProps } from './Calculator';

const Breakdown = ({ report }: ReportProps) => {
	const [visualizationType, setVisualizationType] = useState<'chart' | 'table'>('chart');
	const [breakdownInterval, setBreakdownInterval] = useState<'monthly' | 'yearly'>('yearly');

	const {
		startingBalance,
		contribution,
		contributionFrequency,
		interestRate,
		duration,
		durationMultiplier,
		contributionMultiplier,
		compoundFrequency,
	} = report;

	const queryClient = useQueryClient();
	useEffect(() => {
		if (report) {
			queryClient.invalidateQueries({
				queryKey: ['COMPOUND_INTEREST_CALCULATION_BREAKDOWN', report],
			});
		}
	}, [report]);

	const { data: chartData, isLoading: isChartDataLoading } = useQuery<
		ICompoundInterestChartData[]
	>({
		queryKey: ['COMPOUND_INTEREST_CALCULATION_BREAKDOWN', report],
		queryFn: () =>
			createCounpoundInterestChartData({
				compoundFrequency,
				contribution,
				contributionFrequency,
				contributionMultiplier,
				duration,
				durationMultiplier,
				interestRate,
				startingBalance,
			}),
		refetchOnWindowFocus: false,
	});

	const filterChartBreakdownByInterval = useCallback(
		(data: ICompoundInterestChartData[]) => {
			// Filter data array so that the first and the last elements stay
			// Additionally filter elements either yearly (1/12) or monthly (1/1)
			const filterFrequency = breakdownInterval === 'yearly' ? 12 : 1;
			let lastInsertIndex = 0;

			const filtered: ICompoundInterestChartData[] = [];

			data.forEach((el, i) => {
				if (i === 0) {
					// Always add the fist element
					filtered.push(el);
				} else if (i === data.length - 1) {
					// Always add the last element
					filtered.push(el);
				} else if (i === lastInsertIndex + filterFrequency) {
					// Add elements depending on breakdown frequency
					filtered.push(el);
					lastInsertIndex = i;
				}
			});

			return filtered;
		},
		[breakdownInterval]
	);

	const filteredChartData = useMemo(() => {
		if (chartData) {
			return filterChartBreakdownByInterval(chartData);
		}
		return [];
	}, [chartData, breakdownInterval]);

	return (
		<ReportSummaryContainer isLoading={isChartDataLoading} title="Breakdown">
			<BreakdownControls
				visualizationType={visualizationType}
				setVisualizationType={setVisualizationType}
				breakdownInterval={breakdownInterval}
				setBreakdownInterval={setBreakdownInterval}
			/>
		</ReportSummaryContainer>
	);
};

export default Breakdown;
