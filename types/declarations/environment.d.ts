namespace NodeJS {
	interface ProcessEnv extends NodeJS.ProcessEnv {
		/**
		 * Discord ID
		 *
		 * @description Your personal Discord account ID
		 *
		 * @see https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-
		 */
		NEXT_PUBLIC_DISCORD_ID: string;
		NEXT_PUBLIC_FETCH_URL: string;
		GITHUB_PAT: string;
	}
}
