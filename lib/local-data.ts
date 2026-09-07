export const KEYS = { readings: 'yunjian.readings.v1', profiles: 'yunjian.profiles.v1', chats: 'yunjian.chats.v1', settings: 'yunjian.settings.v1' };
export type Profile = { id:string; name:string; birthday:string; time:string; note:string };
export type ChatMessage = { role:'user'|'assistant'; content:string };
export type Chat = { id:string; title:string; updatedAt:string; messages:ChatMessage[] };
export type Settings = { nickname:string };
export type Backup = { version:1; exportedAt:string; readings:unknown[]; profiles:Profile[]; chats:Chat[]; settings:Settings };
const object = (v:unknown): v is Record<string,unknown> => !!v && typeof v==='object' && !Array.isArray(v);
const string = (v:unknown, max:number): v is string => typeof v==='string' && v.length<=max;
export function validBirthday(date:string,time:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const [y,m,d]=date.split('-').map(Number); const parsed=new Date(Date.UTC(y,m-1,d));
  return y>=1900 && y<=2100 && parsed.getUTCFullYear()===y && parsed.getUTCMonth()===m-1 && parsed.getUTCDate()===d && Date.parse(date+'T'+time+':00+08:00')<=Date.now();
}
export function isProfile(v:unknown): v is Profile {return object(v)&&string(v.id,100)&&!!v.id&&string(v.name,30)&&!!v.name.trim()&&string(v.birthday,10)&&string(v.time,5)&&validBirthday(v.birthday,v.time)&&string(v.note,300);}
export function isMessage(v:unknown): v is ChatMessage {return object(v)&&(v.role==='user'||v.role==='assistant')&&string(v.content,v.role==='user'?1000:12000)&&!!v.content.trim();}
export function isChat(v:unknown): v is Chat {return object(v)&&string(v.id,100)&&!!v.id&&string(v.title,50)&&string(v.updatedAt,40)&&Number.isFinite(Date.parse(v.updatedAt))&&Array.isArray(v.messages)&&v.messages.length<=100&&v.messages.every(isMessage)&&v.messages.every((m,i)=>m.role===(i%2===0?'user':'assistant'));}
export function isReading(v:unknown) {return object(v)&&string(v.id,100)&&!!v.id&&string(v.question,50)&&Array.isArray(v.numbers)&&v.numbers.length===3&&v.numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=100)&&string(v.createdAt,40)&&Number.isFinite(Date.parse(v.createdAt))&&(v.method===undefined||v.method==='three-number-v1')&&(v.interpretation===undefined||(object(v.interpretation)&&string(v.interpretation.text,12000)&&string(v.interpretation.model,200)&&string(v.interpretation.generatedAt,40)));}
function unique(list:{id:string}[]) {return new Set(list.map(v=>v.id)).size===list.length;}
export function validateBackup(v:unknown): asserts v is Backup {
 if(!object(v)||v.version!==1||!Array.isArray(v.readings)||v.readings.length>100||!v.readings.every(isReading)||!unique(v.readings as {id:string}[])||!Array.isArray(v.profiles)||v.profiles.length>50||!v.profiles.every(isProfile)||!unique(v.profiles)||!Array.isArray(v.chats)||v.chats.length>30||!v.chats.every(isChat)||!unique(v.chats)||!object(v.settings)||!string(v.settings.nickname,30)) throw new Error('备份格式不正确、记录无效或超出数量限制，未修改现有数据。');
}
export function loadList<T>(key:string,check:(v:unknown)=>v is T):T[] {const data:unknown=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(data)||!data.every(check))throw new Error('本地数据格式异常，请先导出备份后处理。');return data;}
export function saveList(key:string,data:unknown) {localStorage.setItem(key,JSON.stringify(data));}
export function downloadFile(name:string,text:string,type='application/json') {const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function exportBackup():Backup {const data={version:1 as const,exportedAt:new Date().toISOString(),readings:JSON.parse(localStorage.getItem(KEYS.readings)||'[]'),profiles:JSON.parse(localStorage.getItem(KEYS.profiles)||'[]'),chats:JSON.parse(localStorage.getItem(KEYS.chats)||'[]'),settings:JSON.parse(localStorage.getItem(KEYS.settings)||'{"nickname":""}')};validateBackup(data);return data;}
export function restoreBackup(data:Backup) {
 validateBackup(data); const before=Object.values(KEYS).map(k=>[k,localStorage.getItem(k)] as const);
 try {for(const k of ['readings','profiles','chats','settings'] as const)saveList(KEYS[k],data[k]);sessionStorage.removeItem('yunjian.current');}
 catch {let restored=true;for(const [key,value] of before){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{restored=false;}}throw new Error(restored?'恢复失败（可能空间不足），原数据已保留。':'恢复中断，请保留备份文件并检查浏览器存储权限。');}
}
