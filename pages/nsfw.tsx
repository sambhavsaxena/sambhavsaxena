import { useEffect, useState } from 'react';
import { Layout } from '~/layouts';
import { useCat } from '~/lib';
import cub from '~/public/cub.gif';

export default function NSFW() {
	const [play] = useCat();
	const [playing, setPlaying] = useState(false);
	useEffect(() => {
		const img = document.createElement('img');
		img.src = cub.src;
		img.className = 'absolute top-0 left-0 w-full h-full object-cover';
		img.style.animation = 'grow 1s ease-in-out forwards';
		img.style.animationDelay = '1s';
		img.oncontextmenu = img.ondragstart = () => false;
		img.style.zIndex = '9999';
		document.body.appendChild(img);
		setPlaying(true);
		play();
	}, [play]);
	return <Layout.Error></Layout.Error>;
}
