import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CalculationType, ICalculationNameFormData } from '@/types/calculations';
import { FileDown, RotateCw, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import RenameCalculationModal from '../Modals/RenameCalculationModal';
import SaveCalculationModal from '../Modals/SaveCalculationModal';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface FormControlsTopProps {
	reset: () => void;
	saveUpdateStart: () => void;
	activeCalculation: CalculationType | null;
	renameStart: () => void;
	importStart: () => void;
	closeCalculation: () => void;
	isSaveModalOpen: boolean;
	handleCloseSaveModal: () => void;
	handleSave: (data: ICalculationNameFormData) => void;
	isRenameModalOpen: boolean;
	handleCloseRenameModal: () => void;
	handleRename: (data: ICalculationNameFormData) => void;
}

const FormControlsTop = ({
	reset,
	saveUpdateStart,
	activeCalculation,
	renameStart,
	importStart,
	closeCalculation,
	isSaveModalOpen,
	handleCloseSaveModal,
	handleSave,
	handleCloseRenameModal,
	handleRename,
	isRenameModalOpen,
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
								<RenameCalculationModal
									isOpen={isRenameModalOpen}
									handleClose={handleCloseRenameModal}
									handleRename={handleRename}
									activeCalculation={activeCalculation}
									renameStart={renameStart}
								/>

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

					<SaveCalculationModal
						isOpen={isSaveModalOpen}
						handleClose={handleCloseSaveModal}
						handleSave={handleSave}
						handleSaveUpdateStart={handleSaveUpdateStart}
						saveLoading={saveLoading}
					/>

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
