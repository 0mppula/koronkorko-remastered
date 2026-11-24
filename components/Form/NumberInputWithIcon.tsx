import useCurrencyStore from '@/hooks/useCurrency';
import { formatUnitInputValue } from '@/lib/units';
import { cn } from '@/lib/utils';
import { Percent } from 'lucide-react';
import React from 'react';
import CurrencyIcon from '../CurrencyIcon';
import { InputProps } from '../ui/input';

interface NumberInputWithIconProps extends InputProps {
	iconType?: 'currency' | 'percentage' | 'unit';
	unitSymbol?: string;
	// The unit's display digits (getUnitFractionDigits); inputs show at least 2.
	fractionDigits?: number;
	min0?: boolean;
}

const NumberInputWithIcon = React.forwardRef<HTMLInputElement, NumberInputWithIconProps>(
	(
		{
			className,
			type,
			min0 = true,
			iconType = 'currency',
			unitSymbol,
			fractionDigits,
			onChange,
			value,
			...props
		},
		ref
	) => {
		const { currency } = useCurrencyStore();

		const getIcon = () => {
			if (iconType === 'unit') {
				return (
					<>
						<span aria-hidden>{unitSymbol}</span>
						<span className="sr-only">{unitSymbol}</span>
					</>
				);
			} else if (iconType === 'percentage') {
				return (
					<>
						<Percent className="h-4 w-4" aria-hidden />
						<span className="sr-only">Percent</span>
					</>
				);
			} else {
				return <CurrencyIcon currency={currency} />;
			}
		};

		return (
			<div className="relative">
				<input
					className={cn(
						'text-base flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-neutral-700 dark:placeholder:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
						iconType === 'unit' && 'pr-14',
						className
					)}
					{...(iconType === 'unit'
						? {
								// type="number" shows a locale decimal comma (e.g. Finnish); text always shows the dot.
								type: 'text',
								// The decimal keypad has no minus key.
								inputMode: min0 ? 'decimal' : 'text',
								autoComplete: 'off',
							}
						: {
								type: 'number',
								step: '0.01',
								...(min0 ? { min: 0 } : {}),
							})}
					placeholder={
						iconType === 'unit' ? '0' : iconType === 'percentage' ? '10' : '1000'
					}
					ref={ref}
					onChange={(e) => {
						if (iconType === 'unit') {
							e.target.value = e.target.value.replace(/,/g, '.');
						}

						onChange?.(e);
					}}
					value={
						iconType === 'unit' ? formatUnitInputValue(value, fractionDigits) : value
					}
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
