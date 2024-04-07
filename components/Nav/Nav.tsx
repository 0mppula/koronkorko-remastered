import { getAuthSession } from '@/app/actions/auth';
import LoginModal from './LoginModal';
import Logo from './Logo';
import ThemeToggler from './ThemeToggler';
import UserAccountNav from './UserAccountNav';

const Nav = async () => {
	const session = await getAuthSession();

	return (
		<nav className="fixed top-0 w-full h-14 flex justify-between items-center z-50 bg-background border-b-2">
			<Logo />

			<div className="flex items-center gap-2 mr-4">
				<ThemeToggler />

				{session?.user ? <UserAccountNav user={session.user} /> : <LoginModal />}
			</div>
		</nav>
	);
};

export default Nav;
