'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue, formatUnsignedTemperatureDifference } from '@/lib/units';
import { CloudBaseReportProps } from '@/types/calculations';

interface ReportProps {
	report: CloudBaseReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const { temperature, dewPoint, elevation, spread, cloudBaseAgl, cloudBaseMsl } = report;

	const formatAltitude = (baseValue: number) =>
		formatBaseValue(baseValue, 'altitude', units.altitude);
	const formatTemperature = (baseValue: number) =>
		formatBaseValue(baseValue, 'temperature', units.temperature);

	return (
		<ReportSection>
			<ReportGroup header="Temperature" value={formatTemperature(temperature)} />

			<ReportGroup header="Dew Point" value={formatTemperature(dewPoint)} />

			{elevation != null && (
				<ReportGroup header="Field Elevation" value={formatAltitude(elevation)} />
			)}

			<ReportDivider />

			<ReportGroup
				header="Temperature/Dew Point Spread"
				value={formatUnsignedTemperatureDifference(spread, units.temperature)}
			/>

			<ReportGroup header="Cloud Base (AGL)" value={formatAltitude(cloudBaseAgl)} />

			{cloudBaseMsl !== null && (
				<ReportGroup header="Cloud Base (MSL)" value={formatAltitude(cloudBaseMsl)} />
			)}

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
