import { Icon } from '@iconify/react';
import { Button } from '~/components';
import { Layout } from '~/layouts';
import { NavigationItemType } from '~/types';

export default function Devotion() {
	return (
		<Layout.Error seo={{ title: 'peace' }}>
			<div className="flex flex-grow min-h-full pt-16 pb-12">
				<div className="flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-shrink-0 justify-center">
						<Icon className="h-12 text-primary-500 w-auto" icon="feather:sun" />
					</div>
					<div className="py-4 text-center">
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							"कर्मजं बुद्धियुक्ता हि फलं त्यक्त्वा मनीषिणः। जन्मबन्धविनिर्मुक्ताः पदं
							गच्छन्त्यनामयम्॥" २-५१
							<br />
						</p>
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							The wise, possessed of knowledge, having abandoned the fruits of their
							actions, and being freed from the fetters of birth, go to the place
							which is beyond all evil.
							<br />
						</p>
						<div className="mt-6 flex justify-center items-center space-x-4">
							<Button.Standard
								type={NavigationItemType.ACTION}
								onClick={() => history.go(-1)}
								icon="feather:arrow-left">
								Back
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
