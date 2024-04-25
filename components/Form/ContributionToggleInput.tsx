import useCurrencyStore from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { HandCoins, PiggyBank } from 'lucide-react';
import React from 'react';
import { InputProps } from '../ui/input';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ContributionToggleInputProps extends InputProps {
	contributionMultiplier: 1 | -1;
	setContributionMultiplier: (value: 1 | -1) => void;
}

const ContributionToggleInput = React.forwardRef<HTMLInputElement, ContributionToggleInputProps>(
	({ className, type, contributionMultiplier, setContributionMultiplier, ...props }, ref) => {
		const { currency } = useCurrencyStore();

		const isDepositting = contributionMultiplier === 1;

		const getIcon = () => {
			const icon = isDepositting ? (
				<PiggyBank
					className={cn('h-4 w-4', isDepositting ? 'text-success' : 'text-destructive')}
				/>
			) : (
				<HandCoins
					className={cn('h-4 w-4', isDepositting ? 'text-success' : 'text-destructive')}
				/>
			);

			return (
				<>
					{icon}
					<span className="sr-only">
						{contributionMultiplier === -1 ? 'Withdraw' : 'Deposit'}
					</span>
				</>
			);
		};

		return (
			<div className="relative">
				<input
					className={cn(
						'!pr-10 text-base flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-neutral-700 dark:placeholder:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
						className
					)}
					type="number"
					step="0.01"
					placeholder="1000"
					ref={ref}
					{...props}
				/>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							onClick={() => setContributionMultiplier(contributionMultiplier)}
							variant="ghost"
							size="icon"
							className="z-10 h-[35px] w-[35px] my-0.5 mr-[2px] !py-0 absolute top-[0px] right-[0px] flex items-center justify-center p-2 transition-all text-neutral-700 dark:text-neutral-300"
						>
							{getIcon()}
						</Button>
					</TooltipTrigger>

					<TooltipContent>
						<p>{isDepositting ? 'Withdraw' : 'Deposit'}</p>
					</TooltipContent>
				</Tooltip>
			</div>
		);
	}
);

ContributionToggleInput.displayName = 'ContributionToggleInput';

export default ContributionToggleInput;
