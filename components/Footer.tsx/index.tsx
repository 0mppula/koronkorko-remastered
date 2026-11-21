import { footerLinks, footerSocialMedia } from '@/constants/data';
import { Separator } from '../ui/separator';
import Link from './Link';
import Logo from './Logo';

const year = new Date().getFullYear();

const FinnishFlag = ({ className }: { className?: string }) => (
	<svg
		viewBox="0 0 18 11"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		className={className}
	>
		<rect width="18" height="11" fill="#FFFFFF" />
		<rect x="5" width="3" height="11" fill="#002F6C" />
		<rect y="4" width="18" height="3" fill="#002F6C" />
	</svg>
);

const Footer = () => {
	return (
		<footer className="bg-card pt-11 pb-6 border-t-2 overflow-hidden">
			<div className="max-w-6xl mx-auto px-6 md:px-8">
				{/* Top */}
				<div className="grid xl:grid-cols-12 gap-y-8 gap-x-4 pb-8">
					<div className="flex flex-col col-span-12 xl:col-span-4">
						<div className="flex items-center gap-2">
							<Logo aria-hidden className="cursor-default" />
							<h4
								aria-hidden
								className="scroll-m-20 text-4xl font-extrabold tracking-tight select-none mt-[4px] hidden xs:block"
							>
								KoronKorko
							</h4>
						</div>
					</div>

					<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 col-span-12 xl:col-span-8">
						{footerLinks.map((section) => (
							<div key={`section-${section.title}`}>
								<div className="mb-4 xl:h-12 flex items-end">
									<h4 className="scroll-m-20 text-2xl font-bold tracking-tight transition-colors first:mt-0">
										{section.title}
									</h4>
								</div>

								<ul>
									{section.links.map((link) => (
										<Link
											key={`link-${link.url}`}
											url={link.url}
											text={link.text}
										/>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<Separator className="mb-12 h-[2px] grow-1 w-full" />

				{/* Bottom */}
				<div className="mt-12 mb-4 flex items-center flex-col justify-center">
					<div className="flex justify-between mb-7 w-[min(300px,80vw)]">
						{footerSocialMedia.map((social) => (
							<a
								aria-label={social.name}
								key={social.name}
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								className="transition-all p-2 rounded-full hover:text-primary dark:hover:text-primary dark:hover:bg-opacity-20"
							>
								<social.Icon className="text-[1.6875rem]" aria-hidden />
							</a>
						))}
					</div>

					<div className="flex flex-col items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
						<div className="flex flex-col items-center gap-2 md:flex-row">
							<p>
								Developed by{' '}
								<a
									className="hover:underline hover:text-primary dark:hover:text-primary"
									href="https://www.omarkraidie.com/"
									target="_blank"
									rel="noopener noreferrer"
								>
									Omar Kraidié
								</a>
							</p>

							<span aria-hidden className="hidden md:inline select-none">
								·
							</span>

							<p className="flex items-center gap-1.5">
								Made in Finland
								<FinnishFlag className="h-3 w-auto rounded-[1px] outline outline-1 outline-neutral-300 dark:outline-neutral-600" />
							</p>
						</div>

						<p>
							<span className="text-primary">&copy; {year}</span>{' '}
							Kraidie&nbsp;Consulting&nbsp;Oy. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
