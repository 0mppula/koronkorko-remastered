import { getAuthSession } from '@/app/actions/auth';
import LoginModal from './LoginModal';
import Logo from './Logo';
import ThemeToggler from './ThemeToggler';
import UserAccountNav from './UserAccountNav';

const Nav = async () => {
	const session = await getAuthSession();

	return (
		<nav className="fixed inset-x-0 top-0 w-screen z-50 bg-background/75 border-b-2 backdrop-blur-sm">
			<div className="flex max-w-6xl items-center justify-between h-14 mx-auto px-4 sm:px-8">
				<Logo />

				<div className="flex items-center gap-2">
					<ThemeToggler />

					{session?.user ? <UserAccountNav user={session.user} /> : <LoginModal />}
				</div>
			</div>
		</nav>
	);
};

export default Nav;
