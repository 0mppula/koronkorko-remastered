'use client';

import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image, { StaticImageData } from 'next/image';
import { HtmlHTMLAttributes, useEffect, useState } from 'react';
import logo_dark from '../../public/assets/images/logo_dark.png';
import logo_light from '../../public/assets/images/logo_light.png';
import { Skeleton } from '../ui/skeleton';

interface LogoProps extends HtmlHTMLAttributes<HTMLImageElement> {}

const Logo = ({ className, ...props }: LogoProps) => {
	const [src, setSrc] = useState<null | StaticImageData>(null);

	const { resolvedTheme } = useTheme();

	useEffect(() => {
		setSrc(resolvedTheme === 'dark' ? logo_dark : logo_light);
	}, [resolvedTheme]);
	return (
		<>
			{src ? (
				<Image
					{...props}
					src={src}
					alt="KoronKorko Logo"
					className={cn(
						'h-[50px] w-[50px] cursor-pointer select-none min-h-[50px] min-w-[50px]',
						className
					)}
				/>
			) : (
				<Skeleton className="h-[50px] w-[50px] rounded-full" />
			)}
		</>
	);
};

export default Logo;
