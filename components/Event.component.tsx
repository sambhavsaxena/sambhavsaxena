import { create as createConfetti } from 'canvas-confetti';
import { useEffect, useRef } from 'react';
import { EventType } from '~/types';

interface EventProps {
	event: EventType;
}

export function Event({ event }: EventProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const confetti = createConfetti(canvasRef.current, {
		resize: true,
	});
	useEffect(() => {
		switch (event) {
			case EventType.BIRTHDAY: {
				setTimeout(() => {
					Promise.all([
						confetti({
							particleCount: 100,
							startVelocity: 100,
							angle: 60,
							spread: 70,
							origin: { x: 0, y: 1 },
						}),
						confetti({
							particleCount: 100,
							startVelocity: 100,
							angle: 120,
							spread: 70,
							origin: { x: 1, y: 1 },
						}),
					]);
				}, 1000);
			}
		}
	}, [confetti, event]);
	return <canvas className="fixed inset-0 z-20" ref={canvasRef} />;
}
