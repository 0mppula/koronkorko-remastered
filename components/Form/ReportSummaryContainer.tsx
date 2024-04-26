import TypographyH2 from '@/components/TypographyH2';
import { Separator } from '@/components/ui/separator';
import ReportSpinner from '../Spinners/ReportSpinner';

interface ReportSummaryContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
	children: React.ReactNode;
	isLoading?: boolean;
}

const ReportSummaryContainer = ({
	title = 'Summary',
	children,
	isLoading = false,
	...props
}: ReportSummaryContainerProps) => {
	return (
		<div {...props}>
			<TypographyH2 className="mb-3 text-3xl">{title}</TypographyH2>

			<Separator className="h-[2px] bg-primary dark:bg-primary" />

			{isLoading ? (
				<ReportSpinner />
			) : (
				<div className="w-full py-4 flex flex-wrap items-center justify-center gap-4">
					{children}
				</div>
			)}

			<Separator className="h-[2px] bg-primary dark:bg-primary" />
		</div>
	);
};

export default ReportSummaryContainer;
