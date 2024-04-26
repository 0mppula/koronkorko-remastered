import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
	CalculationType,
	ICalculationNameFormData,
	IHasFormDataAndName,
} from '@/types/calculations';
import { RotateCw, X } from 'lucide-react';
import { FieldValues } from 'react-hook-form';
import ImportCalculationModal from '../Modals/ImportCalculationModal';
import RenameCalculationModal from '../Modals/RenameCalculationModal';
import SaveCalculationModal from '../Modals/SaveCalculationModal';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface FormControlsTopProps<TCalculation> {
	reset: () => void;
	handleSaveUpdateStart: () => void;
	activeCalculation: CalculationType | null;
	renameStart: () => void;
	closeCalculation: () => void;
	isSaveModalOpen: boolean;
	handleCloseSaveModal: () => void;
	handleSave: (data: ICalculationNameFormData) => void;
	isRenameModalOpen: boolean;
	handleCloseRenameModal: () => void;
	handleRename: (data: ICalculationNameFormData) => void;
	isImportModalOpen: boolean;
	calculations?: TCalculation[] | null;
	isLoading: boolean;
	handleDelete: (id: string) => void;
	handleImport: (calculation: TCalculation) => void;
	handleImportStart: () => void;
	closeImportModal: () => void;
}

const FormControlsTop = <
	TFormData extends FieldValues,
	TCalculation extends IHasFormDataAndName<TFormData>
>({
	reset,
	handleSaveUpdateStart,
	activeCalculation,
	renameStart,
	closeCalculation,
	isSaveModalOpen,
	handleCloseSaveModal,
	handleSave,
	handleCloseRenameModal,
	handleRename,
	isRenameModalOpen,
	handleDelete,
	isImportModalOpen,
	calculations,
	isLoading,
	handleImport,
	handleImportStart,
	closeImportModal,
}: FormControlsTopProps<TCalculation>) => {
	const saveLoading = false;

	return (
		<>
			<div className="flex flex-wrap justify-between items-center gap-1 pb-1">
				<div className="flex flex-wrap gap-1 items-center order-1 xs:order-none w-full xs:w-auto justify-between xs:justify-normal">
					{activeCalculation && (
						<>
							<p className="font-medium text-ellipsis whitespace-nowrap overflow-hidden w-44 xs:w-auto">
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
					<ImportCalculationModal
						isOpen={isImportModalOpen}
						handleDelete={handleDelete}
						calculations={calculations}
						isLoading={isLoading}
						handleImport={handleImport}
						handleImportStart={handleImportStart}
						closeImportModal={closeImportModal}
					/>

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

			<Separator className="h-[1px] bg-input dark:bg-input my-1 mb-6" />
		</>
	);
};

export default FormControlsTop;
