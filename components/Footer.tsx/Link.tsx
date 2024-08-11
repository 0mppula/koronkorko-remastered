interface LinkProps {
	url: string;
	text: string;
}

const Link = ({ url, text }: LinkProps) => {
	return (
		<li className="mb-1 text-sm text-neutral-700 dark:text-neutral-300">
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="hover:underline hover:text-primary dark:hover:text-primary"
			>
				{text}
			</a>
		</li>
	);
};

export default Link;
