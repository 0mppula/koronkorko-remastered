'use client';

import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import useUnitsStore from '@/hooks/useUnits';
import { formatBaseValue, formatMoment, getUnitSymbol } from '@/lib/units';
import { getFuelTypeLabel } from '@/lib/utils';
import { WeightAndBalanceReportProps } from '@/types/calculations';

interface ReportProps {
	report: WeightAndBalanceReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { units } = useUnitsStore();

	const {
		fuelType,
		fuelDensity,
		stationResults,
		totalWeight,
		totalMoment,
		centerOfGravity,
		maxTakeoffWeight,
		maxTakeoffWeightMargin,
		exceedsMaxTakeoffWeight,
	} = report;

	const context = { fuelDensityKgPerL: fuelDensity };
	const hasFuelStation = stationResults.some(({ type }) => type === 'fuel');
	// Fuel entered in the weight unit (e.g. lb) would show the same value twice.
	const fuelIsInWeightUnit =
		getUnitSymbol('fuel', units.fuel) === getUnitSymbol('weight', units.weight);

	const formatWeight = (kg: number) => formatBaseValue(kg, 'weight', units.weight);
	const formatArm = (mm: number) => formatBaseValue(mm, 'arm', units.arm);

	const formatStationWeight = (fuel: number | null, weight: number) =>
		fuel === null || fuelIsInWeightUnit
			? formatWeight(weight)
			: `${formatBaseValue(fuel, 'fuel', units.fuel, context)} (${formatWeight(weight)})`;

	return (
		<ReportSection>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Station</TableHead>
						<TableHead className="text-right">Weight</TableHead>
						<TableHead className="text-right">Arm</TableHead>
						<TableHead className="text-right">Moment</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{stationResults.map(({ name, fuel, weight, arm, moment }, index) => (
						<TableRow key={`station-${index}`}>
							<TableCell className="min-w-[8rem]">{name}</TableCell>
							<TableCell className="whitespace-nowrap text-right">
								{formatStationWeight(fuel, weight)}
							</TableCell>
							<TableCell className="whitespace-nowrap text-right">
								{formatArm(arm)}
							</TableCell>
							<TableCell className="whitespace-nowrap text-right">
								{formatMoment(moment, units)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<ReportDivider />

			<ReportGroup header="Total Weight" value={formatWeight(totalWeight)} />

			<ReportGroup
				header="Center of Gravity"
				value={centerOfGravity === null ? 'Not available' : formatArm(centerOfGravity)}
			/>

			<ReportGroup header="Total Moment" value={formatMoment(totalMoment, units)} />

			<ReportGroup
				header="Moment/1000"
				value={formatMoment(totalMoment, units, { index: true })}
			/>

			{hasFuelStation && (
				<ReportGroup
					header="Fuel Type"
					value={`${getFuelTypeLabel(fuelType)} (${fuelDensity.toFixed(3)} kg/L)`}
				/>
			)}

			{maxTakeoffWeight != null && maxTakeoffWeightMargin !== null && (
				<>
					<ReportGroup
						header="Maximum Takeoff Weight"
						value={formatWeight(maxTakeoffWeight)}
					/>

					<ReportGroup
						header="Weight Check"
						value={
							exceedsMaxTakeoffWeight
								? `Exceeds the maximum takeoff weight by ${formatWeight(-maxTakeoffWeightMargin)}`
								: `Within the maximum takeoff weight (${formatWeight(Math.max(0, maxTakeoffWeightMargin))} remaining)`
						}
						fullWidth
					/>
				</>
			)}

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
