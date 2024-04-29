import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import React from 'react';
import { IconType } from 'react-icons';
import { ImSpinner8 } from 'react-icons/im';

interface ButtonWithIconProps extends ButtonProps {
	children?: React.ReactNode;
	icon?: IconType | LucideIcon;
	loading?: boolean;
	iconPosition?: 'left' | 'right';
}

export function ButtonWithIcon({
	icon: Icon,
	loading,
	children,
	iconPosition = 'right',
	...props
}: ButtonWithIconProps) {
	const icon = (
		<>
			{loading ? (
				<ImSpinner8
					aria-hidden
					className={cn(
						'h-4 w-4 animate-spin',
						iconPosition === 'right' ? 'ml-1.5' : 'mr-1.5'
					)}
				/>
			) : Icon ? (
				<Icon
					aria-hidden
					className={cn('h-4 w-4', iconPosition === 'right' ? 'ml-1.5' : 'mr-1.5')}
				/>
			) : (
				<></>
			)}
		</>
	);

	return (
		<Button {...props} disabled={loading || props.disabled}>
			{iconPosition === 'right' ? (
				<>
					{children} {icon}
				</>
			) : (
				<>
					{icon} {children}
				</>
			)}
		</Button>
	);
}
