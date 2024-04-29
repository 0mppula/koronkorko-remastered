import { XsScreen, SmScreen, MdScreen, LgScreen, XlScreen, XxlScreen } from '@/constants/data';
import { useEffect, useState } from 'react';

/* Getting the current width and height of the browser window. */
export const useWindowDimensions = () => {
	const [windowDimensions, setWindowDimensions] = useState({
		width: 0,
		height: 0,
	});

	const isXs = windowDimensions.width < XsScreen;
	const isSm = windowDimensions.width < SmScreen;
	const isMd = windowDimensions.width < MdScreen;
	const isLg = windowDimensions.width < LgScreen;
	const isXl = windowDimensions.width < XlScreen;
	const isXxl = windowDimensions.width < XxlScreen;

	useEffect(() => {
		const handleResize = () => {
			setWindowDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		handleResize();

		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return {
		width: windowDimensions.width,
		height: windowDimensions.height,
		isXs,
		isSm,
		isMd,
		isLg,
		isXl,
		isXxl,
	};
};
