import type { IframeHTMLAttributes } from 'react';

interface XVimeoProps {
	id: string;
	title: string;
}
interface IFrameProps extends IframeHTMLAttributes<HTMLElement> {}

export function XVimeo({ id, title }: XVimeoProps) {
	return (
		<div className="relative w-full h-0 my-2 pb-[56.250%]">
			<iframe
				className="absolute top-0 left-0 w-full h-full border-none rounded-lg overflow-hidden"
				src={`https://player.vimeo.com/video/${id}?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479`}
				frameBorder={0}
				height="100%"
				width="100%"
				loading="lazy"
				title={title}
				allowFullScreen
				allow="autoplay; fullscreen; picture-in-picture"
				style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
			/>
		</div>
	);
}
