'use client';

import { useTheme } from 'next-themes';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
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
		<div>
			<Link
				href="/"
				className="gap-2 items-center justify-center flex ring-offset-background focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-ring rounded-md p-1"
			>
				{src ? (
					<Image
						src={src}
						alt="KoronKorko Logo"
						className="h-[30px] w-[30px] cursor-pointer select-none min-h-[30px] min-w-[30px]"
					/>
				) : (
					<Skeleton className="h-[30px] w-[30px] rounded-full" />
				)}

				<p aria-hidden className="font-bold text-2xl hidden xs:block">
					KoronKorko
				</p>
			</Link>
		</div>
	);
};

export default Logo;
