import ReportSummaryContainer from '@/components/Form/ReportSummaryContainer';
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
		atLeastOnceProbability,
		moreThanOnceProbability,
		exactlyOnceProbability,
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

			<ReportGroup
				header="At Least Once Probability"
				value={
					isFinite(atLeastOnceProbability)
						? formatPercentage(atLeastOnceProbability, 8)
						: 'N/A'
				}
			/>

			<ReportGroup
				header="More Than Once Probability"
				value={
					isFinite(moreThanOnceProbability)
						? formatPercentage(moreThanOnceProbability, 8)
						: 'N/A'
				}
			/>

			<ReportGroup
				header="Exactly Once Probability"
				value={
					isFinite(exactlyOnceProbability)
						? formatPercentage(exactlyOnceProbability, 8)
						: 'N/A'
				}
			/>
		</ReportSummaryContainer>
	);
};

export default Report;
