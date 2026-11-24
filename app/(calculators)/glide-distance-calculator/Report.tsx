'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import { windTypes } from '@/constants/data';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue } from '@/lib/units';
import { formatHoursMinutes } from '@/lib/utils';
import { GlideDistanceReportProps } from '@/types/calculations';

interface ReportProps {
	report: GlideDistanceReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		altitude,
		terrainElevation,
		glideRatio,
		glideTrueAirspeed,
		windSpeed,
		windType,
		height,
		glideDistance,
		groundspeed,
		glideTime,
	} = report;

	const formatAltitude = (baseValue: number) =>
		formatBaseValue(baseValue, 'altitude', units.altitude);
	const formatSpeed = (baseValue: number) => formatBaseValue(baseValue, 'speed', units.speed);
	const windLabel = windTypes.find((type) => type.value === windType)?.label;

	return (
		<ReportSection>
			<ReportGroup header="Altitude" value={formatAltitude(altitude)} />

			<ReportGroup header="Terrain Elevation" value={formatAltitude(terrainElevation)} />

			<ReportGroup header="Glide Ratio" value={`${Number(glideRatio.toFixed(2))}:1`} />

			{glideTrueAirspeed != null && (
				<ReportGroup header="Glide True Airspeed" value={formatSpeed(glideTrueAirspeed)} />
			)}

			{windSpeed != null && windSpeed > 0 && windLabel && (
				<ReportGroup header={windLabel} value={formatSpeed(windSpeed)} />
			)}

			<ReportDivider />

			<ReportGroup header="Height Above Terrain" value={formatAltitude(height)} />

			<ReportGroup
				header="Glide Distance"
				value={formatBaseValue(glideDistance, 'distance', units.distance)}
			/>

			{groundspeed !== null && (
				<ReportGroup header="Groundspeed" value={formatSpeed(groundspeed)} />
			)}

			{glideTime !== null && (
				<ReportGroup header="Glide Time" value={formatHoursMinutes(glideTime)} />
			)}

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
