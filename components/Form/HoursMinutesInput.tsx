'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import NumberInputWithIcon from './NumberInputWithIcon';

interface HoursMinutesInputProps extends Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	'value' | 'onChange'
> {
	// Total minutes.
	value: number | string | null | undefined;
	onChange: (minutes: number) => void;
}

const parseBox = (text: string) => (text.trim() === '' ? 0 : Number(text));

const toTotalMinutes = (hours: string, minutes: string) => parseBox(hours) * 60 + parseBox(minutes);

const splitMinutes = (value: number) => {
	const hours = Math.floor(value / 60);

	return { hours: String(hours), minutes: String(Number((value - hours * 60).toFixed(2))) };
};

const isEmptyValue = (value: HoursMinutesInputProps['value']) =>
	value === null || value === undefined || value === '';

const EMPTY_BOXES = { hours: '', minutes: '' };

const HoursMinutesInput = React.forwardRef<HTMLInputElement, HoursMinutesInputProps>(
	({ value, onChange, onBlur, className, ...props }, ref) => {
		const [boxes, setBoxes] = useState(() =>
			isEmptyValue(value)
				? EMPTY_BOXES
				: splitMinutes(Number.isFinite(Number(value)) ? Number(value) : 0)
		);

		// Follow outside changes (reset, import); typed values already match.
		useEffect(() => {
			if (isEmptyValue(value)) {
				setBoxes(EMPTY_BOXES);
				return;
			}

			const total = Number(value);

			if (!Number.isFinite(total)) return;

			setBoxes((prev) =>
				total === toTotalMinutes(prev.hours, prev.minutes) ? prev : splitMinutes(total)
			);
		}, [value]);

		const handleChange = (box: 'hours' | 'minutes', text: string) => {
			const next = { ...boxes, [box]: text };

			setBoxes(next);
			onChange(toTotalMinutes(next.hours, next.minutes));
		};

		// 0 h 90 min becomes 1 h 30 min.
		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			const total = toTotalMinutes(boxes.hours, boxes.minutes);

			if (!isEmptyValue(value) && Number.isFinite(total) && total >= 0) {
				setBoxes(splitMinutes(total));
			}

			onBlur?.(e);
		};

		return (
			<div className={cn('flex gap-2 [&>div]:flex-1', className)}>
				<NumberInputWithIcon
					{...props}
					ref={ref}
					iconType="unit"
					unitSymbol="h"
					value={boxes.hours}
					onChange={(e) => handleChange('hours', e.target.value)}
					onBlur={handleBlur}
				/>

				<NumberInputWithIcon
					aria-label="Minutes"
					disabled={props.disabled}
					iconType="unit"
					unitSymbol="min"
					value={boxes.minutes}
					onChange={(e) => handleChange('minutes', e.target.value)}
					onBlur={handleBlur}
				/>
			</div>
		);
	}
);

HoursMinutesInput.displayName = 'HoursMinutesInput';

export default HoursMinutesInput;
