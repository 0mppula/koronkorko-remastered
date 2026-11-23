'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue } from '@/lib/units';
import { formatHoursMinutes } from '@/lib/utils';
import { TimeSpeedDistanceReportProps } from '@/types/calculations';

interface ReportProps {
	report: TimeSpeedDistanceReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const { solveFor, distance, groundspeed, time } = report;

	const groups = [
		{
			field: 'distance',
			header: 'Distance',
			value: formatBaseValue(distance, 'distance', units.distance),
		},
		{
			field: 'groundspeed',
			header: 'Groundspeed',
			value: formatBaseValue(groundspeed, 'speed', units.speed),
		},
		{ field: 'time', header: 'Time', value: formatHoursMinutes(time) },
	];

	const solved = groups.find((group) => group.field === solveFor);

	return (
		<ReportSection>
			{groups
				.filter((group) => group !== solved)
				.map(({ field, header, value }) => (
					<ReportGroup key={field} header={header} value={value} />
				))}

			<ReportDivider />

			{solved && <ReportGroup header={solved.header} value={solved.value} />}

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
