'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import usePremiumModal from '@/hooks/usePremiumModal';
import { LogIn, Menu } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { toast } from 'sonner';
import { ButtonWithIcon } from '../ButtonWithIcon';
import { Button } from '../ui/button';

const LoginModal = () => {
	const [googleIsLoading, setGoogleIsLoading] = useState(false);
	const [githubIsLoading, setGithubIsLoading] = useState(false);
	const { setIsOpen } = usePremiumModal();

	const socialAction = async (provider: string) => {
		if (provider === 'google') {
			setGoogleIsLoading(true);
		}

		if (provider === 'github') {
			setGithubIsLoading(true);
		}

		await signIn(provider).then((callback) => {
			if (callback?.error) {
				toast.error('An error occurred while trying to login. Please try again.');
			}
		});
	};

	return (
		<>
			<Dialog>
				{/* Desktop Login button */}
				<DialogTrigger asChild className="hidden md:flex">
					<Button>
						Login <LogIn className="ml-1 h-[1.125rem] w-[1.125rem]" />
					</Button>
				</DialogTrigger>

				{/* Mobile Login button & Nav */}
				<DropdownMenu>
					<DropdownMenuTrigger className="flex md:hidden" asChild>
						<Button size="icon" variant="ghost" aria-label="Open menu">
							<Menu />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent>
						<DropdownMenuItem asChild>
							<Link href="/">Calculators</Link>
						</DropdownMenuItem>

						<DropdownMenuItem className="md:hidden" onClick={() => setIsOpen(true)}>
							Premium
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DialogTrigger className="w-full">
							<DropdownMenuItem>
								Login <LogIn className="ml-1 h-[1.125rem] w-[1.125rem]" />
							</DropdownMenuItem>
						</DialogTrigger>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Login Modal */}
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Login to KoronKorko</DialogTitle>
					</DialogHeader>

					<form className="gap-2 flex flex-col" onSubmit={(e) => e.preventDefault()}>
						<ButtonWithIcon
							loading={googleIsLoading}
							disabled={googleIsLoading || githubIsLoading}
							type="button"
							className="w-full"
							icon={FaGoogle}
							onClick={() => socialAction('google')}
						>
							Continue with Google
						</ButtonWithIcon>

						<ButtonWithIcon
							loading={githubIsLoading}
							disabled={googleIsLoading || githubIsLoading}
							type="button"
							className="w-full"
							icon={FaGithub}
							onClick={() => socialAction('github')}
						>
							Continue with Github
						</ButtonWithIcon>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default LoginModal;
