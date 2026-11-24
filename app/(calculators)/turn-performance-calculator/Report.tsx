'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { FOOT_IN_METRES, formatBaseValue, NAUTICAL_MILE_IN_METRES } from '@/lib/units';
import { formatMinutesSeconds } from '@/lib/utils';
import { TurnPerformanceReportProps } from '@/types/calculations';

interface ReportProps {
	report: TurnPerformanceReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		trueAirspeed,
		bankAngle,
		stallSpeed,
		rateOfTurn,
		turnRadius,
		loadFactor,
		fullTurnTime,
		standardRateBankAngle,
		stallSpeedInTurn,
	} = report;

	const formatSpeed = (baseValue: number) => formatBaseValue(baseValue, 'speed', units.speed);
	const radiusInNauticalMiles = (turnRadius * FOOT_IN_METRES) / NAUTICAL_MILE_IN_METRES;

	return (
		<ReportSection>
			<ReportGroup header="True Airspeed" value={formatSpeed(trueAirspeed)} />

			<ReportGroup header="Bank Angle" value={`${Number(bankAngle.toFixed(2))}°`} />

			{stallSpeed != null && (
				<ReportGroup header="Stall Speed" value={formatSpeed(stallSpeed)} />
			)}

			<ReportDivider />

			<ReportGroup header="Rate of Turn" value={`${rateOfTurn.toFixed(2)}°/s`} />

			<ReportGroup
				header="Turn Radius"
				value={`${formatBaseValue(turnRadius, 'altitude', units.altitude)} (${formatBaseValue(radiusInNauticalMiles, 'distance', units.distance)})`}
			/>

			<ReportGroup header="Load Factor" value={`${loadFactor.toFixed(2)} G`} />

			<ReportGroup header="Time for 360°" value={formatMinutesSeconds(fullTurnTime)} />

			<ReportGroup
				header="Standard-Rate Bank Angle"
				value={`${standardRateBankAngle.toFixed(1)}°`}
			/>

			{stallSpeedInTurn !== null && (
				<ReportGroup
					header="Stall Speed in the Turn"
					value={formatSpeed(stallSpeedInTurn)}
				/>
			)}

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
