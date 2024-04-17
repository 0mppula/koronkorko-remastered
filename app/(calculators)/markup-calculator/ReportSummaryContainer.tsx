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

			<Separator className="h-[2px] bg-primary dark:bg-primary" />

			{children}

			<Separator className="h-[2px] bg-primary dark:bg-primary" />
		</div>
	);
};

export default ReportSummaryContainer;
