import { footerLinks, footerSocialMedia } from '@/constants';
import TypographyH2 from '../TypographyH2';
import { Separator } from '../ui/separator';
import Link from './Link';
import Logo from './Logo';

const year = new Date(Date.now()).getFullYear();

const Footer = () => {
	return (
		<footer className="bg-header pt-11 pb-6 border-t-2 px-8">
			<div className="max-w-6xl mx-auto">
				{/* Top */}
				<div className="grid xl:grid-cols-12 gap-y-8 gap-x-4 pb-8">
					<div className="flex flex-col col-span-12 xl:col-span-4">
						<div className="flex items-center gap-2">
							<Logo />
							<TypographyH2 className="scroll-m-20 text-4xl font-extrabold tracking-tight select-none mt-[4px]">
								KoronKorko
							</TypographyH2>
						</div>
					</div>

					<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 col-span-12 xl:col-span-8">
						{footerLinks.map((section) => (
							<div key={`section-${section.title}`}>
								<div className="mb-4 xl:h-[50px] flex items-end">
									<TypographyH2>{section.title}</TypographyH2>
								</div>

								<ul>
									{section.links.map((link) => (
										<Link url={link.url} text={link.text} />
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<Separator className="mb-12" />

				{/* Bottom */}
				<div className="mt-12 mb-4 flex items-center flex-col justify-center">
					<div className="flex justify-between mb-7 w-[min(300px,80vw)]">
						{footerSocialMedia.map((social) => (
							<a
								key={social.name}
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								className="transition-all p-2 rounded-full hover:text-primary dark:hover:text-primary dark:hover:bg-opacity-20"
							>
								<social.Icon className="text-[1.6875rem]" />
							</a>
						))}
					</div>

					<p className="text-sm mb-2">
						Developed by{' '}
						<a
							className="text-neutral-700 dark:text-neutral-300 hover:underline hover:text-primary dark:hover:text-primary"
							href="https://www.omarkraidie.com/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Omar Kraidié
						</a>
					</p>
					<p className="text-sm mb-2">
						Copyright <span className="text-primary">{year}&copy;</span> Lahti, Finland.
						All Rights Reserved.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
