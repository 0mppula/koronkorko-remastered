import TypographyH2 from '@/components/TypographyH2';
import { Separator } from '@/components/ui/separator';

interface ReportSummaryContainerProps {
	title?: string;
	children: React.ReactNode;
}

const ReportSummaryContainer = ({ title = 'Summary', children }: ReportSummaryContainerProps) => {
	return (
		<div>
			<TypographyH2 className="mb-3 text-3xl">{title}</TypographyH2>

			<Separator className="h-[1.6px]" />

			{children}

			<Separator className="h-[1.6px]" />
		</div>
	);
};

export default ReportSummaryContainer;
