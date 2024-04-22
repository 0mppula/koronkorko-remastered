import { PropsWithChildren } from 'react';

const FormGroup = ({ children }: PropsWithChildren) => {
	return <div className="flex flex-col xs:flex-row gap-4">{children}</div>;
};

export default FormGroup;
