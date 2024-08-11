import TypographyH2 from '@/components/TypographyH2';
import { Separator } from '@/components/ui/separator';
import ReportSpinner from '../Spinners/ReportSpinner';

interface ReportSectionProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
	children: React.ReactNode;
	isLoading?: boolean;
}

const ReportSection = ({
	title = 'Summary',
	children,
	isLoading = false,
	...props
}: ReportSectionProps) => {
	return (
		<section {...props} id={title.toLowerCase().replaceAll(' ', '-')}>
			<TypographyH2 className="mb-3 text-3xl">{title}</TypographyH2>

			<Separator className="h-[2px] bg-primary dark:bg-primary" />

			{isLoading ? (
				<ReportSpinner />
			) : (
				<div className="w-full py-4 flex flex-wrap items-center gap-4">{children}</div>
			)}

			<Separator className="h-[2px] bg-primary dark:bg-primary" />
		</section>
	);
};

export default ReportSection;
