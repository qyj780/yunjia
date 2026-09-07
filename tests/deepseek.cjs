const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
function load(relative){const filename=path.resolve(__dirname,'..',relative);const mod=new Module(filename,module);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));const normal=mod.require.bind(mod);mod.require=id=>id.startsWith('@/')?load(id.slice(2)+'.ts'):normal(id);mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);return mod.exports;}
const {NextRequest}=require('next/server');const interpret=load('app/api/interpret/route.ts').POST;const chat=load('app/api/chat/route.ts').POST;
let sequence=0;const request=(body)=>new NextRequest('https://site.example/api/test',{method:'POST',headers:{'Content-Type':'application/json','x-forwarded-for':String(++sequence)},body:JSON.stringify(body)});
const payload={question:'如何开始新计划？',numbers:[5,7,1],method:'three-number-v1'};
(async()=>{
 process.env.LLM_API_KEY='test-only';process.env.LLM_BASE_URL='https://api.deepseek.com';
 for(const model of ['deepseek-v4-flash','deepseek-v4-pro']){
  process.env.LLM_MODEL=model;
  global.fetch=async(url,opts)=>{assert.equal(String(url),'https://api.deepseek.com/chat/completions');const body=JSON.parse(opts.body);assert.deepEqual(body.thinking,{type:'disabled'});assert.equal(body.max_tokens,4096);return Response.json({choices:[{message:{content:'完整解读'},finish_reason:'stop'}]});};
  assert.equal((await interpret(request(payload))).status,200);assert.equal((await chat(request({messages:[{role:'user',content:'你好'}]}))).status,200);
 }
 global.fetch=async()=>Response.json({choices:[{message:{content:null,reasoning_content:'private reasoning'},finish_reason:'length'}]});
 const truncated=await interpret(request(payload));assert.equal(truncated.status,502);const truncatedText=await truncated.text();assert(truncatedText.includes('长度上限'));assert(!truncatedText.includes('private reasoning'));
 global.fetch=async()=>Response.json({choices:[{message:{content:'',reasoning_content:'private reasoning'},finish_reason:'stop'}]});
 const reasoningOnly=await interpret(request(payload));assert.equal(reasoningOnly.status,502);const reasonText=await reasoningOnly.text();assert(reasonText.includes('没有最终解读'));assert(!reasonText.includes('private reasoning'));
 process.env.LLM_BASE_URL='https://other.example/v1';process.env.LLM_MODEL='other-model';global.fetch=async(url,opts)=>{assert.equal(JSON.parse(opts.body).thinking,undefined);return Response.json({choices:[{message:{content:'回答'},finish_reason:'stop'}]});};assert.equal((await interpret(request(payload))).status,200);assert.equal((await chat(request({messages:[{role:'user',content:'你好'}]}))).status,200);
 console.log('PASS: DeepSeek V4 flash/pro request parameters on both endpoints, truncation and reasoning-only errors, other-provider compatibility. No live API call.');
})().catch(e=>{console.error(e);process.exit(1)});
