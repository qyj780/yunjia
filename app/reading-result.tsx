'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { divine, METHOD } from '@/lib/divination';
export type Interpretation = { text: string; model: string; generatedAt: string };
export type ActualReading = { id: string; question: string; numbers: number[]; createdAt: string; method?: typeof METHOD; interpretation?: Interpretation };
function validAI(v: unknown): v is Interpretation { if (!v || typeof v !== 'object') return false; const a = v as Interpretation; return typeof a.text === 'string' && a.text.length <= 12000 && typeof a.model === 'string' && typeof a.generatedAt === 'string'; }
export default function ReadingResult({ reading }: { reading: ActualReading }) {
  const chart = divine(reading.numbers);
  const [interpretation, setInterpretation] = useState<Interpretation | null>(validAI(reading.interpretation) ? reading.interpretation : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveWarning, setSaveWarning] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function generate() {
    if (controller.current) return;
    const abort = new AbortController(); controller.current = abort;
    setBusy(true); setError(''); setSaveWarning('');
    try {
      const response = await fetch('/api/interpret', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ question: reading.question, numbers: reading.numbers, method: METHOD }), signal: abort.signal });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : '解读暂时不可用，请重试。');
      if (!validAI(data)) throw new Error('解读格式异常，请重试。');
      setInterpretation(data);
      let saved = false;
      try {
        const records: unknown = JSON.parse(localStorage.getItem('yunjian.readings.v1') || '[]');
        if (Array.isArray(records) && records.some(r => r?.id === reading.id)) {
          localStorage.setItem('yunjian.readings.v1', JSON.stringify(records.map(r => r?.id === reading.id ? {...r, interpretation: data} : r)));
          saved = true;
        }
      } catch { /* Show warning below, preserve visible result. */ }
      try { sessionStorage.setItem('yunjian.current', JSON.stringify({...reading, interpretation:data})); } catch { /* Not durable. */ }
      if (!saved) setSaveWarning('解读已生成，但未保存到长期历史。请在离开前复制所需内容。');
    } catch (e) { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : '解读失败，请重试。'); }
    finally { controller.current = null; setBusy(false); }
  }
  return <>
    <span className="tag">三数起卦 · 规则计算</span><h2 className="reading-question">{reading.question}</h2>
    <p className="muted">{new Date(reading.createdAt).toLocaleString('zh-CN')} · 数字 {reading.numbers.join(' / ')}</p>
    <div className="gua-grid">{[{label:'本卦',gua:chart.original},{label:'互卦',gua:chart.mutual},{label:'变卦',gua:chart.changed}].map(({label,gua}) => <section className="gua-card" key={label}><span className="eyebrow">{label}</span><div className="gua-lines" aria-label={gua.name}>{[...gua.lines].reverse().map((line,i) => <div key={i} className={'hex-line '+(line ? 'solid ' : '')+(label==='本卦' && 6-i===chart.moving ? 'moving' : '')}><i/><i/>{label==='本卦' && 6-i===chart.moving && <span aria-label={`第${chart.moving}爻动`}>·</span>}</div>)}</div><h3>{gua.name}</h3><small>{gua.upper}上 · {gua.lower}下</small></section>)}</div>
    <p className="gua-meta">第 {chart.moving} 爻动（自下而上） · 体卦 {chart.body} · 用卦 {chart.use}</p>
    <details className="method-note"><summary>查看本次起卦规则</summary><p>{chart.rule} 八卦顺序为乾1、兑2、离3、震4、巽5、坎6、艮7、坤8。互卦以下卦取本卦第2、3、4爻，上卦取第3、4、5爻；变卦翻转动爻。动爻所在的经卦为用，另一经卦为体。本产品固定采用此法，不混入时辰。</p></details>
    <div className="reading-copy ai-section"><h3><Sparkles size={19}/> 一笺 AI 解读</h3>
      {interpretation ? <><p className="ai-text">{interpretation.text}</p><p className="muted">由 {interpretation.model} 生成 · 已保留本次解读，刷新页面不会重复调用</p></> : <><p>让大模型结合你的问题，解读卦象中的变化与启发。</p><p className="muted">点击后，问题和卦象将发送至本站配置的模型服务。请勿填写姓名、联系方式等敏感信息。</p></>}
      {error && <div className="error" role="alert">{error}</div>}
      {saveWarning && <div className="error" role="status">{saveWarning}</div>}
      {!interpretation && <button className="primary" type="button" disabled={busy} onClick={generate}><Sparkles size={17}/>{busy ? '正在解读，请稍候…' : error ? '重试 AI 解读' : '生成 AI 解读'}</button>}
      {busy && <p className="muted" role="status">正在整理卦象与问题，通常需要数十秒。</p>}
      <p className="demo-note">卦象由程序按上述规则计算；AI 解读是传统文化的象征性阐释，不能证实未来事件或他人的真实想法，仅供文化体验与自我思考。</p>
    </div>
  </>;
}
