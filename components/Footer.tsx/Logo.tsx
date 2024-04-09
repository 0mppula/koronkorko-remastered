'use client';

import { useTheme } from 'next-themes';
import Image, { StaticImageData } from 'next/image';
import { useEffect, useState } from 'react';
import logo_dark from '../../public/assets/images/logo_dark.png';
import logo_light from '../../public/assets/images/logo_light.png';
import { Skeleton } from '../ui/skeleton';

const Logo = () => {
	const [src, setSrc] = useState<null | StaticImageData>(null);

	const { resolvedTheme } = useTheme();

	useEffect(() => {
		setSrc(resolvedTheme === 'dark' ? logo_dark : logo_light);
	}, [resolvedTheme]);
	return (
		<>
			{src ? (
				<Image
					src={src}
					alt="KoronKorko Logo"
					className="h-[50px] w-[50px] cursor-pointer select-none min-h-[50px] min-w-[50px]"
				/>
			) : (
				<Skeleton className="h-[50px] w-[50px] rounded-full" />
			)}
		</>
	);
};

export default Logo;
