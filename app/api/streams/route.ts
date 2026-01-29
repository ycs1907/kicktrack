import { NextResponse } from 'next/server';
import { getTwitchStreams, getOfficialKickStreams, getYouTubeStreams } from '@/lib/fetchers';

export const dynamic = 'force-dynamic';

async function getTwitchToken() {
  const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, { method: 'POST' });
  const data = await res.json();
  return data.access_token;
}

export async function GET() {
  try {
    const tToken = await getTwitchToken();

    const [twitch, kick, youtube] = await Promise.allSettled([
      getTwitchStreams(tToken),
      getOfficialKickStreams(),
      getYouTubeStreams()
    ]);

    const allData = [
      ...(twitch.status === 'fulfilled' ? twitch.value : []),
      ...(kick.status === 'fulfilled' ? kick.value : []),
      ...(youtube.status === 'fulfilled' ? youtube.value : [])
    ].sort((a, b) => b.viewers - a.viewers);

    return NextResponse.json(allData);
  } catch (error) {
    return NextResponse.json([]);
  }
}