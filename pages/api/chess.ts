import fetch from 'node-fetch';

import type { NextApiRequest, NextApiResponse } from 'next';

interface Response {
	avatar: string;
	player_id: number;
	url: string;
	name: string;
	username: number;
	followers: number;
	country: string;
	location: string;
	last_online: number;
	joined: number;
	status: string;
	is_streamer: boolean;
	verified: boolean;
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
	try {
		const response = await fetch('https://api.chess.com/pub/player/sambhavsaxena');
		const json = (await response.json()) as Response;
		res.send(json);
	} catch (error) {
		res.send(error);
	}
}
