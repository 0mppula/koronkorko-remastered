'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { ISA_TROPOPAUSE_ALTITUDE_M } from '@/lib/calculatorFns';
import { formatBaseValue, toBaseUnit } from '@/lib/units';
import { TrueAirspeedReportProps } from '@/types/calculations';

interface ReportProps {
	report: TrueAirspeedReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		calibratedAirspeed,
		pressureAltitude,
		outsideAirTemperature,
		mach,
		trueAirspeed,
		densityAltitude,
	} = report;

	const formatSpeed = (baseValue: number) => formatBaseValue(baseValue, 'speed', units.speed);
	const formatAltitude = (baseValue: number) =>
		formatBaseValue(baseValue, 'altitude', units.altitude);

	const tropopause = toBaseUnit(ISA_TROPOPAUSE_ALTITUDE_M, 'altitude', 'm');

	return (
		<ReportSection>
			<ReportGroup header="Calibrated Airspeed" value={formatSpeed(calibratedAirspeed)} />

			<ReportGroup header="Pressure Altitude" value={formatAltitude(pressureAltitude)} />

			<ReportGroup
				header="Outside Air Temperature"
				value={formatBaseValue(outsideAirTemperature, 'temperature', units.temperature)}
			/>

			<ReportDivider />

			<ReportGroup header="True Airspeed" value={formatSpeed(trueAirspeed)} />

			<ReportGroup header="Mach Number" value={mach.toFixed(3)} />

			<ReportGroup
				header="Density Altitude"
				value={
					densityAltitude === null
						? `Above ${formatAltitude(tropopause)} (not calculated)`
						: formatAltitude(densityAltitude)
				}
			/>

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
