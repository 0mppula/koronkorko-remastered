import { Button, ButtonProps } from '../ui/button';

interface SubmitButtonProps extends ButtonProps {}

const SubmitButton = ({ ...porps }: SubmitButtonProps) => {
	return (
		<Button {...porps} type="submit" className="w-full">
			Calculate
		</Button>
	);
};

export default SubmitButton;
