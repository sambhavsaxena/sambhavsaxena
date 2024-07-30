import { Icon } from '@iconify/react';
import { Layout } from '~/layouts';

export default function Intelligence() {

	return (
		<Layout.Error>
			<div className="flex flex-grow min-h-full pt-16 pb-12">
				<div className="flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-shrink-0 justify-center">
						<Icon
							className="h-12 text-primary-500 w-auto"
							icon="feather:lock"
						/>
					</div>
					<div className="py-4 text-center">
						<p className="mt-8 text-s font-large text-gray-400 dark:text-gray-300">
							Here's what you will need: <br />
						</p>
						<div className="mt-6 space-x-4 text-center align-middle">
                            <span><a href='/public.asc' download>CLICK HERE TO DOWNLOAD</a></span>
						</div>
					</div>
				</div>
			</div>
		</Layout.Error>
	);
}
