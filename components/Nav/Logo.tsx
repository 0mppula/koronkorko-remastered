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
			<Link href="/" className="gap-[0.35rem] items-center justify-center flex">
				<Image
					src={resolvedTheme === 'dark' ? logo_dark : logo_light}
					alt="logo.jpg"
					className="h-[34px] w-[34px] cursor-pointer select-none"
				/>
				<p className="font-bold text-2xl">KoronKorko</p>
			</Link>
		</div>
	);
};

export default Logo;
