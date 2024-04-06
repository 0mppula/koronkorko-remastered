'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Github } from 'lucide-react';
import { signIn } from 'next-auth/react';

const SignInButtons = () => {
	const { toast } = useToast();

	const handleSignIn = async (provider: string) => {
		await signIn(provider).then((callback) => {
			if (callback?.error) {
				toast({
					description: 'Invalid credentials. Please try again.',
				});
			}
		});
	};
	return (
		<div className="flex gap-4">
			<Button onClick={() => handleSignIn('github')} className="flex gap-2">
				Sign In <Github />
			</Button>

			<Button onClick={() => handleSignIn('google')} className="flex gap-2">
				Sign In GOOGLE
			</Button>
		</div>
	);
};

export default SignInButtons;
