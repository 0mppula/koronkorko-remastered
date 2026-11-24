'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue } from '@/lib/units';
import { formatHoursMinutes } from '@/lib/utils';
import { DescentPlanningReportProps } from '@/types/calculations';

interface ReportProps {
	report: DescentPlanningReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		solveFor,
		descentInput,
		currentAltitude,
		targetAltitude,
		groundspeed,
		distance,
		verticalSpeed,
		descentAngle,
		descentTime,
		gradientPercent,
		gradientFeetPerNm,
	} = report;

	const isTopOfDescent = solveFor === 'topOfDescent';
	const formatAltitude = (baseValue: number) =>
		formatBaseValue(baseValue, 'altitude', units.altitude);
	const formattedDistance = formatBaseValue(distance, 'distance', units.distance);
	const formattedVerticalSpeed = formatBaseValue(
		verticalSpeed,
		'verticalSpeed',
		units.verticalSpeed
	);
	const formattedGradientFeetPerNm = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 0,
	}).format(gradientFeetPerNm);

	return (
		<ReportSection>
			<ReportGroup header="Current Altitude" value={formatAltitude(currentAltitude)} />

			<ReportGroup header="Target Altitude" value={formatAltitude(targetAltitude)} />

			<ReportGroup
				header="Groundspeed"
				value={formatBaseValue(groundspeed, 'speed', units.speed)}
			/>

			{isTopOfDescent && descentInput === 'verticalSpeed' && (
				<ReportGroup header="Vertical Speed" value={formattedVerticalSpeed} />
			)}

			{isTopOfDescent && descentInput === 'angle' && (
				<ReportGroup header="Descent Angle" value={`${Number(descentAngle.toFixed(2))}°`} />
			)}

			{!isTopOfDescent && <ReportGroup header="Distance" value={formattedDistance} />}

			<ReportDivider />

			{isTopOfDescent ? (
				<ReportGroup
					header="Top of Descent"
					value={`Start descent ${formattedDistance} before the target`}
				/>
			) : (
				<ReportGroup header="Required Vertical Speed" value={formattedVerticalSpeed} />
			)}

			{isTopOfDescent && descentInput === 'angle' && (
				<ReportGroup header="Vertical Speed" value={formattedVerticalSpeed} />
			)}

			<ReportGroup header="Time to Descend" value={formatHoursMinutes(descentTime)} />

			<ReportGroup
				header="Descent Gradient"
				value={`${gradientPercent.toFixed(2)} % (${formattedGradientFeetPerNm} ft/NM, ${descentAngle.toFixed(2)}°)`}
			/>

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
