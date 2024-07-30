import { Icon } from '@iconify/react';
import { Button } from '~/components';
import { Layout } from '~/layouts';
import { NavigationItemType } from '~/types';

export default function Error() {
	return (
		<Layout.Error>
			<div className="flex flex-grow min-h-full pt-16 pb-12">
				<div className="flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-shrink-0 justify-center">
						<Icon
							className="h-12 text-primary-500 w-auto"
							icon="feather:alert-triangle"
						/>
					</div>
					<div className="py-4 text-center">
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							‘when one door closes, another opens’
							<br />
							Alexander Graham Bell
						</p>
						<div className="mt-6 flex justify-center items-center space-x-4 flex-wrap">
							<Button.Standard
								type={NavigationItemType.ACTION}
								onClick={() => history.go(-1)}
								icon="feather:arrow-left">
								Back
							</Button.Standard>
							<Button.Standard
								type={NavigationItemType.LINK}
								href="/intel"
								icon="feather:lock">
								Intel
							</Button.Standard>
							<Button.Standard
								type={NavigationItemType.LINK}
								href="/secret"
								icon="feather:key">
								Secret
							</Button.Standard>
							<Button.Standard
								type={NavigationItemType.LINK}
								href="/"
								icon="feather:home">
								Home
							</Button.Standard>
						</div>
					</div>
				</div>
			</div>
		</Layout.Error>
	);
}
