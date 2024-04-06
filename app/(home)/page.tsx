import SignInButtons from './components/SignInButtons';

export default function Home() {
	return (
		<main className="container flex flex-col items-center justify-center min-h-screen gap-8 text-center">
			<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
				Sign in to your account
			</h1>

			<SignInButtons />
		</main>
	);
}
