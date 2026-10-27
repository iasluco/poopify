import { useEffect, useState } from 'react'
import { Activity, Trophy, Users, Settings2, Plus, Sparkles, Heart, Zap, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './supabase'

const samples = [
  { id: 'demo1', nickname: 'Капитан Кишка', stool_type: 'type4', volume: 'L', note: 'Идеально по форме. Почти искусство.', created_at: new Date(Date.now()-1000*60*12).toISOString(), reactions: 8 },
  { id: 'demo2', nickname: 'Булочка', stool_type: 'type3', volume: 'M', note: 'Утренний релиз ☕', created_at: new Date(Date.now()-1000*60*43).toISOString(), reactions: 5 },
  { id: 'demo3', nickname: 'Профессор Пук', stool_type: 'type6', volume: 'XL', note: 'Ситуация вышла из-под контроля.', created_at: new Date(Date.now()-1000*60*95).toISOString(), reactions: 12 },
]
const types = [
  { id: 'type1', name: 'Тип 1', desc: 'Отдельные твёрдые комочки', emoji: '🪨' },
  { id: 'type2', name: 'Тип 2', desc: 'Комковатая колбаска', emoji: '🥔' },
  { id: 'type3', name: 'Тип 3', desc: 'С трещинками', emoji: '🌰' },
  { id: 'type4', name: 'Тип 4', desc: 'Гладкий и мягкий', emoji: '🍫' },
  { id: 'type5', name: 'Тип 5', desc: 'Мягкие кусочки', emoji: '🍮' },
  { id: 'type6', name: 'Тип 6', desc: 'Пушистые края', emoji: '🫠' },
  { id: 'type7', name: 'Тип 7', desc: 'Водянистый', emoji: '💧' },
]
const volumes = [{id:'XS',label:'XS',desc:'мини'},{id:'S',label:'S',desc:'малый'},{id:'M',label:'M',desc:'средний'},{id:'L',label:'L',desc:'крупный'},{id:'XL',label:'XL',desc:'гигант'}]
const relative = (date) => {
  const mins = Math.max(1, Math.floor((Date.now()-new Date(date).getTime())/60000))
  return mins < 60 ? `${mins} мин. назад` : `${Math.floor(mins/60)} ч. назад`
}

export default function App() {
  const [entries, setEntries] = useState(samples)
  const [nickname, setNickname] = useState(localStorage.getItem('poopify-name') || '')
  const [stoolType, setStoolType] = useState('type4')
  const [volume, setVolume] = useState('M')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('feed')
  const [likes, setLikes] = useState({})
  const [room, setRoom] = useState(localStorage.getItem('poopify-room') || 'KAKA-CLUB')
  const [roomDraft, setRoomDraft] = useState(room)

  async function loadEntries() {
    if (!isSupabaseConfigured) return
    const { data, error } = await supabase.from('poop_entries').select('*').eq('room_code', room).order('created_at', { ascending: false }).limit(50)
    if (error) { setToast(`База: ${error.message}`); return }
    setEntries(data?.length ? data : [])
  }
  useEffect(() => { loadEntries() }, [room])
  useEffect(() => { if (!isSupabaseConfigured) return; const channel = supabase.channel('poopify-feed-'+room).on('postgres_changes', { event: '*', schema: 'public', table: 'poop_entries', filter: `room_code=eq.${room}` }, loadEntries).subscribe(); return () => { supabase.removeChannel(channel) } }, [room])

  async function submitEntry(e) {
    e.preventDefault()
    if (!nickname.trim()) { setToast('Сначала придумай себе никнейм 😎'); return }
    setBusy(true)
    localStorage.setItem('poopify-name', nickname.trim())
    const entry = { nickname: nickname.trim(), stool_type: stoolType, volume, note: note.trim(), room_code: room.trim().toUpperCase() || 'KAKA-CLUB' }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('poop_entries').insert(entry)
      if (error) { setToast(`Не удалось сохранить: ${error.message}`); setBusy(false); return }
      await loadEntries()
    } else {
      setEntries(prev => [{ ...entry, id: crypto.randomUUID(), created_at: new Date().toISOString(), reactions: 0 }, ...prev])
      setToast('Демо-запись добавлена только на этом устройстве. Подключи Supabase для синхронизации.')
    }
    setNote('')
    setBusy(false)
    if (isSupabaseConfigured) setToast('Запись улетела в облако! ☁️💩')
  }
  function saveRoom(e) {
    e.preventDefault()
    const next = roomDraft.trim().toUpperCase().replace(/\s+/g,'-').slice(0,32)
    if (!next) return
    setRoom(next); localStorage.setItem('poopify-room', next); setToast(`Ты в комнате ${next}`)
  }
  const sorted = [...entries].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
  const leaderboard = Object.values(entries.reduce((acc, x) => { acc[x.nickname] ||= { name:x.nickname, count:0, volume:0 }; acc[x.nickname].count++; acc[x.nickname].volume += ({XS:1,S:2,M:3,L:4,XL:5}[x.volume]||3); return acc }, {})).sort((a,b)=>b.count-a.count)
  const typeLabel = id => types.find(t=>t.id===id)?.emoji || '💩'

  return <div className="app-shell">
    <div className="floating-poops" aria-hidden="true"><span>💩</span><span>💩</span><span>✨</span><span>💩</span><span>⭐</span></div>
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">💩</span><span>poopify<small>КТО НАВАЛИЛ?</small></span></a>
      <div className="room-pill"><span className="online-dot"/><Users size={16}/><span>{room}</span></div>
      <div className={`cloud-status ${isSupabaseConfigured?'connected':''}`}>{isSupabaseConfigured?<Cloud size={16}/>:<CloudOff size={16}/>}<span>{isSupabaseConfigured?'Облако подключено':'Демо-режим'}</span></div>
    </header>

    <div className="layout">
      <aside className="sidebar">
        <div className="side-label">МЕНЮ</div>
        <button className={`nav-item ${tab==='feed'?'active':''}`} onClick={()=>setTab('feed')}><Activity size={18}/> Лента событий</button>
        <button className={`nav-item ${tab==='rating'?'active':''}`} onClick={()=>setTab('rating')}><Trophy size={18}/> Зал славы</button>
        <button className={`nav-item ${tab==='room'?'active':''}`} onClick={()=>setTab('room')}><Users size={18}/> Моя комната</button>
        <div className="side-card"><div className="side-emoji">🏆</div><b>Кака недели</b><p>Каждый релиз приближает тебя к легенде.</p><span className="tiny-tag">СЕЗОН 01</span></div>
        <div className="sidebar-foot">Сделано с любовью<br/>и клетчаткой 💛</div>
      </aside>

      <main className="main-content">
        {tab==='feed' && <>
          <section className="hero">
            <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> ТВОЯ КИШКА — ТВОЯ ИСТОРИЯ</div><h1>Большие дела.<br/><span>Большие достижения.</span></h1><p>Фиксируй свои подвиги, следи за друзьями и впиши своё имя в историю туалета.</p><div className="hero-stats"><div><strong>{entries.length}</strong><span>событий</span></div><div><strong>{leaderboard.length}</strong><span>легенд</span></div><div><strong>100%</strong><span>серьёзно?</span></div></div></div>
            <div className="hero-art"><div className="sunburst"/><div className="big-poop">💩</div><div className="sparkle s1">✦</div><div className="sparkle s2">✧</div><div className="speech">ВЕЛИКОЛЕПНО!<span>+100 к харизме</span></div></div>
          </section>
          <section className="composer panel">
            <div className="section-heading"><div className="heading-icon">⚡</div><div><h2>Зафиксировать покак</h2><p>История должна знать своих героев</p></div><span className="step-badge">НОВЫЙ РЕЛИЗ</span></div>
            <form onSubmit={submitEntry}>
              <label className="field-label">ТВОЙ НИКНЕЙМ</label><input className="text-input" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Например, Капитан Кишка" maxLength={32}/>
              <label className="field-label">ТИП ПО БРИСТОЛЬСКОЙ ШКАЛЕ <span className="muted">(это почти наука)</span></label>
              <div className="type-grid">{types.map(t=><button type="button" key={t.id} onClick={()=>setStoolType(t.id)} className={`type-option ${stoolType===t.id?'selected':''}`}><span>{t.emoji}</span><b>{t.name}</b><small>{t.desc}</small></button>)}</div>
              <label className="field-label">МАСШТАБ СОБЫТИЯ</label>
              <div className="volume-grid">{volumes.map(v=><button type="button" key={v.id} onClick={()=>setVolume(v.id)} className={`volume-option ${volume===v.id?'selected':''}`}><b>{v.label}</b><small>{v.desc}</small></button>)}</div>
              <label className="field-label">КОММЕНТАРИЙ <span className="muted">(по желанию)</span></label><input className="text-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Как всё прошло?"/>
              <button className="submit-button" disabled={busy} type="submit"><span>💩</span>{busy?'Сохраняем…':'ЗАФИКСИРОВАТЬ ПОКАК'}<span>→</span></button>
            </form>
          </section>
          <section className="feed-section"><div className="section-heading feed-heading"><div><h2>Свежие подвиги <span className="live-badge"><i/> LIVE</span></h2><p>Что творится в твоей комнате</p></div><button className="icon-button" onClick={loadEntries} title="Обновить"><RefreshCw size={17}/></button></div>
            {sorted.length===0?<div className="empty-state"><span>🦗</span><h3>Пока тихо… подозрительно тихо</h3><p>Будь первым, кто оставит след в истории.</p></div>:<div className="feed-list">{sorted.map((x,i)=><article className="feed-card" key={x.id}><div className={`avatar avatar-${i%5}`}>{typeLabel(x.stool_type)}</div><div className="entry-body"><div className="entry-top"><b>{x.nickname}</b><span className="time">{relative(x.created_at)}</span></div><p>{x.note || 'Без комментариев. Работа говорит сама за себя.'}</p><div className="entry-tags"><span>{types.find(t=>t.id===x.stool_type)?.name||'Тип 4'}</span><span>Объём {x.volume||'M'}</span></div></div><button className={`reaction ${likes[x.id]?'liked':''}`} onClick={()=>setLikes(p=>({...p,[x.id]:!p[x.id]}))}><Heart size={16} fill={likes[x.id]?'currentColor':'none'}/><span>{(x.reactions||0)+(likes[x.id]?1:0)}</span></button></article>)}</div>}
          </section>
        </>}
        {tab==='rating' && <section className="panel page-panel"><div className="section-heading"><div className="heading-icon">🏆</div><div><h2>Зал славы</h2><p>Легенды не рождаются — они фиксируются</p></div></div>{leaderboard.length===0?<p>Пока нет героев. Всё ещё впереди.</p>:leaderboard.map((p,i)=><div className="leader-row" key={p.name}><span className="rank">{['🥇','🥈','🥉'][i]||`#${i+1}`}</span><span className="leader-avatar">{['💩','👑','🚽'][i%3]}</span><b>{p.name}</b><span className="leader-count">{p.count} {p.count===1?'релиз':'релизов'}</span></div>)}</section>}
        {tab==='room' && <section className="panel page-panel"><div className="section-heading"><div className="heading-icon"><Users/></div><div><h2>Моя комната</h2><p>Один код — одна команда — много вопросов</p></div></div><form onSubmit={saveRoom}><label className="field-label">КОД КОМНАТЫ</label><input className="text-input" value={roomDraft} onChange={e=>setRoomDraft(e.target.value)} maxLength={32} placeholder="НАПРИМЕР-KAKA-CLUB"/><p className="hint">Друзья должны ввести такой же код, чтобы видеть одну ленту. В текущей версии код комнаты не является надёжной защитой приватности.</p><button className="submit-button"><Users size={18}/> ПЕРЕЙТИ В КОМНАТУ →</button></form><div className="room-share"><b>Пригласи друзей</b><p>Отправь им ссылку на сайт и код комнаты: <strong>{room}</strong></p><button className="secondary-button" onClick={()=>{navigator.clipboard?.writeText(`${location.origin} — код комнаты: ${room}`);setToast('Текст приглашения скопирован')}}>Скопировать приглашение</button></div></section>}
        <footer className="footer">POOPIFY © 2026 <span>•</span> Шутки шутками, а гидратацию не забывай 💧</footer>
      </main>

      <aside className="rightbar"><div className="mini-profile"><div className="profile-avatar">😎</div><div><b>{nickname||'Анонимный герой'}</b><small>Кандидат в легенды</small></div><button className="icon-button" onClick={()=>setTab('room')}><Settings2 size={17}/></button></div><div className="right-card"><div className="right-card-title"><Trophy size={17}/><b>Топ легенд</b></div>{leaderboard.slice(0,4).map((p,i)=><div className="top-person" key={p.name}><span className="medal">{['🥇','🥈','🥉','🏅'][i]}</span><div><b>{p.name}</b><small>{p.count} событий</small></div><span className="points">{p.count*100} XP</span></div>)}{leaderboard.length===0&&<p className="muted">Пока без рекордов.</p>}<button className="text-link" onClick={()=>setTab('rating')}>Весь рейтинг →</button></div><div className="challenge-card"><div className="challenge-top"><Zap size={16}/><span>ЧЕЛЛЕНДЖ ДНЯ</span></div><div className="challenge-emoji">🚽</div><h3>Не забудь записать!</h3><p>История не запишет себя сама. Каждый подвиг важен.</p><div className="challenge-progress"><span/></div><small>ТВОЙ СЛЕД ИМЕЕТ ЗНАЧЕНИЕ</small></div><div className="disclaimer">Это шуточный проект. Не публикуй личные или медицинские данные.</div></aside>
    </div>
    {toast&&<button className="toast" onClick={()=>setToast('')}>{toast}<span> ×</span></button>}
  </div>
}