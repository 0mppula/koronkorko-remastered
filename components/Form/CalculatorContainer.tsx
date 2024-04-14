import React, { PropsWithChildren } from 'react';

const CalculatorContainer = ({ children }: PropsWithChildren) => {
	return <div className="max-w-2xl w-full">{children}</div>;
};

export default CalculatorContainer;
