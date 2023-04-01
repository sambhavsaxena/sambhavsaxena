import { useSound } from 'use-sound';
import { usePersistantState } from '.';

export function useClick() {
	const state = usePersistantState();
	const result = useSound('/sounds/click.mp3', {
		volume: 0.25,
	});

	if (!state.get().sound) return [() => { }, null];

	return result;
}
