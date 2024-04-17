import { PropsWithChildren } from 'react';

const ReportGroupContainer = ({ children }: PropsWithChildren) => {
	return (
		<div className="w-full py-4 flex flex-wrap items-center justify-center gap-4">
			{children}
		</div>
	);
};

export default ReportGroupContainer;
