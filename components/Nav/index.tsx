import { getAuthSession } from '@/app/actions/auth';
import Link from 'next/link';
import { Button } from '../ui/button';
import LoginModal from './LoginModal';
import Logo from './Logo';
import PreferredCurrencyToggler from './PreferredCurrencyToggler';
import PremiumModal from './PremiumModal';
import ThemeToggler from './ThemeToggler';
import UserAccountNav from './UserAccountNav';

const Nav = async () => {
	const session = await getAuthSession();

	return (
		<header className="sticky inset-x-0 top-0 w-full z-50 bg-card/75 border-b-2 backdrop-blur-sm">
			<div className="flex max-w-6xl items-center justify-between h-14 mx-auto px-6 md:px-8">
				<Logo />

				<div className="gap-2 hidden md:flex">
					<Button variant="link">
						<Link href="/">Calculators</Link>
					</Button>

					<PremiumModal />

					{session?.user && (
						<Button variant="link">
							<Link href="#">Billing Portal</Link>
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<PreferredCurrencyToggler />

					<ThemeToggler />

					{session?.user ? <UserAccountNav user={session.user} /> : <LoginModal />}
				</div>
			</div>
		</header>
	);
};

export default Nav;
