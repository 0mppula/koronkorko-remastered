import CalculatorDisclaimer from '@/components/Report/CalculatorDisclaimer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import { formatDegrees, formatSignedDegrees, formatVariation } from '@/lib/units';
import { HeadingReportProps } from '@/types/calculations';

interface ReportProps {
	report: HeadingReportProps;
}

const Report = ({ report }: ReportProps) => {
	const {
		trueHeading,
		variation,
		variationDirection,
		deviationCorrection,
		magneticHeading,
		compassHeading,
	} = report;

	return (
		<ReportSection>
			<ReportGroup
				header="True Heading"
				value={formatDegrees(trueHeading, { heading: true })}
			/>

			<ReportGroup
				header="Variation"
				value={formatVariation(variation, variationDirection)}
			/>

			{deviationCorrection != null && (
				<ReportGroup
					header="Deviation Correction"
					value={formatSignedDegrees(deviationCorrection)}
				/>
			)}

			<ReportDivider />

			<ReportGroup
				header="Magnetic Heading"
				value={formatDegrees(magneticHeading, { heading: true })}
			/>

			<ReportGroup
				header="Compass Heading"
				value={
					compassHeading === null
						? 'Not calculated (no deviation correction)'
						: formatDegrees(compassHeading, { heading: true })
				}
			/>

			<CalculatorDisclaimer category="aviation" />
		</ReportSection>
	);
};

export default Report;
