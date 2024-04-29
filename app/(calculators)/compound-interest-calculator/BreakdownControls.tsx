'use client';

import { ButtonWithIcon } from '@/components/ButtonWithIcon';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ICompoundInterestTableData } from '@/lib/createCounpoundInterestChartData';
import { format } from 'date-fns';
import xlsx, { IJsonSheet, ISettings } from 'json-as-xlsx';
import { Download } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ReportProps } from './Calculator';

interface BreakdownControlsProps extends ReportProps {
	isLoading: boolean;
	visualizationType: 'chart' | 'table';
	setVisualizationType: (value: 'chart' | 'table') => void;
	breakdownInterval: 'monthly' | 'yearly';
	setBreakdownInterval: (value: 'monthly' | 'yearly') => void;
	data: ICompoundInterestTableData[];
}

const BreakdownControls = ({
	isLoading,
	breakdownInterval,
	setBreakdownInterval,
	setVisualizationType,
	visualizationType,
	data,
	report,
}: BreakdownControlsProps) => {
	const [canGenerateXlsx, setCanGenerateXlsx] = useState(true);

	const session = useSession();

	const isDepositting = report.contributionMultiplier === 1;

	// Rate limit the excel download.
	useEffect(() => {
		let rateLimit: NodeJS.Timeout;

		if (!canGenerateXlsx) {
			rateLimit = setTimeout(() => {
				setCanGenerateXlsx(true);

				toast.success('Data exported in excel format');
			}, 500);
		}

		return () => {
			clearTimeout(rateLimit);
		};
	}, [canGenerateXlsx]);

	const handleBreakdownIntervalChange = (value: 'yearly' | 'monthly') => {
		setBreakdownInterval(value);
	};

	const handleVisualizationTypeChange = (value: 'chart' | 'table') => {
		setVisualizationType(value);
	};

	const downloadToExcel = async () => {
		if (session.status !== 'authenticated') {
			toast.error('Pleae sign in to download your data.');
			return;
		}

		const workbook = await new Promise((resolve) => {
			setCanGenerateXlsx(false);
			try {
				const columns: IJsonSheet[] = [
					{
						sheet: 'Compound Interest Breakdown',
						columns: [
							{
								label: breakdownInterval === 'yearly' ? 'Year' : 'Month',
								value: (row) => row?.i,
							},
							{
								label: isDepositting ? 'Deposit' : 'Withdrawal',
								value: (row) => row?.contributions,
							},
							{
								label: 'Interest',
								value: (row) => row?.interest,
							},
							{
								label: `Total ${isDepositting ? 'Deposits' : 'Withdrawals'}`,
								value: (row) => row?.totalContributions,
							},
							{
								label: 'Total Interest',
								value: (row) => row?.totalInterest,
							},
							{
								label: 'Balance',
								value: (row) => row?.balance,
							},
						], // @ts-ignore
						content: data,
					},
				];

				const settings: ISettings = {
					fileName: `compound-interest-breakdown-${format(new Date(), 'yyyy-MM-dd')}`,
				};

				resolve(xlsx(columns, settings));
			} catch (error) {
				toast.error('Error exporting data to excel. Please try again.');
			}
		});

		return workbook;
	};

	return (
		<div className="flex flex-col gap-4 sm:flex-row w-full">
			<Tabs
				onValueChange={(value) =>
					handleBreakdownIntervalChange(value as 'monthly' | 'yearly')
				}
				value={breakdownInterval}
				className="w-full"
			>
				<TabsList className="w-full h-11">
					<TabsTrigger value="yearly" className="w-full" disabled={isLoading}>
						Yearly
					</TabsTrigger>

					<TabsTrigger value="monthly" className="w-full" disabled={isLoading}>
						Monthly
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<Tabs
				onValueChange={(value) => handleVisualizationTypeChange(value as 'chart' | 'table')}
				value={visualizationType}
				className="w-full"
			>
				<TabsList className="w-full h-11">
					<TabsTrigger value="chart" className="w-full" disabled={isLoading}>
						Chart
					</TabsTrigger>
					<TabsTrigger value="table" className="w-full" disabled={isLoading}>
						Table
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<ButtonWithIcon
				disabled={!canGenerateXlsx || isLoading}
				onClick={downloadToExcel}
				className="h-11"
				loading={!canGenerateXlsx}
				icon={Download}
			>
				<span aria-hidden>.xlsx</span>
				<span className="sr-only">Download breakdown as .xlsx</span>
			</ButtonWithIcon>
		</div>
	);
};

export default BreakdownControls;
