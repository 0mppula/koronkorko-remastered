'use client';

import useCurrencyStore from '@/hooks/useCurrency';
import { ICompoundInterestChartData } from '@/lib/createCounpoundInterestChartData';
import { getCssVarVal } from '@/lib/getCssVarVal';
import { formatCurrency, formatCurrencyK } from '@/lib/utils';
import { useEffect, useState } from 'react';

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { ReportProps } from './Calculator';

interface BreakdownChartProps extends ReportProps {
	data: ICompoundInterestChartData[];
	breakdownInterval: 'monthly' | 'yearly';
}

const BreakdownChart = ({ report, data, breakdownInterval }: BreakdownChartProps) => {
	const [longestTick, setLongestTick] = useState('');

	const { currency } = useCurrencyStore();

	// Suppress the warning about defaultProps
	useEffect(() => {
		const originalConsoleError = console.error;

		console.error = (...args: any[]) => {
			const rechartsWarning = /Warning: Cannot update a component/.test(args[0]);

			if ((typeof args[0] === 'string' && /defaultProps/.test(args[0])) || rechartsWarning) {
				return;
			}

			originalConsoleError(...args);
		};

		return () => {
			console.error = originalConsoleError;
		};
	}, []);

	const isDepositting = report.contributionMultiplier === 1;

	const cardColor = getCssVarVal('--card');
	const primaryColor = getCssVarVal('--primary');
	const desctrutiveColor = getCssVarVal('--destructive');
	const successColor = getCssVarVal('--success');
	const foregroundColor = getCssVarVal('--foreground');
	const primaryNeutralColor = getCssVarVal('--primary-neutral');

	const totalPrincipalColor = foregroundColor;
	const totalContributionsColor = isDepositting ? successColor : desctrutiveColor;
	const totalInterestColor = primaryColor;
	const chartLinesColor = primaryNeutralColor;

	const legendFormatter = (value: string, _: any) => {
		return (
			<span className="font-semibold" style={{ color: foregroundColor }}>
				{value}
			</span>
		);
	};

	const tickFormatter = (val: number) => {
		const formattedTick = `${formatCurrencyK(val, currency)}`;

		if (longestTick.length < formattedTick.length) {
			setLongestTick(formattedTick);
		}

		return formattedTick;
	};

	const tooltipLabelFormatter = (label: any) => {
		if (breakdownInterval === 'yearly') {
			return (
				<span className="font-semibold">{`Year ${
					(label + 1) % 12 === 0 ? label / 12 : label
				}`}</span>
			);
		} else {
			return <span className="font-semibold">{`Month ${label}`}</span>;
		}
	};

	const tooltipFormatter = (value: number, _: any, props: any) => {
		let formattedValue;

		formattedValue = formatCurrency(value, currency);

		return [
			<div
				key={`${props?.name}-${formattedValue}`}
				className="flex gap-1 items-center justify-start"
			>
				<div
					className="w-[14px] h-[10.5px]"
					style={{
						background: props.color,
					}}
				/>
				<span className="text-foreground">{`${props?.name}: ${formattedValue}`}</span>
			</div>,
		];
	};

	const getYAxisTickLen = () => {
		const charWidth = 8;
		return longestTick.length * charWidth + 10;
	};

	const totalContributionsTotalInterestBars = [
		<Bar
			key="totalContributions"
			name={`${isDepositting ? 'Total Deposits' : 'Total Withdrawals'}`}
			dataKey="totalContributions"
			stackId="a"
			fill={totalContributionsColor}
		/>,
		<Bar
			key="totalInterest"
			name="Total Interest"
			dataKey="totalInterest"
			stackId="a"
			fill={totalInterestColor}
		/>,
	];

	return (
		<>
			<div className="h-[416px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						stackOffset="sign"
						data={data}
						margin={{
							top: 12,
							right: 0,
							left: 0,
							bottom: 0,
						}}
					>
						<Legend
							verticalAlign="top"
							height={48}
							formatter={legendFormatter}
							wrapperStyle={{
								fontSize: 14,
								color: foregroundColor,
								fill: foregroundColor,
							}}
						/>

						<CartesianGrid vertical={false} stroke={chartLinesColor} />

						<XAxis
							dataKey={breakdownInterval === 'yearly' ? 'year' : 'month'}
							stroke={foregroundColor}
							fontSize={13}
							tickLine={false}
							axisLine={{ stroke: chartLinesColor }}
							interval="preserveStartEnd"
							label={{
								value: breakdownInterval === 'yearly' ? 'Year' : 'Month',
								position: 'insideBottom',
								fill: foregroundColor,
								fontSize: 13,
							}}
							height={48}
						/>

						<YAxis
							tickCount={10}
							stroke={foregroundColor}
							tickFormatter={tickFormatter}
							width={getYAxisTickLen()}
							fontSize={13}
							tickLine={false}
							axisLine={{ stroke: 'transparent' }}
						/>

						{/* @ts-ignore */}
						<Tooltip
							cursor={false}
							labelFormatter={tooltipLabelFormatter}
							formatter={tooltipFormatter}
							contentStyle={{
								borderRadius: '8px',
								backgroundColor: cardColor,
								borderColor: primaryColor,
								fontSize: '14px',
							}}
						/>

						<Legend />

						<Bar
							dataKey="totalPrincipal"
							stackId="a"
							fill={totalPrincipalColor}
							name="Total Principal"
						/>

						{isDepositting
							? totalContributionsTotalInterestBars
							: totalContributionsTotalInterestBars.reverse()}
					</BarChart>
				</ResponsiveContainer>
			</div>
		</>
	);
};

export default BreakdownChart;
