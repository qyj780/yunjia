'use client';

import Link from 'next/link';
import ReadingResult, { type ActualReading } from './reading-result';
import { METHOD } from '@/lib/divination';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, ChevronRight, Compass, History, Home, Leaf, Menu, MessageCircle, ShieldCheck, Sparkles, Sun, Trash2, UserRound, X } from 'lucide-react';

type Reading = ActualReading;
const STORAGE = 'yunjian.readings.v1';
function validReading(v: unknown): v is Reading { if (!v || typeof v !== 'object') return false; const r = v as Reading; return typeof r.id === 'string' && typeof r.question === 'string' && r.question.length <= 50 && Array.isArray(r.numbers) && r.numbers.length === 3 && r.numbers.every(n => Number.isInteger(n) && n >= 1 && n <= 100) && typeof r.createdAt === 'string' && Number.isFinite(Date.parse(r.createdAt)); }
function readHistory(): Reading[] { const value: unknown = JSON.parse(localStorage.getItem(STORAGE) || '[]'); if (!Array.isArray(value)) throw new Error('Invalid history'); return value.filter(validReading).slice(0, 100); }
const questions = ['我们还有机会重逢吗？', '现在适合换一份工作吗？', '这个合作值得继续推进吗？', '如何找到适合自己的方向？'];
const cards = [
  { title: '梅花起卦', en: 'PLUM BLOSSOM', desc: '心有所问，卦有所应', type: 'plum', action: '起一卦', icon: '✿' },
  { title: '六爻问事', en: 'SIX LINES', desc: '观六爻变化，探事情始末', type: 'mountain', action: '问一事', icon: '☷' },
  { title: '八字排盘', en: 'FOUR PILLARS', desc: '识自己的节奏，寻人生方向', type: 'orbit', action: '排命盘', icon: '☯' },
];
export default function Studio({ view }: { view: 'home' | 'result' | 'history' }) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [numbers, setNumbers] = useState(['', '', '']);
  const [records, setRecords] = useState<Reading[]>([]);
  const [current, setCurrent] = useState<Reading | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [date, setDate] = useState('');
  useEffect(() => {
    setDate(new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }));
    let list: Reading[] = [];
    try { list = readHistory(); setRecords(list); } catch { setError('无法读取本地历史记录。请检查浏览器存储权限；请允许本地存储后重试。'); }
    if (view === 'result') {
      const id = new URLSearchParams(window.location.search).get('id');
      const saved = list.find(r => r.id === id);
      if (saved) setCurrent(saved);
      else { try { const draft: unknown = JSON.parse(sessionStorage.getItem('yunjian.current') || 'null'); if (validReading(draft) && draft.id === id) setCurrent(draft); } catch { /* Empty result state is shown. */ } }
    }
    setReady(true);
  }, [view]);
  useEffect(() => { if (!modal) return; const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(''); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [modal]);
  function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const ns = numbers.map(Number);
    if (!question.trim()) { setError('先写下你想问的事。'); return; }
    if (question.length > 50 || ns.some(n => !Number.isInteger(n) || n < 1 || n > 100)) { setError('请输入 50 字以内的问题，以及三个 1～100 的整数。'); return; }
    const item: Reading = { id: crypto.randomUUID(), question: question.trim(), numbers: ns, method: METHOD, createdAt: new Date().toISOString() };
    let persisted = false;
    try { localStorage.setItem(STORAGE, JSON.stringify([item, ...readHistory()].slice(0, 100))); persisted = true; } catch { /* Session fallback keeps the result usable. */ }
    try { sessionStorage.setItem('yunjian.current', JSON.stringify(item)); persisted = true; } catch { /* Surface failure if both stores are unavailable. */ }
    if (!persisted) { setError('浏览器禁止保存数据，请允许此网站使用本地存储后重试。'); return; }
    router.push('/result?id=' + item.id);
  }
  function remove(id: string) { const next = records.filter(r => r.id !== id); try { localStorage.setItem(STORAGE, JSON.stringify(next)); setRecords(next); try { const draft = JSON.parse(sessionStorage.getItem('yunjian.current') || 'null'); if (draft?.id === id) sessionStorage.removeItem('yunjian.current'); } catch {} } catch { setError('删除失败，请检查浏览器存储权限。'); } }
  const coming = (name: string) => setModal(name);
  return <div className="app-shell">
    <aside className={'sidebar ' + (mobileNav ? 'expanded' : '')}>
      <Link className="brand" href="/"><span className="brand-mark">云</span><span><b>云 笺</b><small>一笺心事 · 一点启发</small></span></Link>
      <button className="mobile-toggle" aria-label="展开导航" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Menu size={22}/></button>
      <div className="sidebar-content">
        <div className="welcome"><span>见字如晤，欢迎来到云笺</span><strong>把心事，慢慢说。</strong><button onClick={() => coming('登录 / 注册')}>登录 / 注册 <ArrowRight size={14}/></button></div>
        <nav aria-label="主导航">
          <Link className={view === 'home' ? 'active' : ''} href="/"><Home size={18}/>首页<span>01</span></Link>
          <Link className={view === 'history' ? 'active' : ''} href="/history"><History size={18}/>历史提问<span>02</span></Link>
          <button onClick={() => coming('心事聊天')}><MessageCircle size={18}/>心事聊天<span>03</span></button>
          <button onClick={() => coming('八字档案')}><BookOpen size={18}/>八字档案<span>04</span></button>
          <button onClick={() => coming('个人中心')}><UserRound size={18}/>我的云笺<span>05</span></button>
        </nav>
        <div className="sidebar-poem"><span>静 心 · 观 己</span><p>且听风吟<br/>静待花开</p><img src="/landscape.svg" alt=""/></div>
        <div className="sidebar-foot"><i/> 三数起卦版 <span>V.02</span></div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span><Leaf size={14}/> 每日一笺 <i/> 心有清欢，岁月从容。</span><button onClick={() => coming('消息中心')} aria-label="消息中心"><MessageCircle size={17}/><i/></button></header>
      <div className="page-grid">
        <main>
          <div className="page-heading"><div><span className="eyebrow">YUNJIAN · A MOMENT FOR YOURSELF</span><h1>{view === 'home' ? '问心有方，前路有光。' : view === 'history' ? '落在笺上的心事。' : '静观一卦，回望本心。'}</h1></div><span className="seal">问心</span></div>
          {error && <p className="error" role="alert">{error}</p>}
          {view === 'home' && <>
            <div className="assurances"><span><Sparkles/><b>传统智慧<small>以古意，启新思</small></b></span><span><ShieldCheck/><b>本地记录<small>历史留在此处</small></b></span><span><BookOpen/><b>清晰解读<small>让答案更易懂</small></b></span></div>
            <div className="question-grid">
              <section className="panel ask-panel" id="ask"><div className="section-top"><h2><span>梅花易数</span> · 写下此刻的心事</h2><span className="tag">三数起卦</span></div><p className="muted">生活的疑问，不妨换个角度看看。</p><form onSubmit={submit}>
                <label className="sr-only" htmlFor="question">你想问的问题</label><div className="textarea-wrap"><textarea id="question" placeholder="关于感情、事业，或一个迟迟未定的选择……" maxLength={50} value={question} onChange={e => setQuestion(e.target.value)}/><span>{question.length} / 50</span></div>
                <div className="number-label"><span>凭直觉，写下三个数字</span><small>1 – 100 之间的整数</small></div><div className="numbers">{numbers.map((n, i) => <input key={i} aria-label={`第${i + 1}个数字`} type="number" inputMode="numeric" min="1" max="100" step="1" required placeholder={['一', '二', '三'][i]} value={n} onChange={e => setNumbers(numbers.map((v, j) => j === i ? e.target.value : v))}/>)}</div>
                <button className="primary w-full" type="submit"><Compass size={18}/> 梅花起卦 <ArrowRight size={16}/></button><p className="form-note">此刻起念，便是一种与自己的对话</p>
              </form></section>
              <section className="panel popular"><span className="eyebrow">A LITTLE INSPIRATION</span><h2>大家都在问</h2><p className="muted">也许，这里有你的心事</p><div>{questions.map((q, i) => <button key={q} onClick={() => {setQuestion(q); document.getElementById('question')?.focus();}}><span>0{i + 1}</span>{q}<ChevronRight size={13}/></button>)}</div><div className="popular-foot"><span>万千疑问，从一念开始</span><Leaf size={26}/></div></section>
            </div>
            <div className="section-heading"><h2><Compass size={19}/> 术数工具</h2><span>以传统智慧，照见生活</span></div>
            <div className="tool-grid">{cards.map((c, i) => <button className={'tool-card ' + c.type} key={c.title} onClick={() => i === 0 ? document.getElementById('question')?.focus() : coming(c.title)}><span className="tool-en">{c.en}</span><h3><span>{c.icon}</span>{c.title}</h3><p>{c.desc}</p><span className="pill">{c.action} <ArrowRight size={13}/></span>{c.type === 'plum' ? <img src="/plum.svg" alt=""/> : c.type === 'mountain' ? <img src="/landscape.svg" alt=""/> : <span className="orbit-art">☯</span>}</button>)}</div>
            <div className="section-heading"><h2><Sparkles size={19}/> 灵感与探索</h2><span>多一点好奇，多一种可能</span></div>
            <div className="tool-grid playful">{[{title:'正缘画像',desc:'描绘心中期待的相遇',type:'love',symbol:'缘'}, {title:'人生 K 线',desc:'换个视角，看人生起伏',type:'chart',symbol:'↗'}, {title:'能量头像',desc:'寻找与你共鸣的色彩',type:'avatar',symbol:'◉'}].map(c => <button className={'tool-card '+c.type} key={c.title} onClick={() => coming(c.title)}><span className="tiny-tag">即将上线</span><h3>{c.title}</h3><p>{c.desc}</p><span className="text-link">去探索 <ArrowRight size={13}/></span><span className="play-art">{c.symbol}</span></button>)}</div>
            <div className="bottom-note"><span>一笺寄心，万事可期。</span><small>慢一点，答案也许就在心里。</small><Leaf/></div>
          </>}
          {view === 'result' && <section className="panel result-panel">{!ready ? <p>正在展开云笺……</p> : current ? <>{current.method === METHOD ? <ReadingResult key={current.id} reading={current}/> : <><span className="tag">演示数据 · 非真实排盘</span><h2>{current.question}</h2><p className="muted">{new Date(current.createdAt).toLocaleString('zh-CN')} · 数字 {current.numbers.join(' / ')}</p><div className="hexagram"><div aria-label="演示卦象：风山渐">{[true,true,false,true,false,false].map((solid,i)=><div className={'hex-line '+(solid?'solid':'')} key={i}><i/><i/></div>)}</div><div><span className="eyebrow">DEMO READING</span><h3>风山渐</h3><p>循序而进，静待其成</p></div></div><div className="reading-copy"><h3>一笺解读</h3><p>这份演示以“渐进”为主题：面对悬而未决的事情，可以先把目光放回自己能够掌握的一小步。给变化留一点时间，也给自己一些耐心。</p><h3>此刻，可以做的三件事</h3><ol><li>写下你真正期待的结果，区分事实与猜测。</li><li>选择一个今天就能完成的小行动。</li><li>留一个回顾的时间，再决定下一步。</li></ol><p className="demo-note">本页为固定示例，所有输入均展示相同卦象与文案；数字仅用于演示提问流程，未参与真实起卦或 AI 推断。内容用于文化体验与自我思考。</p>{!records.some(r=>r.id===current.id) && <p className="demo-note">此结果仅保存在当前会话，未能写入长期历史记录。</p>}</div></>}<div className="result-actions"><Link className="primary" href="/">重新提问 <ArrowRight size={16}/></Link><Link className="secondary" href="/history">查看历史</Link></div></> : <div className="empty"><BookOpen size={38}/><h2>这张云笺还未写下</h2><p>记录可能已删除，或来自其他浏览器。</p><Link className="primary" href="/">开始提问</Link></div>}</section>}
          {view === 'history' && <section className="panel history-panel"><div className="section-top"><h2>历史提问</h2><span className="tag">{records.length} 张云笺</span></div><p className="muted">仅保存在当前浏览器，最多保留 100 条；清除浏览器数据后将无法恢复。</p>{!ready ? <p>正在读取……</p> : records.length ? records.map(r => <article className="history-row" key={r.id}><Link href={'/result?id='+r.id}><span className="eyebrow">{new Date(r.createdAt).toLocaleString('zh-CN')} · {r.method === METHOD ? '三数起卦' : '旧版演示'}</span><h3>{r.question}</h3><small>起念数字 · {r.numbers.join(' / ')}</small></Link><button className="delete-button" aria-label={'删除：'+r.question} onClick={() => remove(r.id)}><Trash2 size={17}/></button></article>) : <div className="empty"><History size={36}/><h3>这里，等着你的第一张云笺</h3><p>写下问题，留住此刻的思绪。</p><Link href="/" className="primary">去提问 <ArrowRight size={16}/></Link></div>}</section>}
          <footer>云笺 YUNJIAN <span>·</span> 传统文化的当代表达 <span>·</span> 文化体验，仅供自我探索</footer>
        </main>
        <aside className="right-column"><section className="panel daily"><div className="section-top"><h2><Sun size={23}/> 今日指引</h2><span className="tag">每日一笺</span></div><strong className="date">{date || '今日'}</strong><span className="muted">放慢脚步，与自己相处</span><div className="daily-divider"/><p><span className="yi">宜</span> 静心阅读 · 整理思绪 · 向前一步</p><p><span className="ji">缓</span> 冲动决定 · 过度内耗 · 急于求成</p><blockquote>“ 心有山海，静而不争。 ”</blockquote><small>生活灵感 · 非历法运势推算</small></section><section className="membership"><span className="eyebrow">A LETTER TO YOURSELF</span><h2>留一方静处<br/>听内心回响</h2><p>把纷繁交给风<br/>把答案留给时间</p><div className="gold-orbit"><span>笺</span></div><button onClick={() => coming('云笺会员')}>探索更多可能 <ArrowRight size={16}/></button><span className="membership-note">会员功能 · 即将上线</span></section><div className="side-caption"><Leaf size={15}/> 万物有时，愿你从容。</div></aside>
      </div>
    </div>
    {modal && <div className="modal-backdrop" onClick={() => setModal('')}><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal panel" onClick={e => e.stopPropagation()}><button autoFocus className="modal-close" aria-label="关闭" onClick={() => setModal('')} onKeyDown={e => {if (e.key === 'Tab') { e.preventDefault(); (e.currentTarget.parentElement?.querySelector('.primary') as HTMLElement)?.focus(); }}}><X size={20}/></button><span className="seal">云笺</span><h2 id="modal-title">{modal}</h2><p>即将上线</p><span className="muted">正在细细打磨，期待与你相见。<br/>现在可以先体验梅花起卦。</span><button className="primary" onClick={() => setModal('')} onKeyDown={e => {if(e.key === 'Tab'){e.preventDefault();(e.currentTarget.parentElement?.querySelector('.modal-close') as HTMLElement)?.focus();}}}>知道了</button></section></div>}
  </div>;
}
