'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue, getPairedFuelUnit, getUnitOptions } from '@/lib/units';
import { formatHoursMinutes, formatMinutes, getFuelTypeLabel } from '@/lib/utils';
import { FuelPlanningReportProps } from '@/types/calculations';

interface ReportProps {
	report: FuelPlanningReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		fuelType,
		fuelDensity,
		fuelBurnRate,
		flightTime,
		reserveTime,
		taxiFuel,
		extraFuel,
		tripFuel,
		reserveFuel,
		totalFuel,
	} = report;

	const context = { fuelDensityKgPerL: fuelDensity };
	const pairedUnit = getPairedFuelUnit(units.fuel);
	const pairedIsMass =
		getUnitOptions('fuel').find((o) => o.value === pairedUnit)?.kind === 'mass';

	const formatFuel = (baseValue: number, unit: string = units.fuel) =>
		formatBaseValue(baseValue, 'fuel', unit, context);

	return (
		<ReportSection>
			<ReportGroup
				header="Fuel Type"
				value={`${getFuelTypeLabel(fuelType)} (${fuelDensity.toFixed(3)} kg/L)`}
			/>

			<ReportGroup header="Fuel Burn Rate" value={`${formatFuel(fuelBurnRate)}/h`} />

			<ReportGroup header="Flight Time" value={formatHoursMinutes(flightTime)} />

			<ReportGroup header="Reserve Time" value={formatMinutes(reserveTime)} />

			<ReportDivider />

			<ReportGroup header="Trip Fuel" value={formatFuel(tripFuel)} />

			<ReportGroup header="Reserve Fuel" value={formatFuel(reserveFuel)} />

			{taxiFuel != null && <ReportGroup header="Taxi Fuel" value={formatFuel(taxiFuel)} />}

			{extraFuel != null && <ReportGroup header="Extra Fuel" value={formatFuel(extraFuel)} />}

			<ReportGroup header="Total Fuel" value={formatFuel(totalFuel)} />

			<ReportGroup
				header={pairedIsMass ? 'Total Fuel (mass)' : 'Total Fuel (volume)'}
				value={formatFuel(totalFuel, pairedUnit)}
			/>

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
