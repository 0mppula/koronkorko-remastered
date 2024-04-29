import useCurrencyStore from '@/hooks/useCurrency';
import { cn, getCurrencyName } from '@/lib/utils';
import { DollarSign, Euro, IndianRupee, JapaneseYen, Percent, PoundSterling } from 'lucide-react';
import React from 'react';
import { InputProps } from '../ui/input';

interface NumberInputWithIconProps extends InputProps {
	iconType?: 'currency' | 'percentage';
}

const NumberInputWithIcon = React.forwardRef<HTMLInputElement, NumberInputWithIconProps>(
	({ className, type, iconType = 'currency', ...props }, ref) => {
		const { currency } = useCurrencyStore();

		const getIcon = () => {
			if (iconType === 'percentage')
				return (
					<>
						<Percent className="h-4 w-4" aria-hidden />
						<span className="sr-only">Percent</span>
					</>
				);

			const SRCurrencyName = (
				<span className="sr-only">{getCurrencyName(currency, true)}</span>
			);

			switch (currency) {
				case 'eur':
					return (
						<>
							<Euro className="h-4 w-4" aria-hidden />
							{SRCurrencyName}
						</>
					);
				case 'usd':
					return (
						<>
							<DollarSign className="h-4 w-4" aria-hidden />
							{SRCurrencyName}
						</>
					);
				case 'gbp':
					return (
						<>
							<PoundSterling className="h-4 w-4" aria-hidden />
							{SRCurrencyName}
						</>
					);
				case 'jpy':
					return (
						<>
							<JapaneseYen className="h-4 w-4" aria-hidden />
							{SRCurrencyName}
						</>
					);
				case 'inr':
					return (
						<>
							<IndianRupee className="h-4 w-4" aria-hidden />
							{SRCurrencyName}
						</>
					);
				default:
					return (
						<>
							<DollarSign className="h-4 w-4" aria-hidden />
							{SRCurrencyName}
						</>
					);
			}
		};

		return (
			<div className="relative">
				<input
					className={cn(
						'text-base flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-neutral-700 dark:placeholder:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
						className
					)}
					type="number"
					step="0.01"
					placeholder={iconType === 'percentage' ? '10' : '1000'}
					ref={ref}
					min={0}
					{...props}
				/>

				<div className="absolute top-[4px] right-[4px] pointer-events-none flex items-center justify-center p-2 transition-all text-neutral-700 dark:text-neutral-300">
					{getIcon()}
				</div>
			</div>
		);
	}
);

NumberInputWithIcon.displayName = 'NumberInputWithIcon';

export default NumberInputWithIcon;
