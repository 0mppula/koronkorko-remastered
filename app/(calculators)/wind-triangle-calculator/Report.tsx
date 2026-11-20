'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue, formatDegrees } from '@/lib/units';
import { WindTriangleReportProps } from '@/types/calculations';

interface ReportProps {
	report: WindTriangleReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		trueCourse,
		trueAirspeed,
		windDirection,
		windSpeed,
		windCorrectionAngle,
		trueHeading,
		groundspeed,
	} = report;

	const formatSpeed = (baseValue: number) => formatBaseValue(baseValue, 'speed', units.speed);

	// The side comes from the displayed whole degrees, so 000° has no side.
	const correctionSide =
		Math.round(Math.abs(windCorrectionAngle)) === 0
			? ''
			: windCorrectionAngle > 0
				? ' right'
				: ' left';

	return (
		<ReportSection>
			<ReportGroup
				header="True Course"
				value={formatDegrees(trueCourse, { heading: true })}
			/>

			<ReportGroup header="True Airspeed" value={formatSpeed(trueAirspeed)} />

			<ReportGroup
				header="Wind"
				value={`${formatDegrees(windDirection, { heading: true })} at ${formatSpeed(windSpeed)}`}
			/>

			<ReportDivider />

			<ReportGroup
				header="Wind Correction Angle"
				value={`${formatDegrees(windCorrectionAngle)}${correctionSide}`}
			/>

			<ReportGroup
				header="True Heading"
				value={formatDegrees(trueHeading, { heading: true })}
			/>

			<ReportGroup header="Groundspeed" value={formatSpeed(groundspeed)} />

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
