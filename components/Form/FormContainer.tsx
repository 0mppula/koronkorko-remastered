import { PropsWithChildren } from 'react';
const FormContainer = ({ children }: PropsWithChildren) => {
	return (
		<div className="w-full pt-4 pb-4 sm:pb-8 px-4 sm:px-8 rounded-lg bg-card border-2 mb-10">
			{children}
		</div>
	);
};

export default FormContainer;
