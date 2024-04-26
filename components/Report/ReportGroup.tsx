import { cn } from '@/lib/utils';

interface ReportGroupProps {
	header: string;
	value: string;
	fullWidth?: boolean;
}

const ReportGroup = ({ header, value, fullWidth = false }: ReportGroupProps) => {
	return (
		<div
			className={cn(
				'grow shrink basis-full sm:basis-[calc(50%-1rem/2)] justify-start',
				fullWidth && 'sm:basis-full'
			)}
		>
			<h3 className="text-xl font-normal mb-1.5">{header}</h3>

			<h4 className="scroll-m-20 text-3xl font-bold transition-colors first:mt-0 sm:max-w-[672px] break-all sm:break-keep">
				{value}
			</h4>
		</div>
	);
};

export default ReportGroup;
