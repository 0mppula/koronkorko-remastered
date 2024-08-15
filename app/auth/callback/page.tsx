import { appName } from '@/constants/data';
import { Metadata } from 'next';
import Body from './Body';

export const metadata: Metadata = {
	title: `Redirecting - ${appName}`,
};

const page = () => {
	return <Body />;
};

export default page;
