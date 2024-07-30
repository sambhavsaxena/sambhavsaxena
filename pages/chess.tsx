import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout } from '~/layouts';
import { Animate, List } from '~/components';
import { ListActionType } from '~/types';

interface PlayerData {
	avatar: string;
	player_id: number;
	id: string;
	url: string;
	name: string;
	username: string;
	followers: number;
	country: string;
	location: string;
	last_online: number;
	joined: number;
	status: string;
	is_streamer: boolean;
	verified: boolean;
	league: string;
	streaming_platforms: string[];
}

const ChessCard = () => {
	const [playerData, setPlayerData] = useState<PlayerData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const username = 'sambhavsaxena';

	useEffect(() => {
		const fetchPlayerData = async () => {
			try {
				const response = await axios.get(`https://api.chess.com/pub/player/${username}`);
				const data = response.data;
				setPlayerData({
					avatar: data.avatar,
					player_id: data.player_id,
					id: data['@id'],
					url: data.url,
					name: data.name,
					username: data.username,
					followers: data.followers,
					country: data.country,
					location: data.location,
					last_online: data.last_online,
					joined: data.joined,
					status: data.status,
					is_streamer: data.is_streamer,
					verified: data.verified,
					league: data.league,
					streaming_platforms: data.streaming_platforms,
				});
				setLoading(false);
			} catch (error) {
				setError('Failed to fetch player data');
				setLoading(false);
			}
		};

		fetchPlayerData();
	}, [username]);

	if (loading || error) {
		return <Layout.Default seo={{ title: `Chess Profile - Loading` }}>
    <div className="my-24 mx-2 sm:mx-6 lg:mb-28 lg:mx-8">
      <div className="relative max-w-xl mx-auto">
        <List.Container>
          <Animate
            animation={{ y: [50, 0], opacity: [0, 1] }}
            transition={{
              delay: 0.1,
            }}
          >
            <List.Item
              icon={
                <span className="text-xl">♟</span>
              }
              title={loading ? "Loading from chess.com" : `Error: ${error}`}
            />
          </Animate>
        </List.Container>
      </div>
    </div>
  </Layout.Default>
	}

	return (
		<Layout.Default seo={{ title: `Chess Profile - ${playerData.name}` }}>
			<div className="my-24 mx-2 sm:mx-6 lg:mb-28 lg:mx-8">
				<div className="relative max-w-xl mx-auto">
					<List.Container>
						<Animate
							animation={{ y: [50, 0], opacity: [0, 1] }}
							transition={{
								delay: 0.1,
							}}
						>
							<List.Item
								actions={[
									{
										type: ListActionType.LINK,
										href: playerData.url,
										icon: 'feather:user',
										label: 'Chess.com Profile',
									},
								]}
								description={`chess.com ID: ${playerData.player_id} | Current League: ${playerData.league} `}
								icon={
									playerData.avatar ? (
										<img src={playerData.avatar} alt={`${playerData.username} avatar`} className="w-10 h-10 rounded-full" />
									) : (
										<span className="text-xl">♟</span>
									)
								}
								title={playerData.name}
							/>
						</Animate>
					</List.Container>
				</div>
			</div>
		</Layout.Default>
	);
};

export default ChessCard;
