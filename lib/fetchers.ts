export interface StreamData {
  id: string;
  name: string;
  platform: 'kick' | 'twitch' | 'youtube';
  viewers: number;
  isLive: boolean;
  category: string;
  avatar: string;
  thumbnail: string;
  url: string;
}

// Yeni: Resmi Kick Token Alıcı
async function getKickAppAccessToken() {
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

// İSİM DÜZELTİLDİ: getOfficialKickStreams
export async function getOfficialKickStreams(): Promise<StreamData[]> {
  try {
    const token = await getKickAppAccessToken();
    if (!token) return [];

    const res = await fetch('https://api.kick.com/public/v1/livestreams', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'KickTrack/1.0'
      }
    });
    
    if (!res.ok) return [];
    const json = await res.json();
    
    return (json.data || []).slice(0, 12).map((s: any) => ({
      id: `kick-${s.channel_id}`,
      name: s.slug,
      platform: 'kick',
      viewers: s.viewer_count || 0,
      isLive: true,
      category: s.category?.name || 'Yayın',
      avatar: s.profile_picture || '',
      thumbnail: s.thumbnail || '',
      url: `https://kick.com/${s.slug}`
    }));
  } catch (e) { return []; }
}

// İSİM DÜZELTİLDİ/EKLENDİ: getYouTubeStreams
export async function getYouTubeStreams(query: string = "live gaming"): Promise<StreamData[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&eventType=live&maxResults=10&key=${process.env.YOUTUBE_API_KEY}`
    );
    const json = await res.json();
    return (json.items || []).map((item: any) => ({
      id: `youtube-${item.id.videoId}`,
      name: item.snippet.channelTitle,
      platform: 'youtube',
      viewers: 0, 
      isLive: true,
      category: 'YouTube Live',
      avatar: item.snippet.thumbnails?.default?.url,
      thumbnail: item.snippet.thumbnails?.high?.url,
      url: `https://youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (e) { return []; }
}

// TWITCH (Senin çalışan yapın)
export async function getTwitchStreams(token: string): Promise<StreamData[]> {
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?first=15`, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await res.json();
    return json.data.map((s: any) => ({
      id: `twitch-${s.id}`,
      name: s.user_name,
      platform: 'twitch',
      viewers: s.viewer_count,
      isLive: true,
      category: s.game_name,
      avatar: '', 
      thumbnail: s.thumbnail_url.replace('{width}', '440').replace('{height}', '248'),
      url: `https://twitch.tv/${s.user_login}`
    }));
  } catch (e) { return []; }
}