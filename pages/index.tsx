import { differenceInYears, isSameDay, isSameMonth } from 'date-fns';
import { Icon } from '@iconify/react';

import { Animate, Button, Event } from '~/components';
import { EventType, NavigationItemType } from '~/types';
import { Layout } from '~/layouts';

import type { NavigationItem } from '~/types';

const ACTIONS: Array<NavigationItem> = [
	{
		type: NavigationItemType.LINK,
		href: '/blog',
		icon: <Icon className="mr-3" icon="feather:edit-3" />,
		text: 'Blog',
	},
	{
		type: NavigationItemType.LINK,
		href: '/projects',
		icon: <Icon className="mr-3" icon="feather:code" />,
		text: 'Projects',
	},
	{
		type: NavigationItemType.LINK,
		href: '/timeline',
		icon: <Icon className="mr-3" icon="feather:clock" />,
		text: 'Timeline',
	},
];

export default function HomePage() {
	const today = new Date();
	const birthday = new Date('2002-01-17');
	const isBirthday = isSameDay(today, birthday) && isSameMonth(today, birthday);

	const heading = `I am currently working as a Backend Engineer. Sometimes I make fun projects, read about history and world politics, travel and capture landscapes, and share my experiences here.`;
	const subheading = `Remember, 1.01 ^ 365 = 37.7`;

	return (
		<Layout.Default>
			{isBirthday && <Event event={EventType.BIRTHDAY} />}
			<div className="min-h-screen flex items-center justify-center py-12">
				<div className="max-w-md sm:max-w-lg md:sm:max-w-2xl lg:sm:max-w-3xl w-full space-y-8 text-center">
					<Animate
						as="h1"
						animation={{
							opacity: [0, 1],
							scale: [0.75, 1],
						}}
						className="text-gray-500 dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-5xl tracking-tight font-extrabold">
						Hello! I am Sambhav.
					</Animate>
					<Animate
						as="p"
						animation={{
							opacity: [0, 1],
							scale: [0.75, 1],
						}}
						className="max-w-xs mt-4 md:mt-8 mx-auto text-base text-gray-300 sm:text-lg md:text-lg md:max-w-3xl"
						transition={{
							delay: 0.5,
						}}>
						{heading}
						<br />
						<br />
					</Animate>
					<Animate
						as="i"
						animation={{
							opacity: [0, 1],
							scale: [0.75, 1],
						}}
						className="max-w-xs md:mt-8 mx-auto text-base text-gray-300 sm:text-m md:text-md md:max-w-3xl"
						transition={{
							delay: 0.5,
						}}>
						{subheading}
						<br />
					</Animate>
					<div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-4 space-y-4 sm:space-y-0 w-full mt-8 sm:mt-4">
						{ACTIONS.map((action, index) => {
							if (action.type !== NavigationItemType.LINK) return null;

							return (
								<Animate
									animation={{
										y: [50, 0],
										opacity: [0, 1],
									}}
									className="w-full sm:w-auto"
									key={index}
									transition={{
										delay: 0.1 * (index + 2) + 0.5,
									}}>
									<Button.Outline href={action.href}>
										{action.icon}
										<span>{action.text}</span>
									</Button.Outline>
								</Animate>
							);
						})}
					</div>
				</div>
			</div>
		</Layout.Default>
	);
}