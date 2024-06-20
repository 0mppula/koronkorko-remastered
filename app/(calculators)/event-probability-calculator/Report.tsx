import ReportSummaryContainer from '@/components/Form/ReportSummaryContainer';
import ReportGroup from '@/components/Report/ReportGroup';
import { formatPercentage } from '@/lib/utils';
import { EventProbabilityReportProps } from '@/types/calculations';

interface ReportProps {
	report: EventProbabilityReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { eventProbabilityPercent, eventTries, probability } = report;

	return (
		<ReportSummaryContainer>
			<ReportGroup
				header="Event Probability"
				value={
					isFinite(eventProbabilityPercent)
						? formatPercentage(eventProbabilityPercent)
						: 'N/A'
				}
			/>

			<ReportGroup header="Trial Count" value={eventTries.toString()} />

			<ReportGroup
				header="Probability"
				value={isFinite(probability) ? formatPercentage(probability, 8) : 'N/A'}
			/>
		</ReportSummaryContainer>
	);
};

export default Report;
