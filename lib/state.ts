import { createState, useState } from '@hookstate/core';
import { Persistence } from '@hookstate/persistence';
import { useEffect } from 'react';
import { useMedia } from 'react-use';

import type { Settings } from '~/types';

// Note: `createState` needed as without it it looses reactivity for some reason. Needs to be looked into further
const DEFAULT_STATE = createState<Settings>({
	animations: true,
	sound: true,
});

export const STATE_KEY = 'settings';

export function usePersistantState() {
	const noMotionPreference = useMedia('(prefers-reduced-motion: no-preference)', false);
	const persistance = Persistence(STATE_KEY);
	const state = useState<Settings>(DEFAULT_STATE);
	useEffect(() => {
		state.attach(persistance);
		if (state.get().animations === null)
			state.set((state) => ({
				...state,
				animations: noMotionPreference,
			}));
	}, [noMotionPreference, persistance, state]);
	return state;
}
