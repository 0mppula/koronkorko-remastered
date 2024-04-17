interface ReportGroupProps {
	header: string;
	value: string;
}

const ReportGroup = ({ header, value }: ReportGroupProps) => {
	return (
		<div className="grow shrink basis-full sm:basis-[calc(50%-1rem/2)]">
			<h3 className="text-xl font-normal mb-1.5">{header}</h3>

			<h4 className="scroll-m-20 text-3xl font-bold transition-colors first:mt-0">{value}</h4>
		</div>
	);
};

export default ReportGroup;
