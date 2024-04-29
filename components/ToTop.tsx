'use client';

import { cn } from '@/lib/utils';
import { ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';

const SCROLL_LIMIT = 200;

const ToTop = () => {
	const [active, setActive] = useState(false);

	useEffect(() => {
		const handler = () => {
			let pageY = window.scrollY;
			pageY > SCROLL_LIMIT && setActive(true);
			pageY < SCROLL_LIMIT && setActive(false);
		};

		window.addEventListener('scroll', handler);

		return () => {
			window.removeEventListener('scroll', handler);
		};
	}, []);

	const scrollToTop = useCallback(() => {
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: 'smooth',
		});
	}, []);

	return (
		<Button
			aria-hidden={!active}
			tabIndex={active ? 0 : -1}
			onClick={scrollToTop}
			className={cn(
				'flex items-center justify-center fixed bottom-4 right-4 md:bottom-6 md:right-6 h-[46px] w-[46px] bg-card text-foreground cursor-pointer rounded-full transition-all duration-200 z-[200] hover:text-primary focus-visible:text-primary border-card-foreground border-2 hover:bg-card focus-visible:bg-card p-0',
				active ? 'opacity-1' : 'opacity-0 pointer-events-none'
			)}
		>
			<ChevronUp aria-hidden className="h-7 w-7" />

			<span className="sr-only">Scroll to the top of the page</span>
		</Button>
	);
};

export default ToTop;
