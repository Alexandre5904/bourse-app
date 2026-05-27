import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RT,
  ResponsiveContainer, Cell, ComposedChart, Area,
} from "recharts";

const FMP_KEY = "s0BLKiROWmOfW3hanrhkAkIKKNl5Wo7L";
const FMP  = (p) => `https://financialmodelingprep.com/api/v3/${p}&apikey=${FMP_KEY}`;
const FMP4 = (p) => `https://financialmodelingprep.com/api/v4/${p}&apikey=${FMP_KEY}`;

/* ══════════════════════════════════════════
   INDICES — tickers pré-chargés
   ══════════════════════════════════════════ */
const INDICES = {
  "CAC 40": ["MC.PA","TTE.PA","SAN.PA","BNP.PA","AIR.PA","OR.PA","SU.PA","RI.PA","DG.PA","KER.PA","BN.PA","ACA.PA","GLE.PA","RMS.PA","VIE.PA","CS.PA","ORA.PA","ENI.PA","CAP.PA","ML.PA"],
  "S&P 500 — Tech": ["AAPL","MSFT","NVDA","GOOGL","META","AMZN","TSM","AVGO","ORCL","AMD"],
  "S&P 500 — Finance": ["JPM","V","MA","BAC","WFC","GS","MS","BLK","AXP","C"],
  "S&P 500 — Santé": ["LLY","JNJ","UNH","ABBV","MRK","TMO","ABT","DHR","PFE","AMGN"],
  "DAX": ["SAP","SIE.DE","ALV.DE","MBG.DE","BMW.DE","DTE.DE","BAYN.DE","DBK.DE","MUV2.DE","BAS.DE"],
};

/* ══════════════════════════════════════════
   THEMES
   ══════════════════════════════════════════ */
const BRAND_THEMES = {
  "MC.PA":  {accent:"#C9A455",bg:"#0B0806",surface:"#160F08",border:"#332010",text:"#F0E6D0",textSub:"#9A8468",textMuted:"#5A4030",inspiration:"Toile Monogram LV"},
  "RMS.PA": {accent:"#E8692A",bg:"#0C0806",surface:"#180E08",border:"#3A1A08",text:"#F5E8DC",textSub:"#B07848",textMuted:"#6A3820",inspiration:"Cuir Saddle Hermès"},
  "KER.PA": {accent:"#9060E0",bg:"#0A0810",surface:"#120E1C",border:"#281840",text:"#E8E0F5",textSub:"#887098",textMuted:"#483860",inspiration:"Gucci Verde"},
  "OR.PA":  {accent:"#D4A0B0",bg:"#0C0808",surface:"#180E0E",border:"#381820",text:"#F5E8EC",textSub:"#A07080",textMuted:"#603040",inspiration:"Or Rose L'Oréal"},
  "AAPL":   {accent:"#E8E8E8",bg:"#000000",surface:"#0D0D0D",border:"#222222",text:"#F5F5F5",textSub:"#A0A0A0",textMuted:"#505050",inspiration:"Apple blanc minimaliste"},
  "MSFT":   {accent:"#00A4EF",bg:"#040810",surface:"#080E18",border:"#101C30",text:"#DCF0FF",textSub:"#607080",textMuted:"#304050",inspiration:"Windows Blue"},
  "NVDA":   {accent:"#76B900",bg:"#060A04",surface:"#0C1008",border:"#1A2A08",text:"#E8F5D8",textSub:"#608040",textMuted:"#304020",inspiration:"NVIDIA Green"},
  "GOOGL":  {accent:"#4285F4",bg:"#060810",surface:"#0C1018",border:"#182030",text:"#E0ECFF",textSub:"#607090",textMuted:"#303850",inspiration:"Google Blue"},
  "META":   {accent:"#0082FB",bg:"#04080E",surface:"#080E18",border:"#102030",text:"#D8ECFF",textSub:"#507090",textMuted:"#283848",inspiration:"Meta Blue"},
  "AMZN":   {accent:"#FF9900",bg:"#080604",surface:"#120E08",border:"#301C08",text:"#FFF0D8",textSub:"#A07838",textMuted:"#604820",inspiration:"Amazon Orange"},
  "TTE.PA": {accent:"#EF2E24",bg:"#0A0404",surface:"#160808",border:"#300C0C",text:"#FFE8E8",textSub:"#A06060",textMuted:"#603030",inspiration:"Rouge TotalEnergies"},
  "BN.PA":  {accent:"#0057A8",bg:"#04080E",surface:"#080E18",border:"#101E30",text:"#D8ECFF",textSub:"#486888",textMuted:"#243450",inspiration:"Bleu Danone"},
  "JPM":    {accent:"#006FA6",bg:"#04080C",surface:"#080E14",border:"#10202A",text:"#D0E8F5",textSub:"#486878",textMuted:"#243440",inspiration:"JPMorgan Navy"},
  "DEFAULT":{accent:"#60A5FA",bg:"#050810",surface:"#0A0E18",border:"#141E30",text:"#DCF0FF",textSub:"#507090",textMuted:"#28384A",inspiration:"Thème générique"},
};
const HOME_THEME = {bg:"#08090E",surface:"#0E1018",border:"#1A1E2C",text:"#E8ECFF",textSub:"#5A6080",accent:"#60A5FA",textMuted:"#2A2E40"};

function getTheme(ticker) {
  if (!ticker) return BRAND_THEMES["DEFAULT"];
  const t = BRAND_THEMES[ticker.toUpperCase()];
  if (t) return t;
  const hash = ticker.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const hue = (hash*47)%360;
  return {accent:`hsl(${hue},60%,62%)`,bg:`hsl(${hue},20%,4%)`,surface:`hsl(${hue},18%,7%)`,border:`hsl(${hue},20%,14%)`,text:`hsl(${hue},20%,92%)`,textSub:`hsl(${hue},15%,55%)`,textMuted:`hsl(${hue},12%,28%)`,inspiration:"Thème généré"};
}

/* ══════════════════════════════════════════
   FORMAT
   ══════════════════════════════════════════ */
const fmt  = (n,d=1)=>{ if(n==null||isNaN(n))return"—"; const a=Math.abs(n); if(a>=1e12)return(n/1e12).toFixed(d)+"T"; if(a>=1e9)return(n/1e9).toFixed(d)+"Md"; if(a>=1e6)return(n/1e6).toFixed(d)+"M"; return(+n).toFixed(d); };
const fmtP = (n)=>n==null||isNaN(n)?"—":(n*100).toFixed(1)+"%";
const fmtR = (n,d=2)=>n==null||isNaN(n)?"—":(+n).toFixed(d);

/* ══════════════════════════════════════════
   GEO
   ══════════════════════════════════════════ */
const GEO_KW = {
  asia:["asia","china","japan","korea","india","southeast","pacific","hong kong","singapore","taiwan","apac"],
  usa:["united states","north america","americas","canada","usa","us ","u.s."],
  europe:["europe","germany","france","uk","britain","italy","spain","emea","netherlands","switzerland","nordic"],
  latam:["latin america","brazil","mexico","south america"],
  middle:["middle east","africa","mea","gulf","saudi","uae"],
  other:["other","rest of","worldwide"],
};
const GEO_LABELS={asia:"Asie / Pacifique",usa:"Amériques",europe:"Europe",latam:"Amér. latine",middle:"MO & Afrique",other:"Autres"};
const GEO_COLORS={asia:"#F59E0B",usa:"#3B82F6",europe:"#10B981",latam:"#EC4899",middle:"#F97316",other:"#8B5CF6"};
function classifyGeo(name){const low=(name||"").toLowerCase();for(const[key,kws]of Object.entries(GEO_KW)){if(kws.some(k=>low.includes(k)))return key;}return"other";}

const SHAPES={northAmerica:"80,32 188,26 228,54 234,84 220,124 198,150 176,160 150,150 124,134 96,122 70,100 60,70 66,44",southAmerica:"187,164 214,160 234,175 240,205 232,240 214,265 188,273 162,260 149,234 146,202 154,178",europe:"304,54 350,46 374,54 382,72 368,90 342,97 313,92 298,76 296,59",africa:"296,104 374,96 404,114 414,150 412,194 388,240 357,257 321,257 289,236 268,198 266,156 278,122",middleEast:"378,110 415,104 430,118 425,145 400,155 375,148 364,132",asia:"375,48 455,38 535,42 594,57 625,84 622,125 604,155 558,170 512,175 464,170 418,160 388,136 370,104 362,72",japan:"590,110 606,104 618,118 612,138 598,144 583,134 582,118",oceania:"538,188 614,180 650,198 652,228 622,242 567,239 533,222"};
const S2G={northAmerica:"usa",southAmerica:"latam",europe:"europe",africa:"middle",middleEast:"middle",asia:"asia",japan:"asia",oceania:"other"};

/* ══════════════════════════════════════════
   APP
   ══════════════════════════════════════════ */
export default function App() {
  const [page,    setPage]    = useState("home");   // "home" | "detail"
  const [homeData,setHomeData]= useState({});       // { "CAC 40": [{symbol,name,mktCap,image,price,change},...] }
  const [homeLoad,setHomeLoad]= useState(false);
  const [selected,setSelected]= useState(null);     // ticker string
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  // Detail state
  const [company, setCompany] = useState(null);
  const [income,  setIncome]  = useState([]);
  const [balance, setBalance] = useState([]);
  const [cashflow,setCashflow]= useState([]);
  const [metrics, setMetrics] = useState([]);
  const [geoRaw,  setGeoRaw]  = useState([]);
  const [peers,   setPeers]   = useState([]);
  const [detailLoad,setDetailLoad]=useState(false);
  const [caTab,   setCaTab]   = useState("income");
  const [ratioTab,setRatioTab]= useState("per");
  const [hovG,    setHovG]    = useState(null);
  const [tip,     setTip]     = useState(null);
  const [aiText,  setAiText]  = useState("");
  const [aiLoad,  setAiLoad]  = useState(false);
  const [aiScope, setAiScope] = useState(null);
  const debounce=useRef(null);
  const mapRef=useRef(null);
  const T = company ? getTheme(company.symbol) : BRAND_THEMES["DEFAULT"];

  /* ── LOAD HOME */
  useEffect(()=>{
    if(page!=="home"||Object.keys(homeData).length>0) return;
    (async()=>{
      setHomeLoad(true);
      const result={};
      for(const[index,tickers]of Object.entries(INDICES)){
        try{
          const r=await fetch(FMP(`quote/${tickers.join(",")}&`));
          const d=await r.json();
          if(!Array.isArray(d)){result[index]=[];continue;}
          result[index]=d
            .filter(q=>q&&q.symbol)
            .sort((a,b)=>(b.marketCap||0)-(a.marketCap||0))
            .map(q=>({
              symbol:q.symbol,
              name:q.name,
              mktCap:q.marketCap,
              price:q.price,
              change:q.changesPercentage,
              image:`https://financialmodelingprep.com/image-stock/${q.symbol}.png`,
            }));
        }catch{result[index]=[];}
      }
      setHomeData(result);
      setHomeLoad(false);
    })();
  },[page]);

  /* ── SEARCH */
  const onSearch=val=>{
    setQuery(val);
    clearTimeout(debounce.current);
    if(!val||val.length<2){setResults([]);return;}
    debounce.current=setTimeout(async()=>{
      try{
        const r=await fetch(FMP(`search?query=${encodeURIComponent(val)}&limit=8&`));
        const d=await r.json();
        setResults((d||[]).filter(x=>x.exchangeShortName&&["NYSE","NASDAQ","EURONEXT","LSE","SWX"].includes(x.exchangeShortName)).slice(0,6));
      }catch{}
    },300);
  };

  /* ── LOAD DETAIL */
  const loadDetail=async ticker=>{
    setPage("detail"); setSelected(ticker); setDetailLoad(true);
    setCompany(null);setIncome([]);setBalance([]);setCashflow([]);setMetrics([]);setGeoRaw([]);setPeers([]);
    setAiText("");setAiScope(null);setQuery("");setResults([]);setSearchOpen(false);
    try{
      const [profR,quoteR,incR,balR,cfR,mR,geoR,peersR]=await Promise.all([
        fetch(FMP(`profile/${ticker}?`)),fetch(FMP(`quote/${ticker}?`)),
        fetch(FMP(`income-statement/${ticker}?period=quarter&limit=8&`)),
        fetch(FMP(`balance-sheet-statement/${ticker}?period=quarter&limit=4&`)),
        fetch(FMP(`cash-flow-statement/${ticker}?period=quarter&limit=4&`)),
        fetch(FMP(`key-metrics/${ticker}?period=quarter&limit=16&`)),
        fetch(FMP4(`revenue-geographic-segmentation?symbol=${ticker}&period=annual&`)),
        fetch(FMP(`stock_peers?symbol=${ticker}&`)),
      ]);
      const [prof,quote,inc,bal,cf,met,geo,peersData]=await Promise.all([profR.json(),quoteR.json(),incR.json(),balR.json(),cfR.json(),mR.json(),geoR.json(),peersR.json()]);
      if(!prof||prof.length===0)throw new Error();
      setCompany({...prof[0],...quote[0]});
      setIncome(inc||[]);setBalance(bal||[]);setCashflow(cf||[]);setMetrics(met||[]);
      setGeoRaw(Array.isArray(geo)?geo:(geo?[geo]:[]));
      const pList=(peersData?.peersList||[]).slice(0,4);
      if(pList.length>0){const pQ=await fetch(FMP(`quote/${pList.join(",")}&`));setPeers(await pQ.json()||[]);}
    }catch{setCompany(null);}
    setDetailLoad(false);
  };

  /* ── GEO */
  const geoAgg=(()=>{
    if(!geoRaw||geoRaw.length===0)return[];
    const latest=geoRaw[0];if(!latest)return[];
    const raw=latest.data||latest;
    const agg={};
    for(const[region,val]of Object.entries(raw||{})){const cat=classifyGeo(region);agg[cat]=(agg[cat]||0)+(val||0);}
    const total=Object.values(agg).reduce((s,v)=>s+v,0)||1;
    return Object.entries(agg).map(([k,v])=>({id:k,name:GEO_LABELS[k]||k,pct:Math.round(v/total*100),value:v,color:GEO_COLORS[k]||"#94a3b8"})).sort((a,b)=>b.pct-a.pct).filter(g=>g.pct>0);
  })();
  const geoByShape=id=>{const gid=S2G[id];return geoAgg.find(g=>g.id===gid);};
  const getFill=id=>{const g=geoByShape(id);if(!g)return T.surface+"44";return hovG&&S2G[hovG]===g.id?g.color:g.color+"55";};
  const getStr=id=>{const g=geoByShape(id);if(!g)return T.border+"44";return hovG&&S2G[hovG]===g.id?g.color:T.border+"55";};
  const onMove=(e,id)=>{const g=geoByShape(id);if(!g)return;setHovG(id);const rect=mapRef.current?.getBoundingClientRect();if(rect)setTip({x:e.clientX-rect.left,y:e.clientY-rect.top,g});};
  const onLeave=()=>{setHovG(null);setTip(null);};

  /* ── RATIO CHARTS */
  const ratioCharts={
    per:    metrics.slice(0,12).reverse().map(m=>({q:m.date?.slice(0,7),v:m.peRatio?+(+m.peRatio).toFixed(1):null})).filter(d=>d.v&&d.v>0&&d.v<500),
    marge:  income.slice(0,8).reverse().map(q=>({q:q.date?.slice(0,7),v:q.netIncomeRatio?+(q.netIncomeRatio*100).toFixed(2):null})),
    roe:    metrics.slice(0,12).reverse().map(m=>({q:m.date?.slice(0,7),v:m.roe?+(m.roe*100).toFixed(2):null})).filter(d=>d.v),
    fcf:    cashflow.slice(0,8).reverse().map(cf=>({q:cf.date?.slice(0,7),v:cf.freeCashFlow?+(cf.freeCashFlow/1e9).toFixed(2):null})),
  };
  const ratioLabels={per:"PER",marge:"Marge nette (%)",roe:"ROE (%)",fcf:"Free Cash Flow (Md)"};

  /* ── AI */
  const analyze=async scope=>{
    if(!company)return;
    setAiLoad(true);setAiText("");setAiScope(scope);
    const P={
      resultats:`Analyse pour un débutant les résultats de ${company.companyName}. CA : ${fmt(income[0]?.revenue)}, marge brute : ${fmtP(income[0]?.grossProfitRatio)}, résultat net : ${fmt(income[0]?.netIncome)}, EBITDA : ${fmt(income[0]?.ebitda)}. 4 bullet points sans jargon en français.`,
      bilan:`Explique simplement le bilan de ${company.companyName}. Actifs : ${fmt(balance[0]?.totalAssets)}, dettes : ${fmt(balance[0]?.totalDebt)}, capitaux propres : ${fmt(balance[0]?.totalStockholdersEquity)}, cash : ${fmt(balance[0]?.cashAndCashEquivalents)}. 4 bullet points.`,
      cashflow:`Explique le flux de trésorerie de ${company.companyName}. Cash flow opérationnel : ${fmt(cashflow[0]?.operatingCashFlow)}, capex : ${fmt(cashflow[0]?.capitalExpenditure)}, free cash flow : ${fmt(cashflow[0]?.freeCashFlow)}. 4 bullet points en français.`,
      geo:geoAgg.length>0?`Explique la répartition géographique de ${company.companyName} : ${geoAgg.map(g=>`${g.name} ${g.pct}%`).join(", ")}. Risques et opportunités ? 4 bullet points.`:`Pas de données géographiques disponibles.`,
    };
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,messages:[{role:"user",content:P[scope]}]})});
      const d=await res.json();setAiText(d.content?.[0]?.text||"Indisponible.");
    }catch{setAiText("• Erreur de connexion.");}
    setAiLoad(false);
  };

  const incomeChart=income.slice(0,6).reverse().map(q=>({q:q.date?.slice(0,7)||"",CA:q.revenue?+(q.revenue/1e9).toFixed(2):0,Net:q.netIncome?+(q.netIncome/1e9).toFixed(2):0}));
  const HT=HOME_THEME;
  const DC={background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:18};

  return(
    <div style={{fontFamily:"'DM Sans','Helvetica Neue',sans-serif",minHeight:"100vh",background:page==="home"?HT.bg:T.bg,color:page==="home"?HT.text:T.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} input{font-family:inherit}
        .tab{padding:5px 11px;border-radius:7px;border:none;background:transparent;font-family:inherit;font-size:11px;cursor:pointer;transition:all .15s;white-space:nowrap;color:${T.textSub}}
        .tab.on{background:${T.accent};color:${T.bg};font-weight:600}
        .ab{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border:1px solid ${T.border};color:${T.textSub};background:transparent;border-radius:8px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;white-space:nowrap}
        .ab:hover,.ab.on{background:${T.accent};color:${T.bg};border-color:${T.accent}} .ab:disabled{opacity:.35;cursor:wait}
        .mr{display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-bottom:1px solid ${T.border};font-size:12px}
        .mr:last-child{border-bottom:none} .mr:hover{background:${T.border}33;border-radius:6px}
        .sr{padding:9px 14px;cursor:pointer;font-size:13px;transition:background .1s}
        .shape{transition:fill .18s;cursor:crosshair}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pu{0%,100%{opacity:1}50%{opacity:.25}}
        .dt{animation:pu 1.2s ease-in-out infinite} .dt:nth-child(2){animation-delay:.2s} .dt:nth-child(3){animation-delay:.4s}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadeIn .25s ease-out}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{border-radius:2px}
        .logo-card{cursor:pointer;border-radius:12px;transition:transform .18s,box-shadow .18s,border-color .18s}
        .logo-card:hover{transform:scale(1.06) translateY(-2px)}
      `}</style>

      {/* ════════════════════════════════════════
          HEADER — commun aux deux pages
          ════════════════════════════════════════ */}
      <div style={{position:"sticky",top:0,zIndex:100,background:page==="home"?HT.bg+"EE":T.bg+"EE",backdropFilter:"blur(12px)",borderBottom:`1px solid ${page==="home"?HT.border:T.border}`,padding:"0 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,height:52,maxWidth:1200,margin:"0 auto"}}>
          {/* Back */}
          {page==="detail"&&(
            <button onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:T.border+"44",border:`1px solid ${T.border}`,borderRadius:8,color:T.textSub,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              ← Retour
            </button>
          )}
          {/* Title */}
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600,color:page==="home"?HT.accent:T.accent,letterSpacing:".2px"}}>
            ✦ Analyse Fondamentale
          </div>
          {page==="detail"&&company&&(
            <div style={{fontSize:12,color:T.textSub,fontFamily:"'DM Mono',monospace"}}>
              {company.symbol} · {company.companyName}
            </div>
          )}
          <div style={{flex:1}}/>

          {/* SEARCH TOGGLE */}
          <div style={{position:"relative"}}>
            {!searchOpen?(
              <button onClick={()=>setSearchOpen(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",background:page==="home"?HT.surface:T.surface,border:`1px solid ${page==="home"?HT.border:T.border}`,borderRadius:9,color:page==="home"?HT.textSub:T.textSub,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                🔍 <span>Rechercher une action</span>
              </button>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8,background:page==="home"?HT.surface:T.surface,border:`1.5px solid ${page==="home"?HT.accent:T.accent}`,borderRadius:10,padding:"6px 12px",minWidth:280}}>
                <span style={{fontSize:13,color:page==="home"?HT.textSub:T.textSub}}>🔍</span>
                <input autoFocus value={query} onChange={e=>onSearch(e.target.value)} placeholder="Entreprise ou ticker (Apple, MC.PA…)" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:13,color:page==="home"?HT.text:T.text,caretColor:page==="home"?HT.accent:T.accent}}/>
                <button onClick={()=>{setSearchOpen(false);setQuery("");setResults([]);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:page==="home"?HT.textSub:T.textSub}}>✕</button>
              </div>
            )}
            {results.length>0&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,width:320,background:page==="home"?HT.surface:T.surface,border:`1px solid ${page==="home"?HT.border:T.border}`,borderRadius:12,zIndex:200,overflow:"hidden",boxShadow:"0 8px 30px #00000060"}}>
                {results.map(r=>(
                  <div key={r.symbol} className="sr" onClick={()=>loadDetail(r.symbol)}
                    style={{color:page==="home"?HT.text:T.text,display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${page==="home"?HT.border:T.border}`}}>
                    <div><span style={{fontWeight:600}}>{r.name}</span><span style={{fontSize:11,color:page==="home"?HT.textSub:T.textSub,marginLeft:8}}>{r.symbol}</span></div>
                    <span style={{fontSize:11,color:page==="home"?HT.textSub:T.textSub,background:page==="home"?HT.border:T.border,padding:"2px 8px",borderRadius:6,flexShrink:0}}>{r.exchangeShortName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          PAGE HOME
          ════════════════════════════════════════ */}
      {page==="home"&&(
        <div style={{maxWidth:1200,margin:"0 auto",padding:"28px 20px"}} className="fadein">
          <div style={{marginBottom:28}}>
            <div style={{fontSize:28,fontFamily:"'Playfair Display',serif",fontWeight:600,color:HT.text,marginBottom:4}}>Marchés financiers</div>
            <div style={{fontSize:13,color:HT.textSub}}>Sélectionne une entreprise pour accéder à son analyse fondamentale complète</div>
          </div>

          {homeLoad&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",gap:12,color:HT.textSub}}>
              <div style={{width:18,height:18,border:`2px solid ${HT.border}`,borderTopColor:HT.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
              Chargement des marchés…
            </div>
          )}

          {!homeLoad&&Object.entries(homeData).map(([index,companies])=>(
            companies.length===0?null:(
            <div key={index} style={{marginBottom:36}}>
              {/* Index header */}
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:600,color:HT.text}}>{index}</div>
                <div style={{flex:1,height:1,background:HT.border}}/>
                <div style={{fontSize:11,color:HT.textSub}}>{companies.length} entreprises · triées par capitalisation</div>
              </div>

              {/* Logo grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:12}}>
                {companies.map((co,i)=>{
                  const rank=i;
                  const opacity=rank<3?1:rank<7?.92:rank<12?.82:.72;
                  const scale=rank<3?1:rank<7?.97:rank<12?.94:.91;
                  return(
                    <div key={co.symbol} className="logo-card"
                      onClick={()=>loadDetail(co.symbol)}
                      style={{
                        background:HT.surface,
                        border:`1px solid ${HT.border}`,
                        padding:"14px 10px 10px",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                        opacity,
                        boxShadow:rank<3?`0 0 0 1px ${HT.border}`:"none",
                      }}>
                      {/* Rank badge top 3 */}
                      {rank<3&&(
                        <div style={{position:"absolute",top:6,right:8,fontSize:9,color:rank===0?"#C9A455":rank===1?"#A0A0A0":"#CD7F32",fontWeight:600}}>
                          {rank===0?"★1":rank===1?"★2":"★3"}
                        </div>
                      )}
                      {/* Logo */}
                      <div style={{width:52,height:52,borderRadius:12,background:HT.bg,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,border:`1px solid ${HT.border}`}}>
                        <img
                          src={co.image}
                          alt={co.symbol}
                          style={{width:44,height:44,objectFit:"contain"}}
                          onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}
                        />
                        <div style={{display:"none",width:"100%",height:"100%",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:HT.textSub,fontFamily:"'DM Mono',monospace"}}>
                          {co.symbol.slice(0,2)}
                        </div>
                      </div>
                      {/* Ticker */}
                      <div style={{fontSize:10,fontWeight:600,color:HT.text,fontFamily:"'DM Mono',monospace",textAlign:"center",lineHeight:1.2}}>
                        {co.symbol.replace(".PA","").replace(".DE","")}
                      </div>
                      {/* Cap + variation */}
                      <div style={{fontSize:9,color:HT.textSub,textAlign:"center"}}>{fmt(co.mktCap,0)}</div>
                      <div style={{fontSize:10,fontWeight:600,color:co.change>=0?"#7DB068":"#C07070"}}>
                        {co.change>=0?"+":""}{fmtR(co.change,1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════
          PAGE DETAIL
          ════════════════════════════════════════ */}
      {page==="detail"&&(
        <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px"}} className="fadein">
          {detailLoad&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:12,color:T.textSub}}>
              <div style={{width:18,height:18,border:`2px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
              Chargement de l'analyse…
            </div>
          )}

          {!detailLoad&&company&&(<>
            {/* HEADER */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,flexWrap:"wrap",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {company.image&&<img src={company.image} alt="" style={{width:44,height:44,borderRadius:10,objectFit:"contain",background:T.surface,border:`1px solid ${T.border}`,padding:4}}/>}
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600}}>{company.companyName}</div>
                  <div style={{fontSize:11,color:T.textSub,marginTop:2,fontFamily:"'DM Mono',monospace"}}>{company.symbol} · {company.exchangeShortName} · {company.sector}</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24,fontWeight:600,fontFamily:"'DM Mono',monospace",color:T.accent}}>{fmtR(company.price)} {company.currency||"€"}</div>
                <div style={{fontSize:12,color:company.changesPercentage>=0?"#7DB068":"#C07070",fontWeight:500,marginTop:2}}>{company.changesPercentage>=0?"+":""}{fmtR(company.changesPercentage)}% aujourd'hui</div>
              </div>
            </div>
            <div style={{fontSize:10,color:T.textMuted,marginBottom:16,letterSpacing:".07em",textTransform:"uppercase"}}>✦ {getTheme(company.symbol).inspiration}</div>

            {/* KPIS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
              {[{l:"Capitalisation",v:fmt(company.mktCap)},{l:"PER",v:company.pe?fmtR(company.pe,1)+"×":"—"},{l:"Dividende",v:company.lastDiv?fmtR(company.lastDiv)+" "+(company.currency||"€"):"—"},{l:"Beta",v:company.beta?fmtR(company.beta,2):"—"}].map(k=>(
                <div key={k.l} style={{...DC,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{k.l}</div>
                  <div style={{fontSize:18,fontWeight:600,fontFamily:"'DM Mono',monospace",color:T.accent}}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* SÉPARATEUR */}
            {[["États financiers","fin"],["Répartition géographique du CA","geo"],["Ratios clés — historique","ratio"]].map(([label,id])=>(
              <div key={id}>
                <div style={{display:"flex",alignItems:"center",gap:10,margin:"20px 0 12px"}}>
                  <div style={{flex:1,height:1,background:T.border}}/>
                  <div style={{fontSize:10,color:T.accent,fontWeight:500,textTransform:"uppercase",letterSpacing:".1em",whiteSpace:"nowrap"}}>{label}</div>
                  <div style={{flex:1,height:1,background:T.border}}/>
                </div>

                {/* ÉTATS FINANCIERS */}
                {id==="fin"&&(
                  <div style={{...DC,marginBottom:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                      <div style={{fontSize:13,fontWeight:600}}>8 derniers trimestres</div>
                      <div style={{display:"flex",gap:3,background:T.bg,borderRadius:9,padding:3}}>
                        {[["income","Résultats"],["balance","Bilan"],["cashflow","Cash Flow"]].map(([t,l])=>(
                          <button key={t} className={`tab${caTab===t?" on":""}`} onClick={()=>setCaTab(t)}>{l}</button>
                        ))}
                      </div>
                    </div>
                    {caTab==="income"&&income.length>0&&(<>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={incomeChart} barGap={2} margin={{top:4,right:4,bottom:0,left:-16}}>
                          <XAxis dataKey="q" tick={{fontSize:9,fill:T.textMuted}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fontSize:9,fill:T.textMuted}} axisLine={false} tickLine={false}/>
                          <RT formatter={(v,n)=>[`${v} Md`,n==="CA"?"CA":"Résultat net"]} contentStyle={{fontFamily:"inherit",fontSize:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,color:T.text}} cursor={{fill:T.border+"44"}}/>
                          <Bar dataKey="CA" fill={T.accent} radius={[3,3,0,0]} opacity={.85}/>
                          <Bar dataKey="Net" fill={T.accent} radius={[3,3,0,0]} opacity={.35}/>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{overflowX:"auto",marginTop:10}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                          <thead><tr>{["Trimestre","CA","Marge brute","EBITDA","Résultat net","Marge nette"].map(h=><th key={h} style={{textAlign:"right",padding:"5px 7px",color:T.textMuted,fontWeight:500,fontSize:10,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                          <tbody>{income.slice(0,6).map((q,i)=>(
                            <tr key={i} style={{background:i%2===0?"transparent":T.border+"22"}}>
                              <td style={{padding:"6px 7px",color:T.textSub,fontFamily:"'DM Mono',monospace",fontSize:10}}>{q.date?.slice(0,7)}</td>
                              <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{fmt(q.revenue)}</td>
                              <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.accent}}>{fmtP(q.grossProfitRatio)}</td>
                              <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{fmt(q.ebitda)}</td>
                              <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:q.netIncome>=0?"#7DB068":"#C07070"}}>{fmt(q.netIncome)}</td>
                              <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.accent}}>{fmtP(q.netIncomeRatio)}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </>)}
                    {caTab==="balance"&&balance.length>0&&(
                      <div>{balance.slice(0,1).map((b,i)=>(
                        <div key={i}>
                          <div style={{fontSize:10,color:T.textSub,fontFamily:"'DM Mono',monospace",marginBottom:10,padding:"3px 8px",background:T.bg,borderRadius:5,display:"inline-block"}}>{b.date?.slice(0,7)}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                            <div>
                              <div style={{fontSize:9,color:T.accent,textTransform:"uppercase",letterSpacing:".07em",padding:"0 0 5px 6px",marginBottom:3,borderBottom:`1px solid ${T.border}`}}>Actif</div>
                              {[{l:"Cash",v:b.cashAndCashEquivalents},{l:"Créances",v:b.netReceivables},{l:"Stocks",v:b.inventory},{l:"Total actif courant",v:b.totalCurrentAssets,b:true},{l:"Immobilisations",v:b.propertyPlantEquipmentNet},{l:"Total actifs",v:b.totalAssets,b:true,a:true}].map(r=>(
                                <div key={r.l} className="mr" style={{paddingLeft:6}}>
                                  <span style={{color:r.b?T.text:T.textSub,fontWeight:r.b?600:400,fontSize:r.b?12:11}}>{r.l}</span>
                                  <span style={{fontFamily:"'DM Mono',monospace",fontWeight:r.b?600:400,color:r.a?T.accent:T.text,fontSize:12}}>{fmt(r.v)}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{borderLeft:`1px solid ${T.border}`,paddingLeft:12}}>
                              <div style={{fontSize:9,color:T.accent,textTransform:"uppercase",letterSpacing:".07em",padding:"0 0 5px 0",marginBottom:3,borderBottom:`1px solid ${T.border}`}}>Passif & Fonds propres</div>
                              {[{l:"Dettes CT",v:b.shortTermDebt},{l:"Fournisseurs",v:b.accountPayables},{l:"Total passif courant",v:b.totalCurrentLiabilities,b:true},{l:"Dettes LT",v:b.longTermDebt},{l:"Total dettes",v:b.totalDebt,b:true},{l:"Capitaux propres",v:b.totalStockholdersEquity,b:true,a:true}].map(r=>(
                                <div key={r.l} className="mr">
                                  <span style={{color:r.b?T.text:T.textSub,fontWeight:r.b?600:400,fontSize:r.b?12:11}}>{r.l}</span>
                                  <span style={{fontFamily:"'DM Mono',monospace",fontWeight:r.b?600:400,color:r.a?T.accent:T.text,fontSize:12}}>{fmt(r.v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}</div>
                    )}
                    {caTab==="cashflow"&&cashflow.length>0&&(
                      <div>{cashflow.slice(0,1).map((cf,i)=>(
                        <div key={i}>
                          <div style={{fontSize:10,color:T.textSub,fontFamily:"'DM Mono',monospace",marginBottom:10,padding:"3px 8px",background:T.bg,borderRadius:5,display:"inline-block"}}>{cf.date?.slice(0,7)}</div>
                          {[{l:"💼 Cash flow opérationnel",v:cf.operatingCashFlow,b:true},{l:"Dépréciation & amort.",v:cf.depreciationAndAmortization},{l:"Variation BFR",v:cf.changeInWorkingCapital},{l:"🏗 Capex",v:cf.capitalExpenditure,b:true},{l:"💰 Free Cash Flow",v:cf.freeCashFlow,b:true,a:true},{l:"Dividendes versés",v:cf.dividendsPaid},{l:"Rachats d'actions",v:cf.commonStockRepurchased},{l:"Variation nette cash",v:cf.netChangeInCash,b:true}].map(r=>(
                            <div key={r.l} className="mr">
                              <span style={{color:r.b?T.text:T.textSub,fontWeight:r.b?600:400}}>{r.l}</span>
                              <span style={{fontFamily:"'DM Mono',monospace",fontWeight:r.b?600:400,color:r.a?T.accent:(r.v>=0?"#7DB068":"#C07070")}}>{fmt(r.v)}</span>
                            </div>
                          ))}
                        </div>
                      ))}</div>
                    )}
                  </div>
                )}

                {/* GEO */}
                {id==="geo"&&(
                  <div style={{...DC,marginBottom:0}}>
                    {geoAgg.length>0?(<>
                      <div style={{position:"relative",marginBottom:12}} ref={mapRef}>
                        <svg width="100%" viewBox="0 0 680 280" style={{display:"block",borderRadius:10,background:T.bg}}>
                          {[60,120,180,240].map(y=><line key={y} x1="0" y1={y} x2="680" y2={y} stroke={T.border} strokeWidth=".4" strokeDasharray="5 12"/>)}
                          {[100,200,300,400,500,600].map(x=><line key={x} x1={x} y1="0" x2={x} y2="280" stroke={T.border} strokeWidth=".4" strokeDasharray="5 12"/>)}
                          {Object.entries(SHAPES).map(([id,pts])=>(
                            <polygon key={id} points={pts} fill={getFill(id)} stroke={getStr(id)} strokeWidth="1" className="shape" onMouseMove={e=>onMove(e,id)} onMouseLeave={onLeave}/>
                          ))}
                        </svg>
                        {tip&&(<div style={{position:"absolute",left:Math.min(tip.x+12,(mapRef.current?.offsetWidth||400)-170),top:Math.max(tip.y-75,4),background:T.surface,border:`1.5px solid ${tip.g.color}`,borderRadius:10,padding:"9px 13px",pointerEvents:"none",zIndex:10,minWidth:155}}>
                          <div style={{fontSize:10,color:T.textSub,marginBottom:1}}>{tip.g.name}</div>
                          <div style={{fontSize:20,fontWeight:600,fontFamily:"'DM Mono',monospace",color:tip.g.color}}>{tip.g.pct}%</div>
                          <div style={{height:2,background:T.border,borderRadius:1,marginTop:5}}><div style={{height:2,width:`${tip.g.pct}%`,background:tip.g.color,borderRadius:1}}/></div>
                        </div>)}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:7}}>
                        {geoAgg.map(g=>(
                          <div key={g.id} style={{display:"flex",alignItems:"center",gap:9}}>
                            <div style={{width:8,height:8,borderRadius:2,background:g.color,flexShrink:0}}/>
                            <div style={{fontSize:11,color:T.textSub,width:160,flexShrink:0}}>{g.name}</div>
                            <div style={{flex:1,height:4,background:T.border,borderRadius:2}}><div style={{height:4,width:`${g.pct}%`,background:g.color,borderRadius:2,transition:"width .6s"}}/></div>
                            <div style={{fontSize:12,fontWeight:600,fontFamily:"'DM Mono',monospace",width:36,textAlign:"right",color:g.color}}>{g.pct}%</div>
                          </div>
                        ))}
                      </div>
                    </>):(<div style={{textAlign:"center",padding:"24px 0",color:T.textMuted,fontSize:12}}>📍 Données géographiques non disponibles via l'API gratuite.</div>)}
                  </div>
                )}

                {/* RATIOS */}
                {id==="ratio"&&(
                  <div style={{...DC,marginBottom:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                      <div style={{fontSize:13,fontWeight:600}}>{ratioLabels[ratioTab]}</div>
                      <div style={{display:"flex",gap:3,background:T.bg,borderRadius:9,padding:3}}>
                        {[["per","PER"],["marge","Marge"],["roe","ROE"],["fcf","Free CF"]].map(([t,l])=>(
                          <button key={t} className={`tab${ratioTab===t?" on":""}`} onClick={()=>setRatioTab(t)}>{l}</button>
                        ))}
                      </div>
                    </div>
                    {ratioCharts[ratioTab].length>1?(
                      <ResponsiveContainer width="100%" height={140}>
                        <ComposedChart data={ratioCharts[ratioTab]} margin={{top:4,right:8,bottom:0,left:-10}}>
                          <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.accent} stopOpacity={.25}/><stop offset="95%" stopColor={T.accent} stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="q" tick={{fontSize:9,fill:T.textMuted}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fontSize:9,fill:T.textMuted}} axisLine={false} tickLine={false}/>
                          <RT formatter={v=>[`${v}${["marge","roe"].includes(ratioTab)?"%":""}`,ratioLabels[ratioTab]]} contentStyle={{fontFamily:"inherit",fontSize:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,color:T.text}} cursor={{stroke:T.border}}/>
                          <Area type="monotone" dataKey="v" stroke={T.accent} strokeWidth={2} fill="url(#gr)" dot={{fill:T.accent,strokeWidth:0,r:3}} activeDot={{r:4,fill:T.accent}}/>
                        </ComposedChart>
                      </ResponsiveContainer>
                    ):(<div style={{textAlign:"center",padding:"24px 0",color:T.textMuted,fontSize:12}}>Données insuffisantes pour ce ratio.</div>)}
                  </div>
                )}
              </div>
            ))}

            {/* PEERS */}
            {peers.length>0&&(
              <div style={{...DC,marginTop:14}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Pairs du secteur</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr>{["","Cours","Variation","Capitalisation","PER","Beta"].map(h=><th key={h} style={{textAlign:"right",padding:"5px 7px",color:T.textMuted,fontWeight:500,fontSize:10,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
                    <tbody>
                      <tr style={{background:T.accent+"18"}}>
                        <td style={{padding:"6px 7px",fontWeight:600,color:T.accent,fontSize:11}}>{company.symbol} ★</td>
                        <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.accent,fontSize:11}}>{fmtR(company.price)}</td>
                        <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:company.changesPercentage>=0?"#7DB068":"#C07070",fontSize:11}}>{company.changesPercentage>=0?"+":""}{fmtR(company.changesPercentage)}%</td>
                        <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text,fontSize:11}}>{fmt(company.mktCap)}</td>
                        <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text,fontSize:11}}>{company.pe?fmtR(company.pe,1)+"×":"—"}</td>
                        <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text,fontSize:11}}>{company.beta?fmtR(company.beta,2):"—"}</td>
                      </tr>
                      {peers.map((p,i)=>(
                        <tr key={i} style={{background:i%2===0?"transparent":T.border+"22",cursor:"pointer"}} onClick={()=>loadDetail(p.symbol)}>
                          <td style={{padding:"6px 7px",color:T.textSub,fontSize:11}}>{p.symbol}</td>
                          <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text,fontSize:11}}>{fmtR(p.price)}</td>
                          <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:p.changesPercentage>=0?"#7DB068":"#C07070",fontSize:11}}>{p.changesPercentage>=0?"+":""}{fmtR(p.changesPercentage)}%</td>
                          <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text,fontSize:11}}>{fmt(p.mktCap)}</td>
                          <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text,fontSize:11}}>{p.pe?fmtR(p.pe,1)+"×":"—"}</td>
                          <td style={{padding:"6px 7px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text,fontSize:11}}>{p.beta?fmtR(p.beta,2):"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:5}}>💡 Clique sur un pair pour charger son analyse</div>
              </div>
            )}

            {/* AI */}
            <div style={{...DC,marginTop:14}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>Analyse simplifiée par IA</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>Choisis le sujet à analyser</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {[{id:"resultats",l:"📊 Résultats"},{id:"bilan",l:"🏦 Bilan"},{id:"cashflow",l:"💰 Cash Flow"},{id:"geo",l:"🌍 Géographie"}].map(b=>(
                  <button key={b.id} className={`ab${aiScope===b.id&&aiText?" on":""}`} onClick={()=>analyze(b.id)} disabled={aiLoad}>
                    {aiLoad&&aiScope===b.id?(<><span className="dt" style={{color:T.accent}}>●</span><span className="dt" style={{color:T.accent}}>●</span><span className="dt" style={{color:T.accent}}>●</span></>):b.l}
                  </button>
                ))}
              </div>
              {aiText?(
                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:12}}>
                  {aiText.split("\n").filter(l=>l.trim()).map((line,i)=>(
                    <div key={i} style={{padding:"8px 11px",marginBottom:4,background:i%2===0?T.surface:T.bg,border:`1px solid ${T.border}`,borderRadius:7,fontSize:12,lineHeight:1.7,color:T.text}}>{line}</div>
                  ))}
                </div>
              ):(
                <div style={{marginTop:10,padding:12,background:T.bg,border:`1px dashed ${T.border}`,borderRadius:9,fontSize:12,color:T.textMuted,textAlign:"center"}}>Clique sur un bouton pour obtenir une analyse</div>
              )}
            </div>

            <div style={{marginTop:12,fontSize:10,color:T.textMuted,textAlign:"center"}}>
              Données Financial Modeling Prep · Actualisation journalière · Ceci n'est pas un conseil en investissement
            </div>
          </>)}
        </div>
      )}
    </div>
  );
}
