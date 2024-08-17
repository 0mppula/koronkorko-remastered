import TypographyH1 from '@/components/TypographyH1';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthSession } from '../actions/auth';

const page = async () => {
	const session = await getAuthSession();

	if (!session || session.user.plan !== 'premium') {
		return redirect('/');
	}

	return (
		<>
			<TypographyH1>Thank You</TypographyH1>

			<p className="mb-4 text-center">
				Congratulations! You&apos;re now a premium KoronKorko member! 🎉
			</p>

			<Button asChild>
				<Link href="/">Calculators</Link>
			</Button>
		</>
	);
};

export default page;
