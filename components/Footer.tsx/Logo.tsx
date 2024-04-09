'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useMemo } from 'react';
import logo_dark from '../../public/assets/images/logo_dark.png';
import logo_light from '../../public/assets/images/logo_light.png';

const Logo = () => {
	const { resolvedTheme } = useTheme();

	const logo = useMemo(() => {
		return resolvedTheme === 'dark' ? logo_dark : logo_light;
	}, [resolvedTheme]);

	return (
		<>
			{logo && logo_dark && logo_light && (
				<Image
					src={logo}
					alt="KoronKorko Logo"
					className="h-[50px] w-[50px] cursor-pointer select-none min-h-[50px] min-w-[50px]"
				/>
			)}
		</>
	);
};

export default Logo;
