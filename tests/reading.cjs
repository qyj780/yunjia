const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
function load(relative) {
 const filename = path.resolve(__dirname, '..', relative);
 let source = fs.readFileSync(filename, 'utf8').replace("'@/lib/divination'", JSON.stringify(path.resolve(__dirname,'../lib/divination.ts')));
 const m = new Module(filename, module); m.filename = filename; m.paths = Module._nodeModulePaths(path.dirname(filename));
 m._compile(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText, filename);
 return m.exports;
}
const { divine, METHOD } = load('lib/divination.ts');
require.cache[path.resolve(__dirname,'../lib/divination.ts')] = {exports:{divine,METHOD,validNumbers:load('lib/divination.ts').validNumbers}};
const sample = divine([5,7,1]);
assert.equal(sample.original.name,'风山渐'); assert.equal(sample.changed.name,'风火家人'); assert.equal(sample.mutual.name,'火水未济');
assert.equal(sample.body,'巽'); assert.equal(sample.use,'艮');
assert.equal(divine([8,8,6]).original.name,'坤为地'); assert.equal(divine([8,8,6]).changed.name,'山地剥');
assert.equal(divine([1,1,1]).original.name,'乾为天'); assert.equal(divine([1,1,1]).changed.name,'天风姤');
const names = new Set();
for(let a=1;a<=8;a++) for(let b=1;b<=8;b++) for(let c=1;c<=6;c++) {
 const r=divine([a,b,c]); names.add(r.original.name);
 assert.equal(r.original.lines.filter((v,i)=>v!==r.changed.lines[i]).length,1);
 assert.notEqual(r.original.lines[c-1],r.changed.lines[c-1]);
 assert.equal(r.mutual.lines.join(''),[r.original.lines[1],r.original.lines[2],r.original.lines[3],r.original.lines[2],r.original.lines[3],r.original.lines[4]].join(''));
}
assert.equal(names.size,64);
for(const n of [[0,1,1],[1.5,1,1],[101,1,1],[1,1],['1',1,1]]) assert.throws(()=>divine(n));
const {NextRequest}=require('next/server');
const {POST}=load('app/api/interpret/route.ts');
let sequence=0;
function request(body={question:'现在适合学习新技能吗？',numbers:[5,7,1],method:METHOD}, extra={}) {return new NextRequest('https://test.example/api/interpret',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':String(++sequence),...extra},body:JSON.stringify(body)})}
(async()=>{
 delete process.env.LLM_API_KEY; delete process.env.LLM_BASE_URL; delete process.env.LLM_MODEL;
 assert.equal((await POST(request())).status,503);
 process.env.LLM_API_KEY='test-key-not-real'; process.env.LLM_BASE_URL='https://model.example/v1';process.env.LLM_MODEL='test-model';
 assert.equal((await POST(request({question:'',numbers:[1,1,1],method:METHOD}))).status,400);
 assert.equal((await POST(request(undefined,{origin:'https://other.example'}))).status,403);
 assert.equal((await POST(request({padding:'a'.repeat(3000)}))).status,413);
 let calls=0;
 global.fetch=async(url,options)=>{calls++;assert.equal(String(url),'https://model.example/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-key-not-real');const sent=JSON.parse(options.body);assert.equal(JSON.parse(sent.messages[1].content).divination.original.name,'风山渐');return Response.json({choices:[{message:{content:'测试解读'},finish_reason:'stop'}]})};
 const success=await POST(request());assert.equal(success.status,200);assert.equal((await success.json()).text,'测试解读');assert.equal(calls,1);
 global.fetch=async()=>new Response('secret upstream details',{status:401}); const auth=await POST(request());assert.equal(auth.status,502);assert(!(await auth.text()).includes('secret'));
 global.fetch=async()=>{throw new DOMException('timeout','TimeoutError')};assert.equal((await POST(request())).status,502);
 global.fetch=async()=>Response.json({choices:[{message:{content:'partial'},finish_reason:'length'}]});assert.equal((await POST(request())).status,502);
 global.fetch=async()=>Response.json({choices:[{message:{content:''},finish_reason:'stop'}]});assert.equal((await POST(request())).status,502);
 global.fetch=async()=>Response.json({choices:[{message:{content:'OK'},finish_reason:'stop'}]});
 for(let i=0;i<5;i++) assert.equal((await POST(request(undefined,{'x-forwarded-for':'rate-test'}))).status,200);
 assert.equal((await POST(request(undefined,{'x-forwarded-for':'rate-test'}))).status,429);
 console.log('PASS: 384 hexagram combinations, 64 unique names, fixtures, bounds, API validation, server payload, auth, timeout, truncated/empty output, throttling. No live model called.');
})().catch(e=>{console.error(e);process.exit(1)});
