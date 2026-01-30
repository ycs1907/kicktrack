"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ExternalLink, Radio, Loader2, Star, Circle } from 'lucide-react';

export default function HomePage() {
  const [streamers, setStreamers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      const parsedFavs = JSON.parse(saved);
      setFavorites(parsedFavs);
      checkFavsLiveStatus(parsedFavs);
    }
    
    loadAllData();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function checkFavsLiveStatus(favList: any[]) {
    if (favList.length === 0) return;
    try {
      const updatedFavs = await Promise.all(favList.map(async (fav) => {
        const res = await fetch(`/api/search?q=${fav.name}`);
        const data = await res.json();
        const found = data.find((d: any) => d.name.toLowerCase() === fav.name.toLowerCase());
        return found ? { ...fav, isLive: found.isLive } : fav;
      }));
      setFavorites(updatedFavs);
    } catch (e) { console.error("Favori kontrolü başarısız", e); }
  }

  async function loadAllData() {
    setLoading(true);
    try {
      const res = await fetch('/api/streams');
      const data = await res.json();
      setStreamers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        const res = await fetch(`/api/search?q=${searchQuery}`);
        const data = await res.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const toggleFavorite = (s: any) => {
    const isFav = favorites.find(f => f.id === s.id);
    const updated = isFav ? favorites.filter(f => f.id !== s.id) : [...favorites, s];
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const filtered = streamers.filter(s => filter === 'all' || s.platform === filter);

  return (
    <div className="min-h-screen bg-[#0E0E10] text-gray-100 pb-20 font-sans select-none">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0E0E10; }
        ::-webkit-scrollbar-thumb { background: #1F1F23; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #53FC18; }
        * { scrollbar-width: thin; scrollbar-color: #1F1F23 #0E0E10; }
      `}</style>

      <header className="sticky top-0 z-[100] bg-[#18181B]/95 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 cursor-pointer transition-transform active:scale-95" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-[#53FC18] rounded-xl flex items-center justify-center font-black text-black text-xl shadow-[0_0_15px_rgba(83,252,24,0.3)]">K</div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Kick<span className="text-[#53FC18]">Track</span></h1>
          </div>

          <div className="relative w-full max-w-2xl" ref={searchRef}>
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
            <input 
              type="text"
              placeholder="Yayıncı veya kanal ara..."
              className="w-full bg-[#0E0E10] border-2 border-gray-800 rounded-2xl py-3 pl-12 pr-10 focus:border-[#53FC18] outline-none transition-all text-sm font-medium select-text" 
              value={searchQuery}
              onFocus={() => { if (searchQuery.length > 2) setIsSearching(true); }}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {isSearching && searchResults.length > 0 && (
              <div className="absolute w-full mt-3 bg-[#1C1C1F] border border-gray-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] max-h-96 overflow-auto">
                {searchResults.map((result, idx) => (
                  <div key={`${result.platform}-${result.id}-${idx}`} className="flex items-center justify-between p-4 border-b border-gray-800/50 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4 truncate">
                      <img src={result.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + result.name} className="w-10 h-10 rounded-full border border-gray-700 pointer-events-none" alt="" />
                      <div className="truncate text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm truncate text-white">{result.name}</span>
                          {/* YOUTUBE KIRMIZI AYARI BURADA */}
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                            result.platform === 'kick' ? 'bg-[#53FC18] text-black' : 
                            result.platform === 'youtube' ? 'bg-[#FF0000] text-white' : 
                            'bg-[#9146FF] text-white'
                          }`}>
                            {result.platform}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Circle className={`w-2 h-2 ${result.isLive ? 'fill-[#FF0000] text-[#FF0000]' : 'fill-gray-600 text-gray-600'}`} />
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{result.isLive ? 'Canlı' : 'Çevrimdışı'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(result); }} className={`${favorites.find(f => f.id === result.id) ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'} transition-all active:scale-125`}>
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                      <a href={result.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}><ExternalLink size={20} /></a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
          {favorites.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6 text-[#53FC18] flex items-center gap-2 cursor-default">
                <Star className="w-5 h-5 fill-current" /> FAVORİLERİM
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="bg-[#18181B] p-4 rounded-3xl border border-gray-800 flex flex-col items-center gap-3 relative group hover:border-[#53FC18]/40 transition-all shadow-lg cursor-default">
                    {fav.isLive && (
                      <div className="absolute top-4 left-4 flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#FF0000] rounded-full animate-ping absolute"></div>
                        <div className="w-2 h-2 bg-[#FF0000] rounded-full relative"></div>
                      </div>
                    )}
                    <button onClick={() => toggleFavorite(fav)} className="absolute top-3 right-3 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity active:scale-125">
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                    <img src={fav.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + fav.name} className={`w-14 h-14 rounded-full border-2 ${fav.isLive ? 'border-[#FF0000]' : 'border-gray-700'} shadow-md`} alt="" />
                    <div className="flex flex-col items-center gap-1 w-full text-center">
                      <span className="text-xs font-bold truncate w-full text-white">{fav.name}</span>
                      {/* FAVORİLERDEKİ YAZI RENGİ */}
                      <span className={`text-[8px] font-black uppercase ${
                        fav.platform === 'kick' ? 'text-[#53FC18]' : 
                        fav.platform === 'youtube' ? 'text-[#FF0000]' : 
                        'text-[#9146FF]'
                      }`}>
                        {fav.platform}
                      </span>
                    </div>
                    <a href={fav.url} target="_blank" className="w-full text-center text-[10px] bg-white/5 py-2 rounded-xl hover:bg-[#53FC18] hover:text-black transition-all font-black uppercase tracking-widest">GİT</a>
                  </div>
                ))}
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent mt-12 opacity-50"></div>
            </div>
          )}

          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter cursor-default">KEŞFET</h2>
            <div className="flex gap-1 bg-[#18181B] p-1.5 rounded-full border border-gray-800 shadow-inner">
              {['all', 'kick', 'twitch', 'youtube'].map(p => (
                <button key={p} onClick={() => setFilter(p)} className={`px-6 py-2.5 rounded-full text-[10px] font-black transition-all uppercase tracking-widest ${filter === p ? 'bg-[#53FC18] text-black shadow-lg shadow-[#53FC18]/20' : 'text-gray-500 hover:text-white'}`}>{p}</button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="animate-spin text-[#53FC18]" size={48} />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Sinyal Aranıyor...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filtered.map((s, idx) => (
                <div key={`stream-${s.id}-${idx}`} className="bg-[#18181B] rounded-[2rem] overflow-hidden border border-gray-800 hover:border-[#53FC18]/40 transition-all group hover:-translate-y-1 shadow-2xl">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={s.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none" alt="" />
                    <div className="absolute top-4 left-4 bg-[#FF0000] text-[10px] font-black px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xl ring-1 ring-white/20"><Radio size={12} className="animate-pulse"/> CANLI</div>
                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 text-white select-none">{s.viewers.toLocaleString()} İZLEYİCİ</div>
                  </div>
                  <div className="p-6 flex items-center justify-between bg-gradient-to-b from-[#18181B] to-[#121214]">
                    <div className="flex items-center gap-4 truncate">
                      <img src={s.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + s.name} className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-900 pointer-events-none shadow-xl" alt="" />
                      <div className="truncate leading-none text-left">
                        <h3 className="font-bold text-sm truncate text-white mb-1.5">{s.name}</h3>
                        {/* ANA KARTLARDAKİ YOUTUBE KIRMIZI AYARI BURADA */}
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                          s.platform === 'kick' ? 'text-[#53FC18]' : 
                          s.platform === 'youtube' ? 'text-[#FF0000]' : 
                          'text-[#9146FF]'
                        }`}>
                          {s.platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={() => toggleFavorite(s)} className={`${favorites.find(f => f.id === s.id) ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'} transition-all active:scale-125`}>
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                      <a href={s.url} target="_blank" rel="noreferrer" className="bg-white/5 p-3 rounded-2xl text-gray-400 hover:text-black hover:bg-[#53FC18] transition-all"><ExternalLink size={20} /></a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </main>
    </div>
  );
}