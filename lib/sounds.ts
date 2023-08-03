import { useSound } from 'use-sound';
import { usePersistantState } from '.';

function useClick() {
	const state = usePersistantState();
	const result = useSound('/sounds/click.mp3', {
		volume: 0.25,
	});
	if (!state.get().sound) return [() => { }, null];
	return result;
}


function useCat() {
	const state = usePersistantState();
	const result = useSound('/sounds/conga.mp3', {
		volume: 1,
	});
	if (!state.get().sound) return [() => { }, null];
	return result;
}

export { useClick, useCat };
