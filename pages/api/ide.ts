import type { NextApiRequest, NextApiResponse } from 'next';

interface Response {
	url: string;
    github: string;
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
	try {
		const response = {
            url: "https://servertostring.onrender.com/api/submit/code",
            github: "https://github.com/sambhavsaxena/"
        }
		const json = response as Response;
		res.send(json);
	} catch (error) {
		res.send(error);
	}
}
