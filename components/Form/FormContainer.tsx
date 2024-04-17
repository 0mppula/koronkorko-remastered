import { PropsWithChildren } from 'react';
const FormContainer = ({ children }: PropsWithChildren) => {
	return (
		<div className="w-full pt-4 pb-4 sm:pb-8 px-4 sm:px-8 rounded-md bg-card border-2 mb-8">
			{children}
		</div>
	);
};

export default FormContainer;
