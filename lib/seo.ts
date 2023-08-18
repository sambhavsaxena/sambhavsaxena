import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';

import type { ComponentProps } from 'react';

export function useSeoProps(
	props: Partial<ComponentProps<typeof NextSeo>> = {},
): Partial<ComponentProps<typeof NextSeo>> {
	const router = useRouter();
	const title = 'sambhavsaxena';
	const description = "Sambhav Saxena's personal website.";
	return {
		title,
		description,
		canonical: `https://interpreted.vercel.app/${router.asPath}`,
		openGraph: {
			title: title,
			description: description,
			site_name: 'sambhavsaxena',
			url: `https://interpreted.vercel.app/${router.asPath}`,
			type: 'website',
			images: [
				{
					url: 'https://interpreted.vercel.app/banner.png',
					alt: description,
					width: 1280,
					height: 720,
				},
			],
		},
		twitter: {
			cardType: 'summary_large_image',
			handle: '@_sambhavsaxena',
			site: '@sambhavsaxena',
		},
		...props,
	};
}
