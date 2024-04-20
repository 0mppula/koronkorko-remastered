'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			duration={5000}
			theme={theme as ToasterProps['theme']}
			className="toaster group"
			toastOptions={{
				classNames: {
					icon: 'group-data-[type=error]:text-destructive group-data-[type=success]:text-success group-data-[type=info]:text-foreground',
					title: 'font-normal',
					toast: 'group toast group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg text-base font-normal bg-card',
					description: 'group-[.toast]:text-muted-foreground',
					actionButton:
						'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
					cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
