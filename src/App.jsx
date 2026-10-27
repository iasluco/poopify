import { useEffect, useState } from 'react'
import { Activity, Trophy, Users, Settings2, Heart, Sparkles, Cloud, CloudOff, RefreshCw, Zap } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './supabase'
import { languages, getInitialLanguage, translate } from './i18n'

const samples = [
  { id:'demo1', nickname:'Captain Colon', stool_type:'type4', volume:'L', note:'Perfect shape. Almost art.', created_at:new Date(Date.now()-720000).toISOString(), reactions:8 },
  { id:'demo2', nickname:'Bun', stool_type:'type3', volume:'M', note:'Morning release ☕', created_at:new Date(Date.now()-2580000).toISOString(), reactions:5 },
  { id:'demo3', nickname:'Professor Fart', stool_type:'type6', volume:'XL', note:'Things got out of hand.', created_at:new Date(Date.now()-5700000).toISOString(), reactions:12 },
]
const typeIds = ['type1','type2','type3','type4','type5','type6','type7']
const emojis = ['🪨','🥔','🌰','🍫','🍮','🫠','💧']
const volumeIds = ['XS','S','M','L','XL']

export default function App() {
  const [lang,setLang] = useState(getInitialLanguage)
  const t = translate(lang)
  const [entries,setEntries] = useState(samples)
  const [nickname,setNickname] = useState(localStorage.getItem('poopify-name') || '')
  const [stoolType,setStoolType] = useState('type4')
  const [volume,setVolume] = useState('M')
  const [note,setNote] = useState('')
  const [toast,setToast] = useState('')
  const [busy,setBusy] = useState(false)
  const [tab,setTab] = useState('feed')
  const [likes,setLikes] = useState({})
  const [room,setRoom] = useState(localStorage.getItem('poopify-room') || 'KAKA-CLUB')
  const [roomDraft,setRoomDraft] = useState(room)
  useEffect(()=>{ localStorage.setItem('poopify-language',lang); document.documentElement.lang=lang },[lang])
  async function loadEntries() {
    if (!isSupabaseConfigured) return
    const {data,error}=await supabase.from('poop_entries').select('*').eq('room_code',room).order('created_at',{ascending:false}).limit(50)
    if(error){setToast(`${t.dbError} ${error.message}`);return}
    setEntries(data?.length?data:[])
  }
  useEffect(()=>{loadEntries()},[room])
  useEffect(()=>{if(!isSupabaseConfigured)return;const channel=supabase.channel('poopify-feed-'+room).on('postgres_changes',{event:'*',schema:'public',table:'poop_entries',filter:`room_code=eq.${room}`},loadEntries).subscribe();return()=>{supabase.removeChannel(channel)}},[room])
  async function submitEntry(e){
    e.preventDefault(); if(!nickname.trim()){setToast(t.nicknameError);return}
    setBusy(true);localStorage.setItem('poopify-name',nickname.trim())
    const entry={nickname:nickname.trim(),stool_type:stoolType,volume,note:note.trim(),room_code:room.trim().toUpperCase()||'KAKA-CLUB'}
    if(isSupabaseConfigured){const {error}=await supabase.from('poop_entries').insert(entry);if(error){setToast(`${t.saveError} ${error.message}`);setBusy(false);return}await loadEntries()}
    else {setEntries(prev=>[{...entry,id:crypto.randomUUID(),created_at:new Date().toISOString(),reactions:0},...prev]);setToast(t.demoSaved)}
    setNote('');setBusy(false);if(isSupabaseConfigured)setToast(t.cloudSaved)
  }
  function saveRoom(e){e.preventDefault();const next=roomDraft.trim().toUpperCase().replace(/\s+/g,'-').slice(0,32);if(!next)return;setRoom(next);localStorage.setItem('poopify-room',next);setToast(`${t.roomChanged} ${next}`)}
  const sorted=[...entries].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
  const leaderboard=Object.values(entries.reduce((acc,x)=>{acc[x.nickname]||={name:x.nickname,count:0};acc[x.nickname].count++;return acc},{})).sort((a,b)=>b.count-a.count)
  const typeIndex=id=>Math.max(0,typeIds.indexOf(id))
  const typeLabel=id=>emojis[typeIndex(id)]
  const relative=date=>{const mins=Math.max(1,Math.floor((Date.now()-new Date(date).getTime())/60000));return mins<60?`${mins} ${t.timeMin}`:`${Math.floor(mins/60)} ${t.timeHour}`}
  return <div className="app-shell">
    <div className="floating-poops" aria-hidden="true"><span>💩</span><span>💩</span><span>✨</span><span>💩</span><span>⭐</span></div>
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">💩</span><span>poopify<small>{t.tagline}</small></span></a>
      <div className="language-switch" aria-label="Language selector">{Object.entries(languages).map(([code,item])=><button key={code} className={lang===code?'active':''} onClick={()=>setLang(code)} aria-pressed={lang===code}>{item.short}</button>)}</div>
      <div className="room-pill"><span className="online-dot"/><Users size={16}/><span>{room}</span></div>
      <div className={`cloud-status ${isSupabaseConfigured?'connected':''}`}>{isSupabaseConfigured?<Cloud size={16}/>:<CloudOff size={16}/>}<span>{isSupabaseConfigured?t.cloud:t.demo}</span></div>
    </header>
    <div className="layout">
      <aside className="sidebar"><div className="side-label">{t.menu}</div>
        <button className={`nav-item ${tab==='feed'?'active':''}`} onClick={()=>setTab('feed')}><Activity size={18}/>{t.feed}</button>
        <button className={`nav-item ${tab==='rating'?'active':''}`} onClick={()=>setTab('rating')}><Trophy size={18}/>{t.rating}</button>
        <button className={`nav-item ${tab==='room'?'active':''}`} onClick={()=>setTab('room')}><Users size={18}/>{t.room}</button>
        <div className="side-card"><div className="side-emoji">🏆</div><b>{t.weekly}</b><p>{t.weeklyText}</p><span className="tiny-tag">{t.season}</span></div><div className="sidebar-foot">{t.made}</div>
      </aside>
      <main className="main-content">
        {tab==='feed'&&<>
          <section className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/>{t.eyebrow}</div><h1>{t.heroTitle}<br/><span>{t.heroTitle2}</span></h1><p>{t.heroText}</p><div className="hero-stats"><div><strong>{entries.length}</strong><span>{t.events}</span></div><div><strong>{leaderboard.length}</strong><span>{t.legends}</span></div><div><strong>100%</strong><span>{t.serious}</span></div></div></div><div className="hero-art"><div className="sunburst"/><div className="big-poop">💩</div><div className="sparkle s1">✦</div><div className="sparkle s2">✧</div><div className="speech">{t.speech}<span>{t.charisma}</span></div></div></section>
          <section className="composer panel"><div className="section-heading"><div className="heading-icon">⚡</div><div><h2>{t.record}</h2><p>{t.recordText}</p></div><span className="step-badge">{t.new}</span></div>
            <form onSubmit={submitEntry}><label className="field-label">{t.nickname}</label><input className="text-input" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder={t.nicknamePlaceholder} maxLength={32}/>
              <label className="field-label">{t.stoolType} <span className="muted">{t.science}</span></label><div className="type-grid">{typeIds.map((id,i)=><button type="button" key={id} onClick={()=>setStoolType(id)} className={`type-option ${stoolType===id?'selected':''}`}><span>{emojis[i]}</span><b>{t.types[i][0]}</b><small>{t.types[i][1]}</small></button>)}</div>
              <label className="field-label">{t.volume}</label><div className="volume-grid">{volumeIds.map((id,i)=><button type="button" key={id} onClick={()=>setVolume(id)} className={`volume-option ${volume===id?'selected':''}`}><b>{id}</b><small>{t.volumes[i][0]}</small></button>)}</div>
              <label className="field-label">{t.comment} <span className="muted">{t.optional}</span></label><input className="text-input" value={note} onChange={e=>setNote(e.target.value)} placeholder={t.notePlaceholder}/>
              <button className="submit-button" disabled={busy} type="submit"><span>💩</span>{busy?t.saving:t.save}<span>→</span></button>
            </form>
          </section>
          <section className="feed-section"><div className="section-heading feed-heading"><div><h2>{t.fresh} <span className="live-badge"><i/> {t.live}</span></h2><p>{t.roomFeed}</p></div><button className="icon-button" onClick={loadEntries} title={t.refresh}><RefreshCw size={17}/></button></div>
            {sorted.length===0?<div className="empty-state"><span>🦗</span><h3>{t.quiet}</h3><p>{t.first}</p></div>:<div className="feed-list">{sorted.map((x,i)=><article className="feed-card" key={x.id}><div className={`avatar avatar-${i%5}`}>{typeLabel(x.stool_type)}</div><div className="entry-body"><div className="entry-top"><b>{x.nickname}</b><span className="time">{relative(x.created_at)}</span></div><p>{x.note||t.noComment}</p><div className="entry-tags"><span>{t.types[typeIndex(x.stool_type)][0]}</span><span>{t.size} {x.volume||'M'}</span></div></div><button className={`reaction ${likes[x.id]?'liked':''}`} onClick={()=>setLikes(p=>({...p,[x.id]:!p[x.id]}))}><Heart size={16} fill={likes[x.id]?'currentColor':'none'}/><span>{(x.reactions||0)+(likes[x.id]?1:0)}</span></button></article>)}</div>}
          </section>
        </>}
        {tab==='rating'&&<section className="panel page-panel"><div className="section-heading"><div className="heading-icon">🏆</div><div><h2>{t.hall}</h2><p>{t.hallText}</p></div></div>{leaderboard.length===0?<p>{t.noHeroes}</p>:leaderboard.map((p,i)=><div className="leader-row" key={p.name}><span className="rank">{['🥇','🥈','🥉'][i]||`#${i+1}`}</span><span className="leader-avatar">{['💩','👑','🚽'][i%3]}</span><b>{p.name}</b><span className="leader-count">{p.count} {p.count===1?t.release:t.releases}</span></div>)}</section>}
        {tab==='room'&&<section className="panel page-panel"><div className="section-heading"><div className="heading-icon"><Users/></div><div><h2>{t.myRoom}</h2><p>{t.roomText}</p></div></div><form onSubmit={saveRoom}><label className="field-label">{t.roomCode}</label><input className="text-input" value={roomDraft} onChange={e=>setRoomDraft(e.target.value)} maxLength={32} placeholder={t.roomPlaceholder}/><p className="hint">{t.roomHint}</p><button className="submit-button"><Users size={18}/>{t.enterRoom}</button></form><div className="room-share"><b>{t.invite}</b><p>{t.inviteText} <strong>{room}</strong></p><button className="secondary-button" onClick={()=>{navigator.clipboard?.writeText(`${location.origin} — ${t.roomCode}: ${room}`);setToast(t.copied)}}>{t.copy}</button></div></section>}
        <footer className="footer">POOPIFY © 2026 <span>•</span> {t.footer}</footer>
      </main>
      <aside className="rightbar"><div className="mini-profile"><div className="profile-avatar">😎</div><div><b>{nickname||t.anonymous}</b><small>{t.candidate}</small></div><button className="icon-button" onClick={()=>setTab('room')}><Settings2 size={17}/></button></div><div className="right-card"><div className="right-card-title"><Trophy size={17}/><b>{t.top}</b></div>{leaderboard.slice(0,4).map((p,i)=><div className="top-person" key={p.name}><span className="medal">{['🥇','🥈','🥉','🏅'][i]}</span><div><b>{p.name}</b><small>{p.count} {t.activities}</small></div><span className="points">{p.count*100} XP</span></div>)}{leaderboard.length===0&&<p className="muted">{t.noRecords}</p>}<button className="text-link" onClick={()=>setTab('rating')}>{t.allRating}</button></div><div className="challenge-card"><div className="challenge-top"><Zap size={16}/><span>{t.challenge}</span></div><div className="challenge-emoji">🚽</div><h3>{t.challengeTitle}</h3><p>{t.challengeText}</p><div className="challenge-progress"><span/></div><small>{t.challengeFoot}</small></div><div className="disclaimer">{t.disclaimer}</div></aside>
    </div>{toast&&<button className="toast" onClick={()=>setToast('')}>{toast}<span> ×</span></button>}
  </div>
}
