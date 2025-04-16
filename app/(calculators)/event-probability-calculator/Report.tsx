import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { EventProbabilityReportProps } from '@/types/calculations';

interface ReportProps {
	report: EventProbabilityReportProps;
}

const Report = ({ report }: ReportProps) => {
	const {
		eventProbabilityPercent,
		eventTries,
		atLeastOnceProbabilityPercent,
		moreThanOnceProbabilityPercent,
		exactlyOnceProbabilityPercent,
		neverOccuresProbabilityPercent,
	} = report;

	return (
		<ReportSection>
			<ReportGroup
				header="Event Probability"
				value={
					isFinite(eventProbabilityPercent)
						? formatPercentage(eventProbabilityPercent, 8)
						: 'N/A'
				}
			/>

			<ReportGroup header="Total Attempts" value={formatNumber(eventTries)} />

			<ReportDivider />

			<ReportGroup
				header="At Least Once Probability"
				value={
					isFinite(atLeastOnceProbabilityPercent)
						? formatPercentage(atLeastOnceProbabilityPercent, 8)
						: 'N/A'
				}
			/>

			<ReportGroup
				header="Never Occurs Probability"
				value={
					isFinite(neverOccuresProbabilityPercent)
						? formatPercentage(neverOccuresProbabilityPercent, 8)
						: 'N/A'
				}
			/>

			<ReportGroup
				header="More Than Once Probability"
				value={
					isFinite(moreThanOnceProbabilityPercent)
						? formatPercentage(moreThanOnceProbabilityPercent, 8)
						: 'N/A'
				}
			/>

			<ReportGroup
				header="Exactly Once Probability"
				value={
					isFinite(exactlyOnceProbabilityPercent)
						? formatPercentage(exactlyOnceProbabilityPercent, 8)
						: 'N/A'
				}
			/>
		</ReportSection>
	);
};

export default Report;
