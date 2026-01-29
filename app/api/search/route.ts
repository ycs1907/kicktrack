import { NextResponse } from 'next/server';

async function getKickToken() {
  try {
    const res = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.KICK_CLIENT_ID!,
        client_secret: process.env.KICK_CLIENT_SECRET!,
      })
    });
    const data = await res.json();
    return data.access_token;
  } catch (e) { return null; }
}

async function getTwitchToken() {
  try {
    const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, { method: 'POST' });
    const data = await res.json();
    return data.access_token;
  } catch (e) { return null; }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.length < 3) return NextResponse.json([]);

  try {
    const [kToken, tToken] = await Promise.all([getKickToken(), getTwitchToken()]);

    const [kickRes, twitchRes, youtubeRes] = await Promise.allSettled([
      // KICK: Dökümandaki channels endpoint'ini kullanıyoruz (En güvenlisi)
      kToken ? fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(q.toLowerCase())}`, {
        headers: { 'Authorization': `Bearer ${kToken}`, 'Accept': 'application/json' }
      }).then(res => res.json()) : Promise.resolve({ data: [] }),

      // TWITCH: Kanal araması
      tToken ? fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(q)}&first=8`, {
        headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID!, 'Authorization': `Bearer ${tToken}` }
      }).then(res => res.json()) : Promise.resolve({ data: [] }),

      // YOUTUBE: Kanal araması
      fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=channel&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`).then(res => res.json())
    ]);

    const results: any[] = [];

    // 1. KICK İŞLEME (Slug bazlı sonuç)
    if (kickRes.status === 'fulfilled' && kickRes.value && kickRes.value.data) {
      kickRes.value.data.forEach((item: any) => {
        results.push({
          id: `kick-${item.broadcaster_user_id}`,
          name: item.slug,
          platform: 'kick',
          isLive: item.stream ? item.stream.is_live : false,
          avatar: item.profile_picture || item.banner_picture || '',
          url: `https://kick.com/${item.slug}`
        });
      });
    }

    // 2. TWITCH İŞLEME
    if (twitchRes.status === 'fulfilled' && twitchRes.value && twitchRes.value.data) {
      twitchRes.value.data.forEach((item: any) => {
        results.push({
          id: `twitch-${item.id}`,
          name: item.display_name,
          platform: 'twitch',
          isLive: item.is_live,
          avatar: item.thumbnail_url,
          url: `https://twitch.tv/${item.broadcaster_login}`
        });
      });
    }

    // 3. YOUTUBE İŞLEME
    if (youtubeRes.status === 'fulfilled' && youtubeRes.value && youtubeRes.value.items) {
      youtubeRes.value.items.forEach((item: any) => {
        results.push({
          id: `youtube-${item.id.channelId}`,
          name: item.snippet.title,
          platform: 'youtube',
          isLive: false,
          avatar: item.snippet.thumbnails?.default?.url,
          url: `https://youtube.com/channel/${item.id.channelId}`
        });
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json([]);
  }
}