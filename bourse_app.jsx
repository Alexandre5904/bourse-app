import { useState, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RT,
  ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  LineChart, Line,
} from "recharts";

/* ═══════════════════════════════════════════════
   API KEY
   ═══════════════════════════════════════════════ */
const FMP_KEY = "s0BLKiROWmOfW3hanrhkAkIKKNl5Wo7L";
const FMP = (path) => `https://financialmodelingprep.com/api/v3/${path}&apikey=${FMP_KEY}`;

/* ═══════════════════════════════════════════════
   THEME ENGINE — couleur par ADN de la marque
   ═══════════════════════════════════════════════ */
const BRAND_THEMES = {
  // Luxe / Mode
  "MC.PA":   { accent:"#C9A455", bg:"#0B0806", surface:"#160F08", border:"#332010", text:"#F0E6D0", textSub:"#9A8468", textMuted:"#5A4030", inspiration:"Toile Monogram LV" },
  "RMS.PA":  { accent:"#E8692A", bg:"#0C0806", surface:"#180E08", border:"#3A1A08", text:"#F5E8DC", textSub:"#B07848", textMuted:"#6A3820", inspiration:"Cuir Saddle Hermès" },
  "KER.PA":  { accent:"#9060E0", bg:"#0A0810", surface:"#120E1C", border:"#281840", text:"#E8E0F5", textSub:"#887098", textMuted:"#483860", inspiration:"Gucci Verde" },
  // Tech
  "AAPL":    { accent:"#E8E8E8", bg:"#000000", surface:"#0D0D0D", border:"#222222", text:"#F5F5F5", textSub:"#A0A0A0", textMuted:"#505050", inspiration:"Apple blanc minimaliste" },
  "MSFT":    { accent:"#00A4EF", bg:"#040810", surface:"#080E18", border:"#101C30", text:"#DCF0FF", textSub:"#607080", textMuted:"#304050", inspiration:"Windows Blue" },
  "GOOGL":   { accent:"#4285F4", bg:"#060810", surface:"#0C1018", border:"#182030", text:"#E0ECFF", textSub:"#607090", textMuted:"#303850", inspiration:"Google Blue" },
  "NVDA":    { accent:"#76B900", bg:"#060A04", surface:"#0C1008", border:"#1A2A08", text:"#E8F5D8", textSub:"#608040", textMuted:"#304020", inspiration:"NVIDIA Green" },
  "META":    { accent:"#0082FB", bg:"#04080E", surface:"#080E18", border:"#102030", text:"#D8ECFF", textSub:"#507090", textMuted:"#283848", inspiration:"Meta Blue" },
  // Finance
  "JPM":     { accent:"#006FA6", bg:"#04080C", surface:"#080E14", border:"#10202A", text:"#D0E8F5", textSub:"#486878", textMuted:"#243440", inspiration:"JPMorgan Navy" },
  "GS":      { accent:"#6BAED6", bg:"#060808", surface:"#0C1010", border:"#182020", text:"#D8F0F5", textSub:"#507080", textMuted:"#283840", inspiration:"Goldman Blue" },
  // Énergie
  "TTE.PA":  { accent:"#EF2E24", bg:"#0A0404", surface:"#160808", border:"#300C0C", text:"#FFE8E8", textSub:"#A06060", textMuted:"#603030", inspiration:"Rouge TotalEnergies" },
  "BN.PA":   { accent:"#0057A8", bg:"#04080E", surface:"#080E18", border:"#101E30", text:"#D8ECFF", textSub:"#486888", textMuted:"#243450", inspiration:"Bleu Danone" },
  // Default
  "DEFAULT": { accent:"#60A5FA", bg:"#050810", surface:"#0A0E18", border:"#141E30", text:"#DCF0FF", textSub:"#507090", textMuted:"#28384A", inspiration:"Thème générique" },
};

function getTheme(ticker) {
  if (!ticker) return BRAND_THEMES["DEFAULT"];
  const t = BRAND_THEMES[ticker.toUpperCase()];
  if (t) return t;
  // Couleur générée dynamiquement à partir du ticker
  const hash = ticker.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const hue = (hash * 47) % 360;
  return {
    accent: `hsl(${hue},60%,62%)`,
    bg: `hsl(${hue},20%,4%)`,
    surface: `hsl(${hue},18%,7%)`,
    border: `hsl(${hue},20%,14%)`,
    text: `hsl(${hue},20%,92%)`,
    textSub: `hsl(${hue},15%,55%)`,
    textMuted: `hsl(${hue},12%,28%)`,
    inspiration: "Thème généré automatiquement",
  };
}

/* ═══════════════════════════════════════════════
   HELPERS FORMAT
   ═══════════════════════════════════════════════ */
const fmt = (n, digits=1) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n/1e12).toFixed(digits) + " B€";
  if (abs >= 1e9)  return (n/1e9).toFixed(digits)  + " Md€";
  if (abs >= 1e6)  return (n/1e6).toFixed(digits)  + " M€";
  return n.toFixed(digits);
};
const fmtPct = (n) => n == null || isNaN(n) ? "—" : (n*100).toFixed(1)+"%";
const fmtRaw = (n, d=2) => n == null || isNaN(n) ? "—" : (+n).toFixed(d);

/* ═══════════════════════════════════════════════
   DONUT
   ═══════════════════════════════════════════════ */
function Donut({data,label,size=110,T}) {
  const cx=size/2,cy=size/2,r=size*.37,sw=size*.16;
  let a=-90;
  const sl=data.map(d=>{const s=a;a+=d.pct*3.6;return{...d,s,e:a};});
  const arc=(s,e)=>{
    const sr=(s*Math.PI)/180,er=(e*Math.PI)/180,lg=e-s>180?1:0;
    return `M${cx+r*Math.cos(sr)} ${cy+r*Math.sin(sr)} A${r} ${r} 0 ${lg} 1 ${cx+r*Math.cos(er)} ${cy+r*Math.sin(er)}`;
  };
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {sl.map((s,i)=><path key={i} d={arc(s.s,s.e)} fill="none" stroke={s.color} strokeWidth={sw}/>)}
      <text x={cx} y={cy-4} textAnchor="middle" fill={T.accent} fontSize="15" fontWeight="600" fontFamily="'DM Mono',monospace">{label}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
export default function App() {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [company, setCompany]   = useState(null);   // profile + quote
  const [income, setIncome]     = useState([]);     // quarterly income
  const [balance, setBalance]   = useState([]);     // quarterly balance
  const [cashflow, setCashflow] = useState([]);     // quarterly cashflow
  const [peers, setPeers]       = useState([]);     // peer comparison
  const [tab, setTab]           = useState("income");
  const [caTab, setCaTab]       = useState("income");
  const [aiText, setAiText]     = useState("");
  const [aiLoading, setAiLoading]=useState(false);
  const [aiScope, setAiScope]   = useState(null);
  const [error, setError]       = useState(null);
  const debounce = useRef(null);
  const T = company ? getTheme(company.symbol) : BRAND_THEMES["DEFAULT"];

  /* ── SEARCH AUTOCOMPLETE */
  const onSearch = (val) => {
    setQuery(val);
    clearTimeout(debounce.current);
    if (!val || val.length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const r = await fetch(FMP(`search?query=${encodeURIComponent(val)}&limit=8&`));
        const d = await r.json();
        setResults((d||[]).filter(x=>x.exchangeShortName&&["NYSE","NASDAQ","EURONEXT","LSE","SWX"].includes(x.exchangeShortName)).slice(0,6));
      } catch {}
    }, 320);
  };

  /* ── LOAD COMPANY */
  const loadCompany = async (ticker) => {
    setLoading(true); setError(null); setResults([]);
    setQuery(""); setAiText(""); setAiScope(null);
    setCompany(null); setIncome([]); setBalance([]); setCashflow([]); setPeers([]);
    try {
      const [profR, quoteR, incR, balR, cfR, peersR] = await Promise.all([
        fetch(FMP(`profile/${ticker}?`)),
        fetch(FMP(`quote/${ticker}?`)),
        fetch(FMP(`income-statement/${ticker}?period=quarter&limit=8&`)),
        fetch(FMP(`balance-sheet-statement/${ticker}?period=quarter&limit=4&`)),
        fetch(FMP(`cash-flow-statement/${ticker}?period=quarter&limit=4&`)),
        fetch(FMP(`stock_peers?symbol=${ticker}&`)),
      ]);
      const [prof, quote, inc, bal, cf, peersData] = await Promise.all([
        profR.json(), quoteR.json(), incR.json(), balR.json(), cfR.json(), peersR.json(),
      ]);
      if (!prof || prof.length===0) throw new Error("Entreprise non trouvée");
      setCompany({...prof[0], ...quote[0]});
      setIncome(inc||[]);
      setBalance(bal||[]);
      setCashflow(cf||[]);
      // Peers : charger quotes
      const pList = (peersData?.peersList||[]).slice(0,4);
      if (pList.length>0) {
        const pQ = await fetch(FMP(`quote/${pList.join(",")}&`));
        const pD = await pQ.json();
        setPeers(pD||[]);
      }
    } catch(e) {
      setError("Impossible de charger les données. Vérifie le ticker ou réessaie.");
    }
    setLoading(false);
  };

  /* ── AI ANALYSIS */
  const analyze = async (scope) => {
    if (!company) return;
    setAiLoading(true); setAiText(""); setAiScope(scope);
    const latest = income[0] || {};
    const prompts = {
      resultats: `Analyse simplement pour un investisseur débutant les résultats de ${company.companyName} (${company.symbol}).
CA dernier trimestre : ${fmt(latest.revenue)}. Marge brute : ${fmtPct(latest.grossProfitRatio)}. Résultat net : ${fmt(latest.netIncome)}. Marge nette : ${fmtPct(latest.netIncomeRatio)}. EBITDA : ${fmt(latest.ebitda)}.
4 bullet points courts, sans jargon, en français.`,
      bilan: `Explique simplement pour un débutant le bilan de ${company.companyName}.
Total actifs : ${fmt(balance[0]?.totalAssets)}. Dettes totales : ${fmt(balance[0]?.totalDebt)}. Capitaux propres : ${fmt(balance[0]?.totalStockholdersEquity)}. Cash : ${fmt(balance[0]?.cashAndCashEquivalents)}.
4 bullet points : est-ce que l'entreprise est solide financièrement ? A-t-elle trop de dettes ? Comment est-elle capitalisée ?`,
      cashflow: `Explique simplement le flux de trésorerie de ${company.companyName} pour un débutant.
Cash flow opérationnel : ${fmt(cashflow[0]?.operatingCashFlow)}. Capex : ${fmt(cashflow[0]?.capitalExpenditure)}. Free cash flow : ${fmt(cashflow[0]?.freeCashFlow)}. Dividendes versés : ${fmt(cashflow[0]?.dividendsPaid)}.
4 bullet points : est-ce que l'entreprise génère du cash ? Investit-elle ? Rémunère-t-elle bien ses actionnaires ?`,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800,
          messages:[{role:"user",content:prompts[scope]}] })
      });
      const d = await res.json();
      setAiText(d.content?.[0]?.text || "Indisponible.");
    } catch { setAiText("• Erreur de connexion."); }
    setAiLoading(false);
  };

  /* ── INCOME CHART DATA */
  const incomeChart = income.slice(0,6).reverse().map(q=>({
    q: q.date?.slice(0,7) || "",
    CA: q.revenue ? +(q.revenue/1e9).toFixed(2) : 0,
    Net: q.netIncome ? +(q.netIncome/1e9).toFixed(2) : 0,
  }));

  /* ── RENDER */
  const C = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:18 };

  return (
    <div style={{fontFamily:"'DM Sans','Helvetica Neue',sans-serif",color:T.text,background:T.bg,minHeight:"100vh",padding:"20px 16px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input{font-family:inherit}
        .tab{padding:6px 13px;border-radius:8px;border:none;background:transparent;font-family:inherit;font-size:12px;cursor:pointer;transition:all .15s;white-space:nowrap;color:${T.textSub}}
        .tab.on{background:${T.accent};color:${T.bg};font-weight:600}
        .ab{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid ${T.border};color:${T.textSub};background:transparent;border-radius:9px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;white-space:nowrap}
        .ab:hover,.ab.on{background:${T.accent};color:${T.bg};border-color:${T.accent}}
        .ab:disabled{opacity:.35;cursor:wait}
        .bf{transition:width .65s cubic-bezier(.4,0,.2,1)}
        .mr{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid ${T.border};font-size:13px}
        .mr:last-child{border-bottom:none}
        .mr:hover{background:${T.border}44;border-radius:6px}
        .sr{padding:10px 14px;cursor:pointer;font-size:13px;color:${T.text};transition:background .1s}
        .sr:hover{background:${T.border}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pu{0%,100%{opacity:1}50%{opacity:.25}}
        .dt{animation:pu 1.2s ease-in-out infinite;color:${T.accent}}
        .dt:nth-child(2){animation-delay:.2s}.dt:nth-child(3){animation-delay:.4s}
        ::-webkit-scrollbar{width:4px;background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        .kpi-val{font-size:20px;font-weight:600;font-family:'DM Mono',monospace;color:${T.accent};margin-bottom:3px}
      `}</style>

      {/* ══ SEARCH BAR ══ */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:22,fontFamily:"'Playfair Display',serif",fontWeight:600,color:T.accent,marginBottom:4,letterSpacing:".3px"}}>
          ✦ Analyse Fondamentale
        </div>
        <div style={{fontSize:12,color:T.textMuted,marginBottom:14}}>Recherche une action par nom ou ticker — marchés EU & US</div>

        <div style={{position:"relative"}}>
          <div style={{display:"flex",gap:10,alignItems:"center",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"10px 14px",transition:"border-color .2s"}}>
            <span style={{fontSize:16,color:T.textSub}}>🔍</span>
            <input
              value={query}
              onChange={e=>onSearch(e.target.value)}
              placeholder="Ex : LVMH, Apple, TotalEnergies, Hermès…"
              style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:T.text,caretColor:T.accent}}
            />
            {loading && <div style={{width:16,height:16,border:`2px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
          </div>
          {results.length>0 && (
            <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,zIndex:50,overflow:"hidden",boxShadow:`0 8px 30px ${T.bg}`}}>
              {results.map(r=>(
                <div key={r.symbol} className="sr" onClick={()=>loadCompany(r.symbol)} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <span style={{fontWeight:600}}>{r.name}</span>
                    <span style={{fontSize:11,color:T.textMuted,marginLeft:8}}>{r.symbol}</span>
                  </div>
                  <span style={{fontSize:11,color:T.textSub,background:T.border,padding:"2px 8px",borderRadius:6}}>{r.exchangeShortName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <div style={{marginTop:10,fontSize:13,color:"#C07070",padding:"8px 12px",background:"#C0707018",borderRadius:8,border:"1px solid #C0707044"}}>{error}</div>}
      </div>

      {/* ══ PLACEHOLDER ══ */}
      {!company && !loading && (
        <div style={{textAlign:"center",padding:"60px 20px",color:T.textMuted}}>
          <div style={{fontSize:48,marginBottom:16}}>📊</div>
          <div style={{fontSize:16,fontWeight:500,color:T.textSub,marginBottom:8}}>Recherche une entreprise pour commencer</div>
          <div style={{fontSize:13}}>Exemples : LVMH · Apple · TotalEnergies · NVIDIA · Hermès · Danone</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:18,flexWrap:"wrap"}}>
            {["MC.PA","AAPL","TTE.PA","NVDA","RMS.PA","MSFT"].map(t=>(
              <button key={t} onClick={()=>loadCompany(t)}
                style={{padding:"6px 14px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.textSub,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══ COMPANY DATA ══ */}
      {company && (
        <>
          {/* ── HEADER */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {company.image && <img src={company.image} alt="" style={{width:44,height:44,borderRadius:10,objectFit:"contain",background:T.surface,border:`1px solid ${T.border}`,padding:4}}/>}
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:600,color:T.text}}>{company.companyName}</div>
                <div style={{fontSize:12,color:T.textSub,marginTop:2,fontFamily:"'DM Mono',monospace"}}>{company.symbol} · {company.exchangeShortName} · {company.sector}</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:28,fontWeight:600,fontFamily:"'DM Mono',monospace",color:T.accent}}>{fmtRaw(company.price)} {company.currency||"€"}</div>
              <div style={{fontSize:13,color:company.changesPercentage>=0?"#7DB068":"#C07070",fontWeight:500,marginTop:3}}>
                {company.changesPercentage>=0?"+":""}{fmtRaw(company.changesPercentage)}% aujourd'hui
              </div>
            </div>
          </div>
          <div style={{fontSize:11,color:T.textMuted,marginBottom:18,letterSpacing:".07em",textTransform:"uppercase"}}>
            ✦ {getTheme(company.symbol).inspiration}
          </div>

          {/* ── KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            {[
              {l:"Capitalisation",v:fmt(company.mktCap)},
              {l:"PER",v:company.pe?fmtRaw(company.pe,1)+"×":"—"},
              {l:"Dividende",v:company.lastDiv?fmtRaw(company.lastDiv)+" "+( company.currency||"€"):"—"},
              {l:"Beta",v:company.beta?fmtRaw(company.beta,2):"—"},
            ].map(k=>(
              <div key={k.l} style={{...C,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>{k.l}</div>
                <div className="kpi-val">{k.v}</div>
              </div>
            ))}
          </div>

          {/* ── FINANCIAL TABS */}
          <div style={{...C,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:14,fontWeight:600}}>États financiers — 8 derniers trimestres</div>
              <div style={{display:"flex",gap:3,background:T.bg,borderRadius:10,padding:3}}>
                {["income","balance","cashflow"].map(t=>(
                  <button key={t} className={`tab${caTab===t?" on":""}`} onClick={()=>setCaTab(t)}>
                    {t==="income"?"Compte de résultat":t==="balance"?"Bilan":"Flux de trésorerie"}
                  </button>
                ))}
              </div>
            </div>

            {/* INCOME */}
            {caTab==="income" && income.length>0 && (<>
              {/* Chart */}
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={incomeChart} barGap={2} margin={{top:4,right:4,bottom:0,left:-16}}>
                  <XAxis dataKey="q" tick={{fontSize:10,fill:T.textMuted}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:T.textMuted}} axisLine={false} tickLine={false}/>
                  <RT formatter={(v,n)=>[`${v} Md€`, n==="CA"?"Chiffre d'affaires":"Résultat net"]}
                    contentStyle={{fontFamily:"inherit",fontSize:11,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}}
                    cursor={{fill:T.border+"44"}}/>
                  <Bar dataKey="CA" fill={T.accent} radius={[4,4,0,0]} opacity={.85}/>
                  <Bar dataKey="Net" fill={T.accent} radius={[4,4,0,0]} opacity={.4}/>
                  <Legend iconSize={8} wrapperStyle={{fontSize:11,color:T.textSub}}/>
                </BarChart>
              </ResponsiveContainer>
              {/* Table */}
              <div style={{marginTop:14,overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr>
                      {["Trimestre","Chiffre d'affaires","Marge brute","EBITDA","Résultat net","Marge nette"].map(h=>(
                        <th key={h} style={{textAlign:"right",padding:"6px 10px",color:T.textMuted,fontWeight:500,fontSize:11,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {income.slice(0,6).map((q,i)=>(
                      <tr key={i} style={{background:i%2===0?T.bg+"00":T.border+"22"}}>
                        <td style={{padding:"8px 10px",color:T.textSub,fontFamily:"'DM Mono',monospace",fontSize:11,whiteSpace:"nowrap"}}>{q.date?.slice(0,7)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{fmt(q.revenue)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.accent}}>{fmtPct(q.grossProfitRatio)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{fmt(q.ebitda)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:q.netIncome>=0?"#7DB068":"#C07070"}}>{fmt(q.netIncome)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.accent}}>{fmtPct(q.netIncomeRatio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>)}

            {/* BALANCE */}
            {caTab==="balance" && balance.length>0 && (
              <div>
                {balance.slice(0,4).map((b,i)=>(
                  <div key={i} style={{marginBottom:i<balance.length-1?20:0}}>
                    <div style={{fontSize:12,color:T.textSub,fontFamily:"'DM Mono',monospace",marginBottom:10,padding:"4px 10px",background:T.bg,borderRadius:6,display:"inline-block"}}>{b.date?.slice(0,7)}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                      {/* ACTIF */}
                      <div>
                        <div style={{fontSize:11,color:T.accent,textTransform:"uppercase",letterSpacing:".07em",padding:"0 0 6px 10px",marginBottom:4,borderBottom:`1px solid ${T.border}`}}>Actif</div>
                        {[
                          {l:"Cash & équivalents",v:b.cashAndCashEquivalents},
                          {l:"Créances clients",v:b.netReceivables},
                          {l:"Stocks",v:b.inventory},
                          {l:"Total actif courant",v:b.totalCurrentAssets,bold:true},
                          {l:"Immobilisations nettes",v:b.propertyPlantEquipmentNet},
                          {l:"Goodwill & intangibles",v:(b.goodwill||0)+(b.intangibleAssets||0)},
                          {l:"Total actifs",v:b.totalAssets,bold:true,accent:true},
                        ].map(row=>(
                          <div key={row.l} className="mr" style={{paddingLeft:10,paddingRight:10}}>
                            <span style={{color:row.bold?T.text:T.textSub,fontWeight:row.bold?600:400}}>{row.l}</span>
                            <span style={{fontFamily:"'DM Mono',monospace",fontWeight:row.bold?600:400,color:row.accent?T.accent:T.text}}>{fmt(row.v)}</span>
                          </div>
                        ))}
                      </div>
                      {/* PASSIF */}
                      <div style={{borderLeft:`1px solid ${T.border}`,paddingLeft:16}}>
                        <div style={{fontSize:11,color:T.accent,textTransform:"uppercase",letterSpacing:".07em",padding:"0 0 6px 0",marginBottom:4,borderBottom:`1px solid ${T.border}`}}>Passif & Capitaux propres</div>
                        {[
                          {l:"Dettes court terme",v:b.shortTermDebt},
                          {l:"Dettes fournisseurs",v:b.accountPayables},
                          {l:"Total passif courant",v:b.totalCurrentLiabilities,bold:true},
                          {l:"Dettes long terme",v:b.longTermDebt},
                          {l:"Total dettes",v:b.totalDebt,bold:true},
                          {l:"Capitaux propres",v:b.totalStockholdersEquity,bold:true,accent:true},
                          {l:"Total passif+fonds propres",v:b.totalLiabilitiesAndStockholdersEquity,bold:true},
                        ].map(row=>(
                          <div key={row.l} className="mr" style={{paddingRight:10}}>
                            <span style={{color:row.bold?T.text:T.textSub,fontWeight:row.bold?600:400}}>{row.l}</span>
                            <span style={{fontFamily:"'DM Mono',monospace",fontWeight:row.bold?600:400,color:row.accent?T.accent:T.text}}>{fmt(row.v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CASHFLOW */}
            {caTab==="cashflow" && cashflow.length>0 && (
              <div>
                {cashflow.slice(0,4).map((cf,i)=>(
                  <div key={i} style={{marginBottom:i<cashflow.length-1?20:0}}>
                    <div style={{fontSize:12,color:T.textSub,fontFamily:"'DM Mono',monospace",marginBottom:10,padding:"4px 10px",background:T.bg,borderRadius:6,display:"inline-block"}}>{cf.date?.slice(0,7)}</div>
                    {[
                      {l:"💼 Cash flow opérationnel",v:cf.operatingCashFlow,bold:true},
                      {l:"Dépréciation & amortissement",v:cf.depreciationAndAmortization},
                      {l:"Variation du BFR",v:cf.changeInWorkingCapital},
                      {l:"🏗 Capex (investissements)",v:cf.capitalExpenditure,bold:true},
                      {l:"Acquisitions",v:cf.acquisitionsNet},
                      {l:"💰 Free Cash Flow",v:cf.freeCashFlow,bold:true,accent:true},
                      {l:"Dividendes versés",v:cf.dividendsPaid},
                      {l:"Rachats d'actions",v:cf.commonStockRepurchased},
                      {l:"Variation nette de cash",v:cf.netChangeInCash,bold:true},
                    ].map(row=>(
                      <div key={row.l} className="mr">
                        <span style={{color:row.bold?T.text:T.textSub,fontWeight:row.bold?600:400}}>{row.l}</span>
                        <span style={{fontFamily:"'DM Mono',monospace",fontWeight:row.bold?600:400,
                          color:row.accent?T.accent:(row.v>=0?"#7DB068":"#C07070")}}>
                          {fmt(row.v)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PEERS */}
          {peers.length>0 && (
            <div style={{...C,marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Comparaison avec les pairs</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr>
                      {["Entreprise","Cours","Variation","Capitalisation","PER","Beta"].map(h=>(
                        <th key={h} style={{textAlign:"right",padding:"6px 10px",color:T.textMuted,fontWeight:500,fontSize:11,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Current company first */}
                    <tr style={{background:T.accent+"18"}}>
                      <td style={{padding:"8px 10px",fontWeight:600,color:T.accent}}>{company.symbol} ★</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.accent}}>{fmtRaw(company.price)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:company.changesPercentage>=0?"#7DB068":"#C07070"}}>{company.changesPercentage>=0?"+":""}{fmtRaw(company.changesPercentage)}%</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{fmt(company.mktCap)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{company.pe?fmtRaw(company.pe,1)+"×":"—"}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{company.beta?fmtRaw(company.beta,2):"—"}</td>
                    </tr>
                    {peers.map((p,i)=>(
                      <tr key={i} style={{background:i%2===0?T.bg+"00":T.border+"22",cursor:"pointer"}} onClick={()=>loadCompany(p.symbol)}>
                        <td style={{padding:"8px 10px",color:T.textSub}}>{p.symbol}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{fmtRaw(p.price)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:p.changesPercentage>=0?"#7DB068":"#C07070"}}>{p.changesPercentage>=0?"+":""}{fmtRaw(p.changesPercentage)}%</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{fmt(p.mktCap)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{p.pe?fmtRaw(p.pe,1)+"×":"—"}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{p.beta?fmtRaw(p.beta,2):"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{fontSize:11,color:T.textMuted,marginTop:8}}>💡 Clique sur un pair pour charger son analyse</div>
            </div>
          )}

          {/* ── AI */}
          <div style={{...C}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>Analyse simplifiée par IA</div>
            <div style={{fontSize:12,color:T.textMuted,marginBottom:14}}>Choisis le document financier à analyser</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {id:"resultats",l:"📊 Compte de résultat"},
                {id:"bilan",l:"🏦 Bilan"},
                {id:"cashflow",l:"💰 Flux de trésorerie"},
              ].map(b=>(
                <button key={b.id} className={`ab${aiScope===b.id&&aiText?" on":""}`}
                  onClick={()=>analyze(b.id)} disabled={aiLoading}>
                  {aiLoading&&aiScope===b.id?(<><span className="dt">●</span><span className="dt">●</span><span className="dt">●</span></>):b.l}
                </button>
              ))}
            </div>
            {aiText?(
              <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14,marginTop:14}}>
                {aiText.split("\n").filter(l=>l.trim()).map((line,i)=>(
                  <div key={i} style={{padding:"9px 12px",marginBottom:5,background:i%2===0?T.surface:T.bg,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,lineHeight:1.7,color:T.text}}>
                    {line}
                  </div>
                ))}
              </div>
            ):(
              <div style={{marginTop:12,padding:14,background:T.bg,border:`1px dashed ${T.border}`,borderRadius:10,fontSize:13,color:T.textMuted,textAlign:"center"}}>
                Clique sur un bouton pour analyser les données financières
              </div>
            )}
          </div>

          <div style={{marginTop:14,fontSize:11,color:T.textMuted,textAlign:"center"}}>
            Données Financial Modeling Prep · Ceci n'est pas un conseil en investissement
          </div>
        </>
      )}
    </div>
  );
}
