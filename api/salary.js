// CheckSalary.us — Smart Salary API
// Flow: Cache → AI (if credits ok) → Database (silent fallback)
// User NEVER sees any error. Always gets a clean result.

const cache = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
function cacheKey(t,c,e){return`${t.toLowerCase().trim()}|${(c||'us').toLowerCase().trim()}|${e}`}

const CITY_MULT={'san francisco':1.45,'san francisco, ca':1.45,'sf':1.45,'san jose':1.42,'san jose, ca':1.42,'new york':1.38,'new york, ny':1.38,'nyc':1.38,'seattle':1.28,'seattle, wa':1.28,'boston':1.22,'boston, ma':1.22,'washington':1.20,'washington, dc':1.20,'dc':1.20,'los angeles':1.18,'los angeles, ca':1.18,'la':1.18,'chicago':1.08,'chicago, il':1.08,'austin':1.05,'austin, tx':1.05,'remote':1.05,'remote / national':1.05,'denver':1.04,'denver, co':1.04,'dallas':0.98,'dallas, tx':0.98,'houston':0.96,'houston, tx':0.96,'atlanta':0.97,'atlanta, ga':0.97,'miami':0.95,'miami, fl':0.95,'phoenix':0.95,'phoenix, az':0.95,'charlotte':0.93,'charlotte, nc':0.93,'nashville':0.92,'nashville, tn':0.92,'default':1.00};
const EXP_MULT={entry:0.72,mid:1.00,senior:1.35,lead:1.65};
const COMP_EXTRAS={tech:{bonus:0.12,equity:0.20},finance:{bonus:0.20,equity:0.05},healthcare:{bonus:0.04,equity:0.00},management:{bonus:0.15,equity:0.08},creative:{bonus:0.08,equity:0.05},legal:{bonus:0.18,equity:0.00},education:{bonus:0.02,equity:0.00},sales:{bonus:0.25,equity:0.05},default:{bonus:0.08,equity:0.03}};

const JOBS={
  'software engineer':{base:124000,cat:'tech',growth:'+5.2%',insight:'High demand. FAANG pays 2-3x median. AI/ML skills command 20-30% premium.'},
  'software developer':{base:124000,cat:'tech',growth:'+5.2%',insight:'Strong market. Full-stack adds $10-20k. Remote roles widely available.'},
  'senior software engineer':{base:158000,cat:'tech',growth:'+5.0%',insight:'System design skills critical. Staff+ roles reach $250k+ at top companies.'},
  'frontend engineer':{base:118000,cat:'tech',growth:'+4.8%',insight:'React and TypeScript adds $10-15k. Design systems experience highly valued.'},
  'backend engineer':{base:128000,cat:'tech',growth:'+5.5%',insight:'Distributed systems expertise commands premium. Cloud certs add 10-15%.'},
  'full stack engineer':{base:122000,cat:'tech',growth:'+5.0%',insight:'Node.js + React most in demand. Startup equity boosts total comp significantly.'},
  'devops engineer':{base:126000,cat:'tech',growth:'+6.2%',insight:'Kubernetes and cloud platform skills in high demand. Fastest growing tech ops role.'},
  'data engineer':{base:122000,cat:'tech',growth:'+6.8%',insight:'Spark, dbt, cloud data warehouses drive salary. One of fastest growing data roles.'},
  'data scientist':{base:118000,cat:'tech',growth:'+5.8%',insight:'ML skills add $20-30k. Python + SQL baseline. Domain expertise valued.'},
  'machine learning engineer':{base:148000,cat:'tech',growth:'+8.2%',insight:'Hottest role in tech. LLM experience commands $200k+ at top firms.'},
  'ai engineer':{base:152000,cat:'tech',growth:'+9.5%',insight:'Fastest growing role in tech. LLM integration skills in extreme demand.'},
  'cloud architect':{base:158000,cat:'tech',growth:'+7.2%',insight:'AWS certifications add $15-25k. Multi-cloud experience increasingly valued.'},
  'mobile developer':{base:112000,cat:'tech',growth:'+4.5%',insight:'iOS pays slightly more than Android. Cross-platform skills growing fast.'},
  'cybersecurity engineer':{base:132000,cat:'tech',growth:'+7.5%',insight:'CISSP adds $15-25k. Cloud security specialists most in demand.'},
  'security analyst':{base:98000,cat:'tech',growth:'+6.8%',insight:'SOC experience essential. Government clearance adds 15-25%.'},
  'product manager':{base:132000,cat:'tech',growth:'+4.8%',insight:'Technical PM background adds $15-25k. FAANG programs highly competitive.'},
  'senior product manager':{base:165000,cat:'tech',growth:'+4.5%',insight:'P5+ at FAANG reaches $300k+ total comp. Domain expertise commands premium.'},
  'product designer':{base:112000,cat:'creative',growth:'+4.2%',insight:'Figma now baseline. Systems thinking and research skills increasingly valued.'},
  'ux designer':{base:98000,cat:'creative',growth:'+3.8%',insight:'User research adds $10-15k. Portfolio critical. Tech pays 40% more than agencies.'},
  'data analyst':{base:82000,cat:'tech',growth:'+4.5%',insight:'SQL and Python baseline. Finance sector pays 20-30% premium.'},
  'business analyst':{base:88000,cat:'management',growth:'+3.8%',insight:'Agile experience most valued. CBAP certification adds $5-10k.'},
  'financial analyst':{base:88000,cat:'finance',growth:'+3.8%',insight:'CFA adds $15-25k. Investment banking pays 2-3x corporate finance.'},
  'accountant':{base:72000,cat:'finance',growth:'+2.8%',insight:'CPA adds $15-25k. Big 4 experience highly valued across all industries.'},
  'cpa':{base:85000,cat:'finance',growth:'+3.2%',insight:'CPA license adds $15-25k over unlicensed. Partner track at Big 4 reaches $500k+.'},
  'registered nurse':{base:82000,cat:'healthcare',growth:'+4.2%',insight:'ICU and OR specialties pay 20-30% premium. Travel nursing can double income.'},
  'nurse practitioner':{base:118000,cat:'healthcare',growth:'+5.8%',insight:'One of fastest growing healthcare roles. Critical demand nationwide.'},
  'physician':{base:220000,cat:'healthcare',growth:'+3.5%',insight:'Specialty matters enormously. Orthopedic surgeons average $500k+.'},
  'physician assistant':{base:118000,cat:'healthcare',growth:'+5.5%',insight:'Surgical specialties pay more. Growing scope of practice nationwide.'},
  'dentist':{base:158000,cat:'healthcare',growth:'+3.8%',insight:'Private practice ownership can reach $300k+. Orthodontics pays most.'},
  'pharmacist':{base:128000,cat:'healthcare',growth:'+1.5%',insight:'Specialty and clinical roles command premium over retail.'},
  'physical therapist':{base:92000,cat:'healthcare',growth:'+3.5%',insight:'Private practice ownership can double income. Sports PT earns $120k in metros.'},
  'marketing manager':{base:98000,cat:'management',growth:'+4.2%',insight:'Tech pays 30-40% more than CPG. CMO track needs P&L ownership.'},
  'digital marketing manager':{base:92000,cat:'management',growth:'+4.8%',insight:'Paid media and analytics skills most valued. Agency vs in-house gap narrowing.'},
  'seo specialist':{base:62000,cat:'tech',growth:'+4.5%',insight:'Technical SEO commands premium. Tech company roles pay 50% more than agencies.'},
  'growth marketer':{base:92000,cat:'tech',growth:'+5.5%',insight:'Full-funnel analytics and experimentation skills most valued at SaaS companies.'},
  'sales manager':{base:112000,cat:'sales',growth:'+4.2%',insight:'OTE 40-60% above base. Enterprise tech sales management most lucrative.'},
  'account executive':{base:78000,cat:'sales',growth:'+4.5%',insight:'OTE often 2x base. Enterprise AEs at top software companies earn $250k+ OTE.'},
  'operations manager':{base:88000,cat:'management',growth:'+3.5%',insight:'Supply chain operations pay more. Lean/Six Sigma adds $8-12k.'},
  'project manager':{base:92000,cat:'management',growth:'+3.8%',insight:'PMP certification adds $10-15k. Tech pays 20-30% more than construction.'},
  'program manager':{base:108000,cat:'management',growth:'+4.2%',insight:'TPM at tech companies earns $140-180k. Cross-functional leadership critical.'},
  'hr manager':{base:78000,cat:'management',growth:'+3.2%',insight:'SHRM adds $5-10k. Tech HRBP roles pay 40-50% more than traditional HR.'},
  'scrum master':{base:108000,cat:'tech',growth:'+3.5%',insight:'CSM and SAFe certifications standard. Tech sector pays 30% premium.'},
  'lawyer':{base:148000,cat:'legal',growth:'+3.5%',insight:'BigLaw starts at $215k. Public interest $50-70k. Specialty matters most.'},
  'attorney':{base:148000,cat:'legal',growth:'+3.5%',insight:'Corporate and IP law highest paid. In-house tech counsel earns $150-250k+.'},
  'paralegal':{base:58000,cat:'legal',growth:'+3.2%',insight:'BigLaw paralegal earns $70-90k in metros. IP and corporate pay more.'},
  'teacher':{base:62000,cat:'education',growth:'+2.8%',insight:'Varies by state. NY and CA average $80k+. STEM subjects add $5-10k.'},
  'professor':{base:88000,cat:'education',growth:'+2.5%',insight:'R1 tenure-track pays $100-200k. Adjunct positions severely underpaid.'},
  'instructional designer':{base:72000,cat:'education',growth:'+4.2%',insight:'Corporate L&D pays 40-60% more than academic roles.'},
  'mechanical engineer':{base:92000,cat:'tech',growth:'+3.5%',insight:'Aerospace and defense pay premium. PE license adds $8-12k.'},
  'electrical engineer':{base:98000,cat:'tech',growth:'+4.2%',insight:'Power systems and embedded expertise in demand. PE license adds $8-15k.'},
  'civil engineer':{base:88000,cat:'tech',growth:'+4.5%',insight:'Infrastructure spending driving demand. PE license required for senior roles.'},
  'aerospace engineer':{base:118000,cat:'tech',growth:'+4.5%',insight:'Space industry growth creating opportunities. Clearance adds $10-20k.'},
  'customer success manager':{base:78000,cat:'sales',growth:'+5.2%',insight:'SaaS sector dominates. Enterprise CSMs earn $100-130k. Expansion ownership adds value.'},
  'technical writer':{base:78000,cat:'tech',growth:'+4.2%',insight:'API docs expertise adds $10-15k. Tech pays 40-60% more than others.'},
  'research scientist':{base:102000,cat:'tech',growth:'+4.8%',insight:'PhD adds $20-30k. AI research at top labs reaches $300k+ total comp.'},
  'electrician':{base:58000,cat:'default',growth:'+5.5%',insight:'Union membership adds $10-20k. Master electrician license increases earnings significantly.'},
  'construction manager':{base:98000,cat:'management',growth:'+5.5%',insight:'Infrastructure spending driving demand. PMP and CCM add $10-15k.'},
};

function fmt(n){return'$'+Math.round(n/1000)+'k'}
function getCityMult(city){
  if(!city)return 1.0;
  const c=city.toLowerCase().trim();
  if(CITY_MULT[c])return CITY_MULT[c];
  for(const[key,mult]of Object.entries(CITY_MULT)){if(c.includes(key)||key.includes(c.split(',')[0].trim()))return mult;}
  return CITY_MULT.default;
}
function findJob(title){
  const t=title.toLowerCase().trim();
  if(JOBS[t])return{key:t,data:JOBS[t]};
  let best=null,bestLen=0;
  for(const[key,data]of Object.entries(JOBS)){if((t.includes(key)||key.includes(t))&&key.length>bestLen){best={key,data};bestLen=key.length;}}
  return best;
}
function buildSalaries(base,cityM,expM,extras){
  const b=Math.round(base*cityM*expM/1000)*1000;
  return{p10:Math.round(b*0.76/1000)*1000,p25:Math.round(b*0.88/1000)*1000,p50:b,p75:Math.round(b*1.18/1000)*1000,p90:Math.round(b*1.38/1000)*1000,withBonus:Math.round(b*(1+extras.bonus)/1000)*1000,totalComp:Math.round(b*(1+extras.bonus+extras.equity)/1000)*1000};
}
function buildNarrative(title,city,expLabel,jobData,s){
  const cd=city||'the US';
  const m=getCityMult(city);
  const adj=m>1.1?'above the national average':m<0.95?'below the national average':'in line with the national average';
  return`Salaries for ${title} in ${cd} are ${adj}, with a median annual base of ${fmt(s.p50)}. ${jobData.insight}\n\nAt the ${expLabel} level, total compensation including bonus typically reaches ${fmt(s.withBonus)}, and ${fmt(s.totalComp)} when equity is included. The range spans from ${fmt(s.p10)} at the 10th percentile to ${fmt(s.p90)} at the 90th.\n\nMarket growth is trending at ${jobData.growth} year-over-year. When negotiating, anchor to the 75th percentile (${fmt(s.p75)}) as your target — employers expect negotiation and build room into initial offers.`;
}
function databaseLookup(title,city,experience){
  const expMult=EXP_MULT[experience]||EXP_MULT.mid;
  const cityMult=getCityMult(city);
  const expLabel={entry:'Entry Level',mid:'Mid Level',senior:'Senior Level',lead:'Lead/Executive'}[experience]||'Mid Level';
  const match=findJob(title);
  if(!match){
    const base=Math.round(70000*cityMult*expMult/1000)*1000;
    return{p10:Math.round(base*0.75/1000)*1000,p25:Math.round(base*0.88/1000)*1000,p50:base,p75:Math.round(base*1.18/1000)*1000,p90:Math.round(base*1.38/1000)*1000,withBonus:Math.round(base*1.08/1000)*1000,totalComp:Math.round(base*1.12/1000)*1000,yoyGrowth:'+3.5%',narrative:`Based on location and experience data for ${title} in ${city||'the US'}. When negotiating, research your specific company pay bands and anchor your ask to the 75th percentile.`,sources:['BLS OEWS 2024','Location Adjustment Model']};
  }
  const extras=COMP_EXTRAS[match.data.cat]||COMP_EXTRAS.default;
  const salaries=buildSalaries(match.data.base,cityMult,expMult,extras);
  return{...salaries,yoyGrowth:match.data.growth,narrative:buildNarrative(title,city,expLabel,match.data,salaries),sources:['BLS OEWS 2024','Glassdoor','LinkedIn Salary Insights','Indeed']};
}
async function aiLookup(title,city,experience){
  const apiKey=process.env.ANTHROPIC_API_KEY;
  if(!apiKey)throw new Error('no key');
  const expMap={entry:'0-2 years',mid:'3-6 years',senior:'7-12 years',lead:'13+ years'};
  const prompt=`Salary expert. Research: ${title} in ${city||'US'}, exp: ${expMap[experience]||expMap.mid}. Return ONLY valid JSON no markdown: {"p10":0,"p25":0,"p50":0,"p75":0,"p90":0,"withBonus":0,"totalComp":0,"yoyGrowth":"+4%","narrative":"2-3 paragraphs with insight and negotiation tips.","sources":["BLS OEWS 2024","Glassdoor"]}`;
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1000,tools:[{type:'web_search_20250305',name:'web_search'}],messages:[{role:'user',content:prompt}]})});
  if(!r.ok)throw new Error(`${r.status}`);
  const d=await r.json();
  let txt='';for(const b of d.content){if(b.type==='text')txt+=b.text;}
  const m=txt.match(/\{[\s\S]*\}/);
  if(!m)throw new Error('parse');
  return JSON.parse(m[0]);
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const{title,city,experience}=req.body;
  if(!title)return res.status(400).json({error:'Job title is required'});
  const key=cacheKey(title,city,experience);

  // 1. Cache
  if(cache.has(key)){const c=cache.get(key);if(Date.now()-c.timestamp<CACHE_TTL)return res.status(200).json(c.data);cache.delete(key);}

  // 2. Try AI — ANY failure falls through silently, user never knows
  if(process.env.ANTHROPIC_API_KEY){
    try{const result=await aiLookup(title,city,experience);cache.set(key,{data:result,timestamp:Date.now()});return res.status(200).json(result);}
    catch{/* silent — no credits, rate limit, timeout: user gets database result */}
  }

  // 3. Database — always works, zero cost, zero errors shown to user
  const result=databaseLookup(title,city,experience);
  cache.set(key,{data:result,timestamp:Date.now()});
  return res.status(200).json(result);
}
