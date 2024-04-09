'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import logo_dark from '../../public/assets/images/logo_dark.png';
import logo_light from '../../public/assets/images/logo_light.png';
import { useMemo } from 'react';

const Logo = () => {
	const { resolvedTheme } = useTheme();

	const logo = useMemo(() => {
		return resolvedTheme === 'dark' ? logo_dark : logo_light;
	}, [resolvedTheme]);

	return (
		<div>
			<Link
				href="/"
				className="gap-2 items-center justify-center flex ring-offset-background focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-ring rounded-md p-1"
			>
				<Image
					src={logo}
					alt="KoronKorko Logo"
					className="h-[30px] w-[30px] cursor-pointer select-none min-h-[30px] min-w-[30px]"
				/>

				<p className="font-bold text-2xl hidden sm:block">KoronKorko</p>
			</Link>
		</div>
	);
};

export default Logo;
