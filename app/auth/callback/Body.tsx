'use client';
import ReportSpinner from '@/components/Spinners/ReportSpinner';
import { USER_QUERY_KEY } from '@/constants/api';
import useLoadingStore from '@/hooks/useLoadingStore';
import { getUser } from '@/lib/queryFns/auth';
import { User } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const Body = () => {
	const { status: sessionStatus } = useSession();
	const { isGlobalLoading } = useLoadingStore();
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get('callbackUrl');

	const {
		data: userData,
		isLoading,
		isFetching,
	} = useQuery<User | null>({
		queryKey: [USER_QUERY_KEY, { sessionStatus }],
		queryFn: () => getUser(sessionStatus),
		enabled: sessionStatus === 'authenticated',
		refetchOnWindowFocus: false,
	});

	if (sessionStatus === 'unauthenticated') router.replace('/');

	useEffect(() => {
		if (sessionStatus === 'authenticated' && callbackUrl !== null && userData?.email) {
			router.replace(callbackUrl + `?prefilled_email=${userData.email}`);
		} else if (sessionStatus === 'unauthenticated') {
			router.replace('/');
		}
	}, [sessionStatus, userData, callbackUrl, isLoading]);

	return (
		<div>
			{!(isLoading || isFetching || sessionStatus === 'loading' || isGlobalLoading) && (
				<ReportSpinner />
			)}
		</div>
	);
};

export default Body;
