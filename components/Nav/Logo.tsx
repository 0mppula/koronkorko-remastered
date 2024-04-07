'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import logo_dark from '../../public/assets/images/logo_dark.png';
import logo_light from '../../public/assets/images/logo_light.png';

const Logo = () => {
	const { resolvedTheme } = useTheme();

	return (
		<div className="ml-4 self-center">
			<Link
				href="/"
				className="gap-1 items-center justify-center flex ring-offset-background focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-ring rounded-md p-1"
			>
				<Image
					src={resolvedTheme === 'dark' ? logo_dark : logo_light}
					alt="KoronKorko Logo"
					className="h-[30px] w-[30px] cursor-pointer select-none min-h-[30px] min-w-[30px]"
				/>

				<p className="font-bold text-2xl hidden sm:block">KoronKorko</p>
			</Link>
		</div>
	);
};

export default Logo;
