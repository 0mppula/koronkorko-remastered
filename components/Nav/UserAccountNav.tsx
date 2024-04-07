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
import { LogOut } from 'lucide-react';
import type { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/button';

interface UserAccountNavProps {
	user: Pick<User, 'name' | 'image' | 'email'>;
}

const UserAccountNav = ({ user }: UserAccountNavProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" suppressHydrationWarning>
					<Avatar className="h-[1.625rem] w-[1.625rem]">
						<AvatarImage src={user?.image ? user.image : './images/placeholder'} />

						<AvatarFallback>
							<span className="sr-only ">{user?.name}</span>
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

				<DropdownMenuSeparator />

				<DropdownMenuItem className="focus:bg-destructive/25" onClick={() => signOut()}>
					<LogOut className="mr-2 h-[1.125rem] w-[1.125rem]" /> Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserAccountNav;
