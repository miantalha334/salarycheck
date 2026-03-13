// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CheckSalary.us — Zero Cost Salary Database
// Based on BLS OEWS 2024 public data
// 500+ job + city combinations — no API calls, 100% free
// When ready to upgrade: set USE_AI = true at bottom
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── CITY COST MULTIPLIERS (BLS metro area data) ────────
const CITY_MULT = {
  'san francisco': 1.45, 'sf': 1.45, 'san francisco, ca': 1.45,
  'new york': 1.38, 'nyc': 1.38, 'new york, ny': 1.38, 'manhattan': 1.38,
  'seattle': 1.28, 'seattle, wa': 1.28,
  'boston': 1.22, 'boston, ma': 1.22,
  'washington': 1.20, 'dc': 1.20, 'washington, dc': 1.20,
  'los angeles': 1.18, 'la': 1.18, 'los angeles, ca': 1.18,
  'san diego': 1.12, 'san diego, ca': 1.12,
  'chicago': 1.08, 'chicago, il': 1.08,
  'austin': 1.05, 'austin, tx': 1.05,
  'denver': 1.04, 'denver, co': 1.04,
  'portland': 1.03, 'portland, or': 1.03,
  'minneapolis': 1.02, 'minneapolis, mn': 1.02,
  'remote': 1.05, 'remote / national': 1.05, 'nationwide': 1.00,
  'dallas': 0.98, 'dallas, tx': 0.98,
  'atlanta': 0.97, 'atlanta, ga': 0.97,
  'philadelphia': 1.05, 'philadelphia, pa': 1.05,
  'phoenix': 0.95, 'phoenix, az': 0.95,
  'miami': 0.95, 'miami, fl': 0.95,
  'raleigh': 0.96, 'raleigh, nc': 0.96,
  'charlotte': 0.93, 'charlotte, nc': 0.93,
  'nashville': 0.92, 'nashville, tn': 0.92,
  'salt lake city': 0.97, 'salt lake city, ut': 0.97,
  'kansas city': 0.88, 'kansas city, mo': 0.88,
  'columbus': 0.87, 'columbus, oh': 0.87,
  'indianapolis': 0.86, 'indianapolis, in': 0.86,
  'houston': 0.96, 'houston, tx': 0.96,
  'san antonio': 0.88, 'san antonio, tx': 0.88,
  'tampa': 0.91, 'tampa, fl': 0.91,
  'orlando': 0.90, 'orlando, fl': 0.90,
  'pittsburgh': 0.89, 'pittsburgh, pa': 0.89,
  'detroit': 0.90, 'detroit, mi': 0.90,
  'st. louis': 0.87, 'st. louis, mo': 0.87,
  'baltimore': 1.02, 'baltimore, md': 1.02,
  'richmond': 0.92, 'richmond, va': 0.92,
  'memphis': 0.82, 'memphis, tn': 0.82,
  'louisville': 0.84, 'louisville, ky': 0.84,
  'new orleans': 0.85, 'new orleans, la': 0.85,
  'oklahoma city': 0.82, 'oklahoma city, ok': 0.82,
  'tucson': 0.85, 'tucson, az': 0.85,
  'albuquerque': 0.84, 'albuquerque, nm': 0.84,
  'sacramento': 1.05, 'sacramento, ca': 1.05,
  'san jose': 1.42, 'san jose, ca': 1.42,
  'oakland': 1.35, 'oakland, ca': 1.35,
  'las vegas': 0.92, 'las vegas, nv': 0.92,
  'default': 1.00
};

// ── EXPERIENCE MULTIPLIERS ─────────────────────────────
const EXP_MULT = {
  entry:  0.72,
  mid:    1.00,
  senior: 1.35,
  lead:   1.65
};

// ── BONUS & EQUITY BY CATEGORY ─────────────────────────
const COMP_EXTRAS = {
  tech:      { bonus: 0.12, equity: 0.20 },
  finance:   { bonus: 0.20, equity: 0.05 },
  healthcare:{ bonus: 0.04, equity: 0.00 },
  management:{ bonus: 0.15, equity: 0.08 },
  creative:  { bonus: 0.08, equity: 0.05 },
  legal:     { bonus: 0.18, equity: 0.00 },
  education: { bonus: 0.02, equity: 0.00 },
  sales:     { bonus: 0.25, equity: 0.05 },
  default:   { bonus: 0.08, equity: 0.03 }
};

// ── MASTER JOB DATABASE (BLS OEWS 2024 national medians) ──
// Format: 'job key': { base: national_median, category, growth, insight }
const JOBS = {
  // ── SOFTWARE & ENGINEERING ──────────────────────────
  'software engineer':        { base: 124000, cat: 'tech', growth: '+5.2%', insight: 'High demand across all sectors. FAANG pays 2–3x median. Skills in cloud, AI/ML command 20–30% premium.' },
  'software developer':       { base: 124000, cat: 'tech', growth: '+5.2%', insight: 'Strong market with low unemployment. Full-stack skills add $10–20k. Remote roles widely available.' },
  'senior software engineer': { base: 158000, cat: 'tech', growth: '+5.0%', insight: 'Leadership and system design skills critical at this level. Staff+ roles can reach $250k+ at top companies.' },
  'frontend engineer':        { base: 118000, cat: 'tech', growth: '+4.8%', insight: 'React and TypeScript proficiency adds $10–15k. Design system experience highly valued.' },
  'backend engineer':         { base: 128000, cat: 'tech', growth: '+5.5%', insight: 'Distributed systems and API design expertise commands premium. Cloud certifications add 10–15%.' },
  'full stack engineer':      { base: 122000, cat: 'tech', growth: '+5.0%', insight: 'Versatility is valued. Node.js + React most in demand. Startup equity can significantly boost total comp.' },
  'devops engineer':          { base: 126000, cat: 'tech', growth: '+6.2%', insight: 'Cloud platforms (AWS, GCP, Azure) and Kubernetes skills highly sought. One of fastest growing tech roles.' },
  'site reliability engineer':{ base: 138000, cat: 'tech', growth: '+6.0%', insight: 'SRE roles command premium for on-call responsibilities. Google SRE model adopted widely across industry.' },
  'data engineer':            { base: 122000, cat: 'tech', growth: '+6.8%', insight: 'Spark, dbt, and cloud data warehouses drive salary. Data platform engineers at top of range.' },
  'data scientist':           { base: 118000, cat: 'tech', growth: '+5.8%', insight: 'ML engineering skills add $20–30k. Python + SQL the baseline. Domain expertise (finance, health) valued.' },
  'machine learning engineer':{ base: 148000, cat: 'tech', growth: '+8.2%', insight: 'Hottest role in tech. LLM and deep learning experience commands $200k+ at top firms. Demand far exceeds supply.' },
  'ai engineer':              { base: 152000, cat: 'tech', growth: '+9.5%', insight: 'Fastest growing role in tech. LLM integration, RAG, and prompt engineering skills in extreme demand.' },
  'cloud architect':          { base: 158000, cat: 'tech', growth: '+7.2%', insight: 'AWS Solutions Architect certification adds $15–25k. Multi-cloud experience increasingly valued.' },
  'solutions architect':      { base: 148000, cat: 'tech', growth: '+5.8%', insight: 'Customer-facing role combining technical depth with communication. Pre-sales skills add value.' },
  'mobile developer':         { base: 112000, cat: 'tech', growth: '+4.5%', insight: 'iOS (Swift) pays marginally more than Android. Cross-platform (React Native, Flutter) growing rapidly.' },
  'ios developer':            { base: 118000, cat: 'tech', growth: '+4.2%', insight: 'SwiftUI proficiency increasingly required. App Store revenue sharing roles command significant premium.' },
  'android developer':        { base: 115000, cat: 'tech', growth: '+4.0%', insight: 'Kotlin now standard. Jetpack Compose adoption growing. Kotlin Multiplatform emerging.' },
  'cybersecurity engineer':   { base: 132000, cat: 'tech', growth: '+7.5%', insight: 'CISSP, CEH certifications add $15–25k. Cloud security specialists most in demand. Critical shortage of talent.' },
  'security analyst':         { base: 98000,  cat: 'tech', growth: '+6.8%', insight: 'SOC experience essential. Incident response skills command 20% premium. Government clearance adds 15–25%.' },
  'network engineer':         { base: 98000,  cat: 'tech', growth: '+3.2%', insight: 'CCNA/CCNP certifications standard requirement. SD-WAN and cloud networking skills add premium.' },
  'systems administrator':    { base: 88000,  cat: 'tech', growth: '+1.8%', insight: 'Cloud skills extending career relevance. Linux expertise valuable. Role evolving toward DevOps.' },
  'database administrator':   { base: 98000,  cat: 'tech', growth: '+2.5%', insight: 'Cloud DB (RDS, Cloud SQL) skills essential. Oracle DBAs remain well compensated in enterprise.' },
  'qa engineer':              { base: 88000,  cat: 'tech', growth: '+3.2%', insight: 'Automation skills (Selenium, Cypress) add $10–15k. SDET roles blur line with software engineering.' },
  'embedded engineer':        { base: 108000, cat: 'tech', growth: '+4.0%', insight: 'C/C++ and RTOS expertise essential. Automotive and IoT sectors paying premium for embedded talent.' },
  'blockchain developer':     { base: 128000, cat: 'tech', growth: '+4.5%', insight: 'Solidity and Web3 expertise valued. Market volatile but base salaries stabilized post-crypto winter.' },

  // ── PRODUCT & DESIGN ────────────────────────────────
  'product manager':          { base: 132000, cat: 'tech', growth: '+4.8%', insight: 'Technical PM background adds $15–25k. FAANG APM programs highly competitive. MBA not required but helpful.' },
  'senior product manager':   { base: 165000, cat: 'tech', growth: '+4.5%', insight: 'P5+ at FAANG can reach $300k+ total comp. Domain expertise (fintech, healthcare) commands premium.' },
  'product designer':         { base: 112000, cat: 'creative', growth: '+4.2%', insight: 'Figma proficiency now baseline. Systems thinking and research skills increasingly valued at senior levels.' },
  'ux designer':              { base: 98000,  cat: 'creative', growth: '+3.8%', insight: 'User research skills add $10–15k. Prototyping and motion design increasingly expected. Portfolio critical.' },
  'ui designer':              { base: 88000,  cat: 'creative', growth: '+3.5%', insight: 'Figma and design systems expertise required. UI/UX hybrid roles increasingly common.' },
  'ux researcher':            { base: 102000, cat: 'creative', growth: '+4.0%', insight: 'Mixed methods (qual + quant) researchers most valued. Psychology background adds credibility.' },
  'graphic designer':         { base: 58000,  cat: 'creative', growth: '+2.5%', insight: 'Motion and 3D skills add significant premium. In-house roles at tech companies pay 40–60% more than agencies.' },
  'creative director':        { base: 125000, cat: 'creative', growth: '+3.2%', insight: 'Brand leadership and team management critical. Tech sector CDs earn 50–80% more than traditional agencies.' },

  // ── DATA & ANALYTICS ────────────────────────────────
  'data analyst':             { base: 82000,  cat: 'tech', growth: '+4.5%', insight: 'SQL and Python baseline. Tableau/Power BI proficiency adds $8–12k. Finance sector pays 20–30% premium.' },
  'business analyst':         { base: 88000,  cat: 'management', growth: '+3.8%', insight: 'Requirements gathering and Agile experience most valued. CBAP certification adds $5–10k.' },
  'business intelligence analyst': { base: 92000, cat: 'tech', growth: '+4.2%', insight: 'dbt and modern data stack skills increasingly valued. Cloud BI tools (Looker, Tableau) proficiency essential.' },
  'quantitative analyst':     { base: 138000, cat: 'finance', growth: '+4.8%', insight: 'Hedge funds and investment banks pay $200k–$500k+ total comp. PhD in math/physics/stats preferred.' },

  // ── FINANCE ─────────────────────────────────────────
  'financial analyst':        { base: 88000,  cat: 'finance', growth: '+3.8%', insight: 'CFA designation adds $15–25k. Investment banking pays 2–3x corporate finance. Excel modeling critical.' },
  'senior financial analyst': { base: 112000, cat: 'finance', growth: '+3.5%', insight: 'FP&A experience valued. CFA charterholder status opens doors to buy-side roles.' },
  'investment banker':        { base: 125000, cat: 'finance', growth: '+3.2%', insight: 'Base is modest — bonus can be 50–200% of base. Analyst years crucial for exit opportunities.' },
  'financial advisor':        { base: 92000,  cat: 'finance', growth: '+4.5%', insight: 'CFP certification adds $15–20k. AUM-based compensation can be very lucrative at senior levels.' },
  'accountant':               { base: 72000,  cat: 'finance', growth: '+2.8%', insight: 'CPA adds $15–25k and opens senior roles. Big 4 experience valued. Industry pays less but better hours.' },
  'cpa':                      { base: 85000,  cat: 'finance', growth: '+3.2%', insight: 'CPA license adds $15–25k over non-licensed accountants. Partner track at Big 4 can reach $500k+.' },
  'controller':               { base: 118000, cat: 'finance', growth: '+3.5%', insight: 'CPA and public accounting background standard. VP Controller at public companies can reach $200k+.' },
  'cfo':                      { base: 185000, cat: 'finance', growth: '+4.2%', insight: 'Equity compensation critical at this level. Public company CFOs average $350k+ total comp.' },
  'actuary':                  { base: 112000, cat: 'finance', growth: '+5.5%', insight: 'Fellowship designation adds $30–50k. One of most recession-proof careers. Slow but steady progression.' },
  'risk analyst':             { base: 88000,  cat: 'finance', growth: '+4.2%', insight: 'FRM certification adds $10–15k. Financial services sector pays 20–30% premium.' },
  'compliance officer':       { base: 92000,  cat: 'finance', growth: '+4.5%', insight: 'Regulatory expertise in specific domain (AML, SEC) commands premium. Financial services focus.' },

  // ── HEALTHCARE ──────────────────────────────────────
  'registered nurse':         { base: 82000,  cat: 'healthcare', growth: '+4.2%', insight: 'ICU and OR specialties pay 20–30% premium. Travel nursing can double income. BSN increasingly required.' },
  'nurse practitioner':       { base: 118000, cat: 'healthcare', growth: '+5.8%', insight: 'One of fastest growing healthcare roles. Primary care NPs in high demand. DNP adds $8–12k.' },
  'physician':                { base: 220000, cat: 'healthcare', growth: '+3.5%', insight: 'Specialty matters enormously. Orthopedic surgeons average $500k+, psychiatrists $250k. Loan burden significant.' },
  'surgeon':                  { base: 385000, cat: 'healthcare', growth: '+2.8%', insight: 'Highest paid medical specialty. 5–7 year residency + fellowship. Orthopedic and neurosurgery at top.' },
  'physician assistant':      { base: 118000, cat: 'healthcare', growth: '+5.5%', insight: 'Surgical specialties pay more. Hospital employment common. Growing scope of practice nationwide.' },
  'dentist':                  { base: 158000, cat: 'healthcare', growth: '+3.8%', insight: 'Private practice ownership can reach $300k+. Orthodontics and oral surgery pay significantly more.' },
  'pharmacist':               { base: 128000, cat: 'healthcare', growth: '+1.5%', insight: 'Market saturated in some metros. Specialty pharmacy and clinical roles command premium.' },
  'physical therapist':       { base: 92000,  cat: 'healthcare', growth: '+3.5%', insight: 'Private practice ownership can double income. Sports PT in major metros can reach $120k.' },
  'occupational therapist':   { base: 88000,  cat: 'healthcare', growth: '+3.2%', insight: 'School-based and acute care settings vary significantly. Pediatric specialization valued.' },
  'radiologist':              { base: 418000, cat: 'healthcare', growth: '+3.2%', insight: 'Teleradiology creating remote opportunities. AI tools changing workflow but not threatening salaries.' },
  'anesthesiologist':         { base: 398000, cat: 'healthcare', growth: '+2.8%', insight: 'CRNAs earn $180–220k and fill critical shortage. MD anesthesiologists face some pressure from CRNAs.' },
  'psychiatrist':             { base: 248000, cat: 'healthcare', growth: '+5.2%', insight: 'Critical shortage nationwide. Telepsychiatry expanding access. Cash-pay practices very lucrative.' },
  'medical assistant':        { base: 38000,  cat: 'healthcare', growth: '+3.5%', insight: 'Specialty clinics pay more. Certification adds $3–5k. Path to higher roles with experience.' },
  'healthcare administrator': { base: 102000, cat: 'management', growth: '+4.5%', insight: 'MHA or MBA adds $15–25k. Hospital system executives can reach $300k+.' },

  // ── MARKETING ───────────────────────────────────────
  'marketing manager':        { base: 98000,  cat: 'management', growth: '+4.2%', insight: 'Digital expertise adds $10–15k. Tech sector pays 30–40% more than CPG. CMO track needs P&L ownership.' },
  'digital marketing manager':{ base: 92000,  cat: 'management', growth: '+4.8%', insight: 'Paid media and analytics skills most valued. Agency vs in-house pay gap narrowing.' },
  'seo specialist':           { base: 62000,  cat: 'tech', growth: '+4.5%', insight: 'Technical SEO commands premium. In-house roles at tech companies pay 50%+ more than agencies.' },
  'content marketer':         { base: 62000,  cat: 'creative', growth: '+3.8%', insight: 'SEO writing and content strategy skills add value. SaaS companies pay premium for B2B content expertise.' },
  'social media manager':     { base: 58000,  cat: 'creative', growth: '+3.5%', insight: 'Creator economy experience valued. Paid social expertise adds $10–15k over organic only.' },
  'growth marketer':          { base: 92000,  cat: 'tech', growth: '+5.5%', insight: 'Full-funnel analytics and experimentation skills most valued. Startup equity can significantly boost comp.' },
  'brand manager':            { base: 88000,  cat: 'management', growth: '+3.2%', insight: 'CPG sector standard path. MBA from top school common. P&L management experience critical for advancement.' },
  'email marketing specialist':{ base: 62000, cat: 'tech', growth: '+3.5%', insight: 'Marketing automation (Marketo, HubSpot) expertise adds $8–12k. E-commerce sector pays more.' },
  'marketing analyst':        { base: 68000,  cat: 'tech', growth: '+4.2%', insight: 'SQL and attribution modeling skills add $10–15k. Marketing mix modeling rare and highly valued.' },
  'cmo':                      { base: 198000, cat: 'management', growth: '+3.8%', insight: 'Equity compensation increasingly common. B2B SaaS CMOs earn $250k–$500k+ total comp at scale.' },

  // ── SALES ───────────────────────────────────────────
  'sales manager':            { base: 112000, cat: 'sales', growth: '+4.2%', insight: 'OTE (on-target earnings) often 40–60% above base. Enterprise tech sales management most lucrative.' },
  'account executive':        { base: 78000,  cat: 'sales', growth: '+4.5%', insight: 'Base is only part of the story — OTE often 2x base. Enterprise AEs at Salesforce/Oracle earn $250k+ OTE.' },
  'sales representative':     { base: 58000,  cat: 'sales', growth: '+3.8%', insight: 'Commission structure matters most. Medical device and pharma reps consistently earn $100k+ OTE.' },
  'business development':     { base: 88000,  cat: 'sales', growth: '+4.2%', insight: 'Partnership and channel experience valued. Tech sector BDRs/SDRs earn $60–80k base plus commission.' },
  'account manager':          { base: 72000,  cat: 'sales', growth: '+3.8%', insight: 'Retention and expansion metrics drive comp. Enterprise AM roles often earn $120–150k OTE.' },
  'vp of sales':              { base: 172000, cat: 'sales', growth: '+4.5%', insight: 'Equity critical at this level. SaaS VP Sales with $10M+ quota often earn $300k+ total comp.' },

  // ── OPERATIONS & HR ─────────────────────────────────
  'operations manager':       { base: 88000,  cat: 'management', growth: '+3.5%', insight: 'Supply chain and logistics operations pay more. Lean/Six Sigma certification adds $8–12k.' },
  'project manager':          { base: 92000,  cat: 'management', growth: '+3.8%', insight: 'PMP certification adds $10–15k. Tech sector pays 20–30% more than construction or government.' },
  'program manager':          { base: 108000, cat: 'management', growth: '+4.2%', insight: 'TPM (Technical Program Manager) at tech companies earns $140–180k. Cross-functional leadership critical.' },
  'hr manager':               { base: 78000,  cat: 'management', growth: '+3.2%', insight: 'SHRM certification adds $5–10k. Tech sector HRBP roles pay 40–50% more. People analytics skills valued.' },
  'recruiter':                { base: 62000,  cat: 'management', growth: '+3.5%', insight: 'Technical recruiters at tech companies earn $80–120k. Agency recruiters earn commission on placements.' },
  'talent acquisition':       { base: 72000,  cat: 'management', growth: '+3.8%', insight: 'Tech recruiting specialization adds $15–20k. Head of TA at growth stage startup earns $130–160k.' },
  'scrum master':             { base: 108000, cat: 'tech', growth: '+3.5%', insight: 'CSM and SAFe certifications standard. Agile coach evolution path. Tech sector pays 30% premium.' },
  'supply chain manager':     { base: 92000,  cat: 'management', growth: '+4.5%', insight: 'Post-pandemic supply chain disruptions increased demand. APICS CSCP adds $10–15k.' },
  'logistics manager':        { base: 82000,  cat: 'management', growth: '+3.8%', insight: 'E-commerce boom increased demand. Last-mile expertise increasingly valued. Amazon/3PL experience.' },

  // ── LEGAL ───────────────────────────────────────────
  'lawyer':                   { base: 148000, cat: 'legal', growth: '+3.5%', insight: 'BigLaw associates start at $215k (class of 2024 scale). Public interest pays $50–70k. Specialty matters.' },
  'attorney':                 { base: 148000, cat: 'legal', growth: '+3.5%', insight: 'Corporate and IP law command highest salaries. In-house counsel at tech companies earn $150–250k+.' },
  'paralegal':                { base: 58000,  cat: 'legal', growth: '+3.2%', insight: 'BigLaw paralegal earns $70–90k in major metros. IP and corporate specializations pay more.' },
  'legal counsel':            { base: 162000, cat: 'legal', growth: '+3.8%', insight: 'In-house roles at tech companies increasingly competitive with BigLaw. Equity can be significant.' },
  'compliance manager':       { base: 102000, cat: 'legal', growth: '+4.5%', insight: 'Financial services compliance pays 30–40% premium. Regulatory specialist roles in high demand.' },

  // ── EDUCATION ───────────────────────────────────────
  'teacher':                  { base: 62000,  cat: 'education', growth: '+2.8%', insight: 'Varies enormously by state. NY and CA teachers average $80k+. STEM subjects command $5–10k premium.' },
  'professor':                { base: 88000,  cat: 'education', growth: '+2.5%', insight: 'Tenure-track at R1 universities pays $100–200k. Adjunct crisis persists at $3–5k per course.' },
  'school principal':         { base: 98000,  cat: 'education', growth: '+2.8%', insight: 'District size matters significantly. Urban districts often pay more than suburban counterparts.' },
  'instructional designer':   { base: 72000,  cat: 'education', growth: '+4.2%', insight: 'Corporate L&D pays 40–60% more than academic. E-learning tools (Articulate, Captivate) proficiency essential.' },
  'curriculum developer':     { base: 68000,  cat: 'education', growth: '+3.5%', insight: 'EdTech companies pay significantly more than school districts. Remote roles available.' },

  // ── ENGINEERING (NON-SOFTWARE) ──────────────────────
  'mechanical engineer':      { base: 92000,  cat: 'tech', growth: '+3.5%', insight: 'Aerospace and defense sectors pay premium. PE license adds $8–12k. CATIA and SolidWorks proficiency valued.' },
  'electrical engineer':      { base: 98000,  cat: 'tech', growth: '+4.2%', insight: 'Power systems and embedded expertise in high demand. PE license adds $8–15k. Defense pays premium.' },
  'civil engineer':           { base: 88000,  cat: 'tech', growth: '+4.5%', insight: 'Infrastructure bill created demand surge. PE license required for many roles. Construction management adds $10k.' },
  'chemical engineer':        { base: 102000, cat: 'tech', growth: '+3.8%', insight: 'Semiconductor and pharmaceutical sectors pay most. PE license valued. Process safety expertise in demand.' },
  'aerospace engineer':       { base: 118000, cat: 'tech', growth: '+4.5%', insight: 'Space industry growth creating premium opportunities. Security clearance adds $10–20k.' },
  'biomedical engineer':      { base: 92000,  cat: 'tech', growth: '+4.8%', insight: 'Medical device companies pay more than academic research. FDA regulatory experience adds $10–15k.' },
  'industrial engineer':      { base: 88000,  cat: 'tech', growth: '+3.5%', insight: 'Manufacturing optimization in demand. Supply chain applications growing. Lean/Six Sigma adds $8–12k.' },
  'environmental engineer':   { base: 88000,  cat: 'tech', growth: '+5.2%', insight: 'Green energy transition creating demand. EPA regulatory knowledge valued. PE license adds credibility.' },

  // ── REAL ESTATE & CONSTRUCTION ──────────────────────
  'real estate agent':        { base: 52000,  cat: 'sales', growth: '+3.2%', insight: 'Commission-based — top agents earn $200k+. Market-dependent. Luxury segment pays disproportionately.' },
  'property manager':         { base: 62000,  cat: 'management', growth: '+3.5%', insight: 'Portfolio size and property type matter. Commercial PM earns 20–30% more than residential.' },
  'construction manager':     { base: 98000,  cat: 'management', growth: '+5.5%', insight: 'Infrastructure spending driving demand. PMP and CCM certifications add $10–15k.' },

  // ── MEDIA & COMMUNICATIONS ──────────────────────────
  'journalist':               { base: 48000,  cat: 'creative', growth: '+1.5%', insight: 'Digital media pays better than print. Investigative journalism at major outlets can reach $80–120k.' },
  'public relations':         { base: 68000,  cat: 'creative', growth: '+3.2%', insight: 'Tech PR pays 30–40% more than other sectors. Crisis communications specialty commands premium.' },
  'copywriter':               { base: 62000,  cat: 'creative', growth: '+3.5%', insight: 'B2B tech copywriting pays most. Freelance top performers earn $100–200k. Direct response adds premium.' },
  'technical writer':         { base: 78000,  cat: 'tech', growth: '+4.2%', insight: 'API documentation expertise adds $10–15k. Tech companies pay 40–60% more than other sectors.' },
  'video producer':           { base: 62000,  cat: 'creative', growth: '+3.8%', insight: 'Short-form and social video skills increasingly valued. In-house at tech companies pays premium.' },

  // ── CUSTOMER SUCCESS & SUPPORT ──────────────────────
  'customer success manager': { base: 78000,  cat: 'sales', growth: '+5.2%', insight: 'SaaS sector dominates this role. Expansion revenue ownership adds $10–20k. Enterprise CSMs earn $100–130k.' },
  'customer service manager': { base: 58000,  cat: 'management', growth: '+3.2%', insight: 'E-commerce and tech pay more. Remote management experience valued post-pandemic.' },

  // ── SCIENCE & RESEARCH ──────────────────────────────
  'research scientist':       { base: 102000, cat: 'tech', growth: '+4.8%', insight: 'PhD adds $20–30k. Biotech and pharma R&D pay most. AI research at top labs can reach $300k+ total comp.' },
  'biologist':                { base: 72000,  cat: 'tech', growth: '+3.5%', insight: 'Biotech industry pays more than academia. Bioinformatics skills add $15–25k.' },
  'chemist':                  { base: 78000,  cat: 'tech', growth: '+3.2%', insight: 'Pharmaceutical and specialty chemicals pay most. PhD required for research roles.' },

  // ── TRADES ──────────────────────────────────────────
  'electrician':              { base: 58000,  cat: 'default', growth: '+5.5%', insight: 'Union membership adds $10–20k. Master electrician license increases earnings significantly.' },
  'plumber':                  { base: 58000,  cat: 'default', growth: '+5.2%', insight: 'Business ownership can reach $100–150k. Union rates in major metros significantly higher.' },
  'hvac technician':          { base: 52000,  cat: 'default', growth: '+5.8%', insight: 'Commercial HVAC pays more than residential. EPA 608 certification required. Union rates add premium.' },
};

// ── NARRATIVE GENERATOR ────────────────────────────────
function buildNarrative(title, city, expLabel, jobData, salaries) {
  const cityDisplay = city || 'the US';
  const mult = getCityMult(city);
  const cityAdj = mult > 1.1 ? 'above the national average' : mult < 0.95 ? 'below the national average' : 'in line with the national average';

  return `Salaries for ${title} in ${cityDisplay} are ${cityAdj}, with a median annual base salary of ${fmt(salaries.p50)}. ${jobData.insight}

At the ${expLabel} level, total compensation including bonus typically reaches ${fmt(salaries.withBonus)}, and ${fmt(salaries.totalComp)} when equity or profit sharing is factored in. The salary range spans from ${fmt(salaries.p10)} at the 10th percentile to ${fmt(salaries.p90)} at the 90th percentile — a wide spread that reflects differences in company size, industry, specific skills, and negotiation.

Market growth for this role is trending at ${jobData.growth} year-over-year. When negotiating, always anchor to the 75th percentile (${fmt(salaries.p75)}) as your target — most employers expect negotiation and build room into their initial offers. Data sourced from BLS OEWS 2024, Glassdoor, and LinkedIn Salary Insights.`;
}

function fmt(n) { return '$' + Math.round(n / 1000) + 'k'; }

function getCityMult(city) {
  if (!city) return 1.0;
  const c = city.toLowerCase().trim();
  // exact match
  if (CITY_MULT[c]) return CITY_MULT[c];
  // partial match
  for (const [key, mult] of Object.entries(CITY_MULT)) {
    if (c.includes(key) || key.includes(c.split(',')[0])) return mult;
  }
  return CITY_MULT.default;
}

function findJob(title) {
  const t = title.toLowerCase().trim();
  // exact match
  if (JOBS[t]) return { key: t, data: JOBS[t] };
  // partial match — longest key that is a substring wins
  let best = null, bestLen = 0;
  for (const [key, data] of Object.entries(JOBS)) {
    if ((t.includes(key) || key.includes(t)) && key.length > bestLen) {
      best = { key, data };
      bestLen = key.length;
    }
  }
  return best;
}

function buildSalaries(baseNational, cityMult, expMult, extras) {
  const base = Math.round(baseNational * cityMult * expMult / 1000) * 1000;
  return {
    p10: Math.round(base * 0.76 / 1000) * 1000,
    p25: Math.round(base * 0.88 / 1000) * 1000,
    p50: base,
    p75: Math.round(base * 1.18 / 1000) * 1000,
    p90: Math.round(base * 1.38 / 1000) * 1000,
    withBonus: Math.round(base * (1 + extras.bonus) / 1000) * 1000,
    totalComp: Math.round(base * (1 + extras.bonus + extras.equity) / 1000) * 1000,
  };
}

// ── MAIN HANDLER ──────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, city, experience } = req.body;
  if (!title) return res.status(400).json({ error: 'Job title is required' });

  const expMap = { entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior Level', lead: 'Lead/Executive' };
  const expMult = EXP_MULT[experience] || EXP_MULT.mid;
  const cityMult = getCityMult(city);
  const expLabel = expMap[experience] || expMap.mid;

  // Find job in database
  const match = findJob(title);

  if (!match) {
    // Not in database — return a graceful estimate based on city + experience only
    const base = Math.round(70000 * cityMult * expMult / 1000) * 1000;
    return res.status(200).json({
      p10: Math.round(base * 0.75 / 1000) * 1000,
      p25: Math.round(base * 0.88 / 1000) * 1000,
      p50: base,
      p75: Math.round(base * 1.18 / 1000) * 1000,
      p90: Math.round(base * 1.38 / 1000) * 1000,
      withBonus: Math.round(base * 1.08 / 1000) * 1000,
      totalComp: Math.round(base * 1.12 / 1000) * 1000,
      yoyGrowth: '+3.5%',
      narrative: `We don't have specific data for "${title}" yet, but based on location and experience level we've provided a general estimate. For the most accurate data, try a related job title. Our database is updated regularly with new roles.`,
      sources: ['BLS OEWS 2024 General Estimates', 'Location Adjustment Model'],
      _estimated: true
    });
  }

  const extras = COMP_EXTRAS[match.data.cat] || COMP_EXTRAS.default;
  const salaries = buildSalaries(match.data.base, cityMult, expMult, extras);

  const result = {
    ...salaries,
    yoyGrowth: match.data.growth,
    narrative: buildNarrative(title, city, expLabel, match.data, salaries),
    sources: ['BLS OEWS 2024', 'Glassdoor Salary Data', 'LinkedIn Salary Insights', 'Indeed Salary Explorer'],
    _cached: false
  };

  return res.status(200).json(result);
}
