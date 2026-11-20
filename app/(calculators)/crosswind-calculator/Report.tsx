'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue, formatDegrees, fromBaseUnit, unitFractionDigits } from '@/lib/units';
import { CrosswindReportProps } from '@/types/calculations';

interface ReportProps {
	report: CrosswindReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		runwayHeading,
		windDirection,
		windSpeed,
		gustSpeed,
		crosswind,
		headwind,
		gustCrosswind,
		gustHeadwind,
	} = report;

	// Signs come from the displayed value, so a value shown as 0.0 has no side and is a headwind.
	const toDisplayed = (baseValue: number) =>
		Number(fromBaseUnit(baseValue, 'speed', units.speed).toFixed(unitFractionDigits.speed));

	const formatSpeed = (baseValue: number) => formatBaseValue(baseValue, 'speed', units.speed);

	const formatCrosswind = (baseValue: number) => {
		const displayed = toDisplayed(baseValue);
		const side = displayed > 0 ? ' from the right' : displayed < 0 ? ' from the left' : '';

		return `${formatSpeed(Math.abs(baseValue))}${side}`;
	};

	const headwindLabel = (baseValue: number) =>
		toDisplayed(baseValue) < 0 ? 'Tailwind' : 'Headwind';

	const hasGust = gustSpeed !== undefined && gustSpeed !== null;

	return (
		<ReportSection>
			<ReportGroup
				header="Runway Heading"
				value={formatDegrees(runwayHeading, { heading: true })}
			/>

			<ReportGroup
				header="Wind"
				value={`${formatDegrees(windDirection, { heading: true })} at ${formatSpeed(windSpeed)}${
					hasGust ? ` gusting ${formatSpeed(gustSpeed)}` : ''
				}`}
			/>

			<ReportDivider />

			<ReportGroup header="Crosswind" value={formatCrosswind(crosswind)} />

			<ReportGroup header={headwindLabel(headwind)} value={formatSpeed(Math.abs(headwind))} />

			{hasGust && gustCrosswind !== undefined && gustHeadwind !== undefined && (
				<>
					<ReportGroup header="Gust Crosswind" value={formatCrosswind(gustCrosswind)} />

					<ReportGroup
						header={`Gust ${headwindLabel(gustHeadwind)}`}
						value={formatSpeed(Math.abs(gustHeadwind))}
					/>
				</>
			)}

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
