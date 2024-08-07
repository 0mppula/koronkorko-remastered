import ReportSummaryContainer from '@/components/Form/ReportSummaryContainer';
import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import { formatPercentage } from '@/lib/utils';
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
	} = report;

	return (
		<ReportSummaryContainer>
			<ReportGroup
				header="Event Probability"
				value={
					isFinite(eventProbabilityPercent)
						? formatPercentage(eventProbabilityPercent, 8)
						: 'N/A'
				}
			/>

			<ReportGroup header="Total Attempts" value={eventTries.toString()} />

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
		</ReportSummaryContainer>
	);
};

export default Report;
