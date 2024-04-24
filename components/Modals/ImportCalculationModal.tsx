'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IHasFormDataAndName } from '@/types/calculations';
import { FileDown, Trash } from 'lucide-react';
import { Fragment } from 'react';
import { FieldValues } from 'react-hook-form';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';

interface ImportCalculationModalProps<TCalculation> {
	isOpen: boolean;
	calculations?: TCalculation[] | null;
	isLoading: boolean;
	handleDelete: (id: string) => void;
	handleImport: (calculation: TCalculation) => void;
	handleImportStart: () => void;
	closeImportModal: () => void;
}

const ImportCalculationModal = <
	TFormData extends FieldValues,
	TCalculation extends IHasFormDataAndName<TFormData>
>({
	isOpen,
	calculations,
	isLoading,
	handleDelete,
	handleImport,
	handleImportStart,
	closeImportModal,
}: ImportCalculationModalProps<TCalculation>) => {
	const handleDeleteCalculation = (id: string) => {
		handleDelete(id);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					closeImportModal();
				}
			}}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							onClick={handleImportStart}
							variant="ghost"
							size="icon"
							className="h-8 w-8"
						>
							<FileDown className="h-4 w-4" aria-hidden />

							<span className="sr-only">Import calculation</span>
						</Button>
					</DialogTrigger>
				</TooltipTrigger>

				<TooltipContent>
					<p>Import calculation</p>
				</TooltipContent>
			</Tooltip>

			<DialogContent className="p-0">
				<DialogHeader className="p-6 pb-0">
					<DialogTitle>Import Calculation</DialogTitle>
				</DialogHeader>

				<ScrollArea className="min-h-[min(calc(90svh-100px),272px)] max-h-[min(50svh,512px)] p-6 pt-0 rounded-md">
					{isLoading ? (
						<div className="flex flex-col gap-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={`markup-calculation-${i}`} className="h-8" />
							))}
						</div>
					) : calculations && calculations.length > 0 ? (
						<ul className="flex flex-col">
							{calculations.map((calculation) => (
								<Fragment key={calculation.id}>
									<li className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-between">
										<div className="text-ellipsis whitespace-nowrap overflow-hidden w-44 xs:w-auto">
											{calculation.name}
										</div>

										<div className="flex gap-2 pr-1">
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														onClick={() => handleImport(calculation)}
														variant="ghost"
														size="icon"
														className="h-8 w-8"
													>
														<FileDown className="h-4 w-4" aria-hidden />

														<span className="sr-only">
															Import calculation
														</span>
													</Button>
												</TooltipTrigger>

												<TooltipContent>
													<p>Import calculation</p>
												</TooltipContent>
											</Tooltip>

											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														onClick={() =>
															handleDeleteCalculation(calculation.id)
														}
														variant="ghost"
														size="icon"
														className="h-8 w-8 hover:text-destructive"
													>
														<Trash className="h-4 w-4" aria-hidden />

														<span className="sr-only">
															Delete Calculation
														</span>
													</Button>
												</TooltipTrigger>

												<TooltipContent>
													<p>Delete Calculation</p>
												</TooltipContent>
											</Tooltip>
										</div>
									</li>

									<Separator className="h-[1px] my-2" />
								</Fragment>
							))}
						</ul>
					) : (
						<p>You dont have any saved calculations yet.</p>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};

export default ImportCalculationModal;
