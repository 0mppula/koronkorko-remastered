import { currencies } from '@/constants/data';
import { cn, getCurrencyName } from '@/lib/utils';
import {
	DollarSign,
	Euro,
	IndianRupee,
	JapaneseYen,
	LucideProps,
	PoundSterling,
} from 'lucide-react';

interface CurrencyIconProps extends Omit<LucideProps, 'ref'> {
	currency: (typeof currencies)[number]['value'];
	SrNamePlural?: boolean;
}

const CurrencyIcon = ({ currency, SrNamePlural = false, ...props }: CurrencyIconProps) => {
	const getIcon = () => {
		const SRCurrencyName = (
			<span className="sr-only">{getCurrencyName(currency, SrNamePlural)}</span>
		);

		switch (currency) {
			case 'eur':
				return (
					<>
						<Euro {...props} className={cn('h-4 w-4', props.className)} aria-hidden />
						{SRCurrencyName}
					</>
				);
			case 'usd':
				return (
					<>
						<DollarSign
							{...props}
							className={cn('h-4 w-4', props.className)}
							aria-hidden
						/>
						{SRCurrencyName}
					</>
				);
			case 'gbp':
				return (
					<>
						<PoundSterling
							{...props}
							className={cn('h-4 w-4', props.className)}
							aria-hidden
						/>
						{SRCurrencyName}
					</>
				);
			case 'jpy':
				return (
					<>
						<JapaneseYen
							{...props}
							className={cn('h-4 w-4', props.className)}
							aria-hidden
						/>
						{SRCurrencyName}
					</>
				);
			case 'inr':
				return (
					<>
						<IndianRupee
							{...props}
							className={cn('h-4 w-4', props.className)}
							aria-hidden
						/>
						{SRCurrencyName}
					</>
				);
			default:
				return (
					<>
						<DollarSign
							{...props}
							className={cn('h-4 w-4', props.className)}
							aria-hidden
						/>
						{SRCurrencyName}
					</>
				);
		}
	};

	return <>{getIcon()}</>;
};

export default CurrencyIcon;
