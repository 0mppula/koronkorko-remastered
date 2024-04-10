const LargeSpinner = () => {
	return (
		<div className="fixed inset-x-0 inset-y-0 bg-[rgba(0,0,0,0.5)] z-[300] flex items-center justify-center">
			<div className="w-16 h-16 border-8 border-x-transparent  border-t-current border-b-primary rounded-full animate-spin-slow" />
		</div>
	);
};

export default LargeSpinner;
