'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue, formatTemperatureDifference } from '@/lib/units';
import { DensityAltitudeReportProps } from '@/types/calculations';

interface ReportProps {
	report: DensityAltitudeReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		fieldElevation,
		qnh,
		outsideAirTemperature,
		pressureAltitude,
		isaTemperature,
		isaDeviation,
		densityAltitude,
	} = report;

	const formatAltitude = (baseValue: number) =>
		formatBaseValue(baseValue, 'altitude', units.altitude);
	const formatTemperature = (baseValue: number) =>
		formatBaseValue(baseValue, 'temperature', units.temperature);

	return (
		<ReportSection>
			<ReportGroup header="Field Elevation" value={formatAltitude(fieldElevation)} />

			<ReportGroup header="QNH" value={formatBaseValue(qnh, 'pressure', units.pressure)} />

			<ReportGroup
				header="Outside Air Temperature"
				value={formatTemperature(outsideAirTemperature)}
			/>

			<ReportDivider />

			<ReportGroup header="Pressure Altitude" value={formatAltitude(pressureAltitude)} />

			<ReportGroup header="ISA Temperature" value={formatTemperature(isaTemperature)} />

			<ReportGroup
				header="ISA Deviation"
				value={formatTemperatureDifference(isaDeviation, units.temperature)}
			/>

			<ReportGroup header="Density Altitude" value={formatAltitude(densityAltitude)} />

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
