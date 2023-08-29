import { Icon } from '@iconify/react';
import { Layout } from '~/layouts';

export default function Colleagues() {
	return (
		<Layout.Error seo={{ title: 'sambhavsaxena ─ colleagues' }}>
			<div className="flex flex-grow min-h-full pt-16 pb-12">
				<div className="flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-shrink-0 justify-center">
						<Icon className="h-12 text-primary-500 w-auto" icon="feather:star" />
					</div>
					<div className="flex flex-shrink-0 justify-center text-center">
						<p className="mt-6 text-l text-gray-900 dark:text-white">
							Here's a worthy mention to some of my colleagues who had always been
							there regardless.
						</p>
					</div>
					<div className="py-4 text-center">
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							-{' '}
							<a
								href="https://www.linkedin.com/in/parikshit-verma-598068201/"
								target="_blank"
								className="text-blue-600">
								Parikshit Verma
							</a>
						</p>
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							-{' '}
							<a
								href="https://www.linkedin.com/in/aryan-sanghi-0b9a6a214/"
								target="_blank"
								className="text-blue-600">
								Aryan Sanghi
							</a>
						</p>
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							-{' '}
							<a
								href="https://www.linkedin.com/in/jainansal/"
								target="_blank"
								className="text-blue-600">
								Ansal Jain
							</a>
						</p>
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							-{' '}
							<a
								href="https://www.linkedin.com/in/dhruv-sharma-b79143231/"
								target="_blank"
								className="text-blue-600">
								Dhruv Sharma
							</a>
						</p>
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							-{' '}
							<a
								href="https://www.linkedin.com/in/harsh-prajapati-also/"
								target="_blank"
								className="text-blue-600">
								Harsh Prajapati
							</a>
						</p>
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							-{' '}
							<a
								href="https://www.linkedin.com/in/himanshu-rishi/"
								target="_blank"
								className="text-blue-600">
								Himanshu Rishi
							</a>
						</p>
						<p className="mt-8 text-sm font-medium text-gray-400 dark:text-gray-300">
							-{' '}
							<a
								href="https://www.linkedin.com/in/jitender-sharma-78420a201/"
								target="_blank"
								className="text-blue-600">
								Jitender Sharma
							</a>
						</p>
					</div>
				</div>
			</div>
		</Layout.Error>
	);
}
