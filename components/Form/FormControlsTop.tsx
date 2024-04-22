import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CalculationType } from '@/types/calculations';
import { FileDown, RotateCw, Save, SquarePen, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ImSpinner8 } from 'react-icons/im';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface FormControlsTopProps {
	reset: () => void;
	saveUpdateStart: () => void;
	activeCalculation: CalculationType | null;
	renameStart: () => void;
	importStart: () => void;
	closeCalculation: () => void;
}

const FormControlsTop = ({
	reset,
	saveUpdateStart,
	activeCalculation,
	renameStart,
	importStart,
	closeCalculation,
}: FormControlsTopProps) => {
	const { status: sessionStatus } = useSession();

	const isAuthenticated = sessionStatus === 'authenticated';
	const saveLoading = false;

	const handleImport = () => {
		if (isAuthenticated) {
			importStart();
		} else {
			toast.error('Please login to import a calculation');
		}
	};

	const handleSaveUpdateStart = () => {
		if (isAuthenticated) {
			saveUpdateStart();
		} else {
			toast.error('Please login to save calculation');
		}
	};

	return (
		<>
			<div className="flex flex-wrap justify-between items-center gap-1 pb-1">
				<div className="flex flex-wrap gap-1 items-center order-1 xs:order-none w-full xs:w-auto justify-between xs:justify-normal">
					{activeCalculation && (
						<>
							<p className="text-ellipsis whitespace-nowrap overflow-hidden w-44 xs:w-auto">
								{activeCalculation.name}
							</p>

							<div className="flex gap-1">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											onClick={renameStart}
											variant="ghost"
											size="icon"
											className="h-8 w-8"
										>
											<SquarePen className="h-4 w-4" aria-hidden />

											<span className="sr-only">Rename calculation</span>
										</Button>
									</TooltipTrigger>

									<TooltipContent>
										<p>Rename calculation</p>
									</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											onClick={closeCalculation}
											variant="ghost"
											size="icon"
											className="h-8 w-8 hover:text-destructive"
										>
											<X className="h-4 w-4" aria-hidden />

											<span className="sr-only">Close calculation</span>
										</Button>
									</TooltipTrigger>

									<TooltipContent>
										<p>Close calculation</p>
									</TooltipContent>
								</Tooltip>
							</div>
						</>
					)}
				</div>

				<div className="flex flex-wrap gap-1 justify-end xs:justify-normal w-full xs:w-auto">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={handleImport}
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<FileDown className="h-4 w-4" aria-hidden />

								<span className="sr-only">Import calculation</span>
							</Button>
						</TooltipTrigger>

						<TooltipContent>
							<p>Import calculation</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={handleSaveUpdateStart}
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								{saveLoading ? (
									<ImSpinner8 className="h-4 w-4 animate-spin" />
								) : (
									<Save className="h-4 w-4" aria-hidden />
								)}

								<span className="sr-only">Save calculation</span>
							</Button>
						</TooltipTrigger>

						<TooltipContent>
							<p>Save calculation</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 hover:text-destructive"
								onClick={reset}
							>
								<RotateCw className="h-4 w-4 " />

								<span className="sr-only">Reset calculator</span>
							</Button>
						</TooltipTrigger>

						<TooltipContent>
							<p>Reset calculator</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			<Separator className="h-[1px] bg-input dark:bg-input my-1 mb-3" />
		</>
	);
};

export default FormControlsTop;
