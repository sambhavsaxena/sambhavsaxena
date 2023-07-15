import Image from 'next/image';
import { Fragment } from 'react';
import { Icon } from '@iconify/react';
import { tw } from 'twind';
import { Error, Loading } from '~/components/Status';
import { Status } from '~/components';
import { useStatus } from '~/lib';

import { ReactNode, useState } from 'react';

type Avatar =
	| {
			icon: boolean;
	  }
	| {
			alt: string;
			href?: string;
			url: string;
	  };

interface Activity {
	avatar: Avatar;
	title: string;
	description: string | Array<string>;
	icon?: string | ReactNode;
}

export function Widget() {
	const { color, loading, status } = useStatus();
	const [progress, setProgress] = useState(0);
	if (loading) return <Loading />;
	if (!status || Object.keys(status).length === 0 || !status) return <Error />;

	setInterval(() => {
		if (status.listening_to_spotify) {
			const progressUpdate = setInterval(() => {
				if (!status || !status.listening_to_spotify) return;
				const total = status.spotify.timestamps.end! - status.spotify.timestamps.start;
				setProgress(
					100 - (100 * (status.spotify.timestamps.end! - new Date().getTime())) / total,
				);
			}, 250);
			return () => clearInterval(progressUpdate);
		}
	}, 1000);

	const activities: Array<Activity> = [
		/**
		 * Discord User
		 */
		{
			avatar: {
				alt: 'Discord Avatar',
				href: `https://discord.com/users/${status.discord_user.id}`,
				url: `https://cdn.discordapp.com/avatars/${status.discord_user.id}/${status.discord_user.avatar}.webp?size=256`,
			},
			title: status.discord_user.username,
			description: `status: ${
				status.discord_status === 'dnd' ? 'busy' : status.discord_status
			}`,
			icon: <Status.Indicator color={color} pulse={status.discord_status !== 'offline'} />,
		},
		/**
		 * Other activities
		 */
		...(status.activities.length > 0
			? status.activities.map((activity) => {
					if (activity.id === 'custom' || activity.id.includes('spotify')) return null;
					const hasAsset = activity.assets && activity.assets.large_image ? true : false;
					/**
					 * Elapsed time
					 */
					var elapsedHours =
						new Date(activity.created_at).getHours() < 10
							? '0' + new Date(activity.created_at).getHours()
							: new Date(activity.created_at).getHours();
					var elapsedMins =
						new Date(activity.created_at).getMinutes() < 10
							? '0' + new Date(activity.created_at).getMinutes()
							: new Date(activity.created_at).getMinutes();
					var elapsed = 'Started at: ' + elapsedHours + ':' + elapsedMins + ' IST';
					/**
					 * Premid assets config
					 */
					var url = hasAsset ? activity.assets.large_image : ``;
					var id = url.split('https');
					var finalURL = 'https:/' + id[1];
					const avatar = hasAsset
						? {
								alt: activity.details,
								url:
									activity.name === 'Visual Studio Code'
										? `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.webp`
										: finalURL,
						  }
						: {
								alt: activity.name,
								icon: true,
								url: '',
						  };
					return {
						avatar,
						title: activity.name,
						description: [
							activity.details,
							...(activity.state ? [activity.state] : []),
							elapsed,
						],
						icon:
							activity.name !== 'Visual Studio Code' ? 'mdi:web' : 'mdi:code-braces',
					};
			  })
			: []),
		/**
		 * Spotify
		 */
		...(status.spotify && status.listening_to_spotify
			? [
					{
						avatar: {
							alt: `${status.spotify.song} - ${status.spotify.artist}`,
							href: `https://open.spotify.com/track/${status.spotify.track_id}`,
							url: status.spotify.album_art_url,
						},
						title: status.spotify.song,
						description: 'by ' + status.spotify.artist,
						icon: 'feather:headphones',
					},
			  ]
			: []),
	].filter((item) => item !== null);

	return (
		<div className="flex flex-col space-y-5 w-full max-w-sm mx-auto px-4 py-4 bg-white bg-opacity-50 dark:(bg-gray-900 border-gray-600) backdrop-filter backdrop-blur-sm border-2 border-gray-200 rounded-lg hover:shadow-lg default-transition">
			{activities.map((activity, index) => {
				return (
					<Fragment key={index}>
						<div className="inline-flex items-center">
							{'icon' in activity.avatar ? (
								<div className="max-w-md max-h-12 my-auto rounded pointer-events-none select-none ring-2 ring-gray-200 dark:ring-gray-500">
									<Icon
										className="w-12 h-12 p-1 text-gray-200 dark:text-gray-400"
										icon="lucide:gamepad-2"
									/>
								</div>
							) : activity.avatar.href ? (
								<a
									className="rounded default-transition default-focus"
									href={activity.avatar.href}
									target="_blank"
									rel="noreferrer noopener">
									<div className="max-w-md max-h-12 my-auto rounded pointer-events-none select-none ring-2 ring-gray-200 dark:ring-gray-500">
										<Image
											alt={activity.avatar.alt}
											className="w-full max-h-12 rounded"
											height={48}
											src={activity.avatar.url}
											width={48}
										/>
									</div>
								</a>
							) : (
								<div className="max-w-md max-h-12 my-auto rounded pointer-events-none select-none ring-2 ring-gray-200 dark:ring-gray-500">
									<Image
										alt={activity.avatar.alt}
										className="w-full max-h-12 rounded"
										height={48}
										src={activity.avatar.url}
										width={48}
									/>
								</div>
							)}
							<div className="flex-1 ml-4">
								{'icon' in activity.avatar && activity.avatar.icon ? (
									<>
										<p className="mt-0 mb-1 text-xs tracking-wide font-medium text-gray-500 dark:text-gray-400">
											Playing
										</p>
										<h1 className="text-base font-extrabold line-clamp-1 tracking-wide overflow-ellipsis text-gray-900 dark:text-white">
											{activity.title}
										</h1>
									</>
								) : Array.isArray(activity.description) ? (
									<>
										<h1 className="text-base font-extrabold line-clamp-1 tracking-wide overflow-ellipsis text-gray-900 dark:text-white">
											{activity.title}
										</h1>
										{activity.description.map(
											(description, descriptionIndex) => (
												<p
													className="mt-1 text-xs tracking-wide font-medium text-gray-500 dark:text-gray-400"
													key={descriptionIndex}>
													{description}
												</p>
											),
										)}
									</>
								) : (
									<>
										<h1 className="text-base font-extrabold line-clamp-1 tracking-wide overflow-ellipsis text-gray-900 dark:text-white">
											{activity.title}
										</h1>
										<p className="mt-1 text-xs tracking-wide font-medium text-gray-500 dark:text-gray-400">
											{activity.description}
										</p>
									</>
								)}
							</div>

							{activity.icon &&
								(typeof activity.icon === 'string' ? (
									<Icon
										className="w-6 h-6 mx-3 text-gray-200 dark:text-gray-400 motion-safe:animate-pulse"
										icon={activity.icon}
									/>
								) : (
									activity.icon
								))}
						</div>
						{activity.icon === 'feather:headphones' && (
							<div
								className={tw`bg-orange-500 w-[${progress}%] h-1 transition duration-150`}
								role="progressbar"
								aria-label="Progress in song"
								aria-valuenow={progress}
								aria-valuemin={0}
								aria-valuemax={100}></div>
						)}
						{index + 1 !== activities.length && (
							<hr className="h-0.5 bg-gray-100 dark:bg-gray-600 border-none rounded-full" />
						)}
					</Fragment>
				);
			})}
		</div>
	);
}
