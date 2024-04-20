'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { LogIn } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { ButtonWithIcon } from '../ButtonWithIcon';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';

const LoginModal = () => {
	const [googleIsLoading, setGoogleIsLoading] = useState(false);
	const [githubIsLoading, setGithubIsLoading] = useState(false);

	const { toast } = useToast();

	const socialAction = async (provider: string) => {
		if (provider === 'google') {
			setGoogleIsLoading(true);
		}

		if (provider === 'github') {
			setGithubIsLoading(true);
		}

		await signIn(provider).then((callback) => {
			if (callback?.error) {
				toast({
					description: 'An error occurred while trying to login. Please try again.',
					variant: 'destructive',
				});
			}
		});
	};

	return (
		<>
			<Dialog>
				<DialogTrigger asChild>
					<Button>
						Login <LogIn className="ml-1 h-[1.125rem] w-[1.125rem]" />
					</Button>
				</DialogTrigger>

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
