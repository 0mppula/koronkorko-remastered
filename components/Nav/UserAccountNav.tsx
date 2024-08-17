'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import usePremiumModal from '@/hooks/usePremiumModal';
import { LogOut } from 'lucide-react';
import type { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '../ui/button';

interface UserAccountNavProps {
	user: Pick<User, 'name' | 'image' | 'email'>;
}

const UserAccountNav = ({ user }: UserAccountNavProps) => {
	const { setIsOpen } = usePremiumModal();

	const initials = useMemo(() => {
		return user?.name
			?.split(' ', 2)
			.map((name) => name[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}, [user.name]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					suppressHydrationWarning
					aria-label="Open user menu"
				>
					<Avatar className="h-[1.625rem] w-[1.625rem]">
						<AvatarImage src={user?.image ? user.image : ''} />

						<AvatarFallback className="text-[0.75rem] border-card-foreground border-2">
							{initials}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
				<DropdownMenuLabel>
					{user.name && <p className="font-normal">{user.name}</p>}
				</DropdownMenuLabel>

				<DropdownMenuLabel>
					{user.email && (
						<p className="w-[200px] truncate font-normal text-gray-500 dark:text-gray-400">
							{user.email}
						</p>
					)}
				</DropdownMenuLabel>

				<DropdownMenuSeparator className="md:hidden" />

				<DropdownMenuItem className="md:hidden" asChild>
					<Link href="/">Calculators</Link>
				</DropdownMenuItem>

				<DropdownMenuItem className="md:hidden" onClick={() => setIsOpen(true)}>
					Pricing
				</DropdownMenuItem>

				<DropdownMenuItem className="md:hidden" asChild>
					<Link
						rel="noreferrer"
						target="_blank"
						href={process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL! || '#'}
					>
						Billing Portal
					</Link>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem className="focus:bg-destructive/25" onClick={() => signOut()}>
					<LogOut aria-hidden className="mr-2 h-4 w-4" /> Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserAccountNav;
