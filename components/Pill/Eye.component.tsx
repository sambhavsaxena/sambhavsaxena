import clsx from 'clsx';
import { Icon } from '@iconify/react';
import type { WithChildren, WithClassName } from '~/types';

interface EyePillProps extends WithClassName, WithChildren {
	small?: boolean;
}

export function EyePill({ children, className, small = false }: EyePillProps) {
	return (
		<div
			className={clsx(
				'inline-flex justify-center w-full sm:w-auto bg-primary-500 bg-opacity-15 backdrop-filter backdrop-blur-sm saturate-200 rounded-lg text-sm text-primary-500',
				small ? 'px-2 py-1' : 'px-4 py-2',
				className,
			)}>
			<Icon className={clsx('mt-0.5', small ? 'mr-1.5' : 'mr-3')} icon="feather:eye" />
			{children}
		</div>
	);
}
