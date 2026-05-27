import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RT,
  ResponsiveContainer, Cell, ComposedChart, Area,
} from "recharts";

const FMP_KEY = "s0BLKiROWmOfW3hanrhkAkIKKNl5Wo7L";
const FMP  = (p) => `/api/fmp?path=${encodeURIComponent(p)}`;
const FMP4 = (p) => `/api/fmp?path=${encodeURIComponent("v4/" + p)}`;

/* ══ INDICES ══ */
const INDICES = {
  "CAC 40":           ["MC.PA","TTE.PA","SAN.PA","BNP.PA","AIR.PA","OR.PA","SU.PA","RI.PA","DG.PA","KER.PA","BN.PA","ACA.PA","GLE.PA","RMS.PA","VIE.PA","CS.PA","ORA.PA","CAP.PA","ML.PA","EN.PA"],
  "S&P 500 — Tech":   ["AAPL","MSFT","NVDA","GOOGL","META","AMZN","TSM","AVGO","ORCL","AMD"],
  "S&P 500 — Finance":["JPM","V","MA","BAC","WFC","GS","MS","BLK","AXP","C"],
  "S&P 500 — Santé":  ["LLY","JNJ","UNH","ABBV","MRK","TMO","ABT","DHR","PFE","AMGN"],
  "DAX":              ["SAP","SIE.DE","ALV.DE","MBG.DE","BMW.DE","DTE.DE","BAYN.DE","DBK.DE","MUV2.DE","BAS.DE"],
};

/* ══ BRAND THEMES (dark, immersif — page détail uniquement) ══ */
const BRAND_THEMES = {
  "MC.PA":  {accent:"#C9A455",bg:"#0B0806",surface:"#160F08",border:"#332010",text:"#F0E6D0",textSub:"#9A8468",textMuted:"#5A4030",inspiration:"Toile Monogram LV"},
  "RMS.PA": {accent:"#E8692A",bg:"#0C0806",surface:"#180E08",border:"#3A1A08",text:"#F5E8DC",textSub:"#B07848",textMuted:"#6A3820",inspiration:"Cuir Saddle Hermès"},
  "KER.PA": {accent:"#9060E0",bg:"#0A0810",surface:"#120E1C",border:"#281840",text:"#E8E0F5",textSub:"#887098",textMuted:"#483860",inspiration:"Gucci Verde"},
  "OR.PA":  {accent:"#C0809A",bg:"#0C0808",surface:"#180E0E",border:"#381820",text:"#F5E8EC",textSub:"#A07080",textMuted:"#603040",inspiration:"Or Rose L'Oréal"},
  "AAPL":   {accent:"#555555",bg:"#F5F5F7",surface:"#FFFFFF",border:"#D8D8DC",text:"#1D1D1F",textSub:"#6E6E73",textMuted:"#AEAEB2",inspiration:"Apple minimaliste"},
  "MSFT":   {accent:"#00A4EF",bg:"#040810",surface:"#080E18",border:"#101C30",text:"#DCF0FF",textSub:"#607080",textMuted:"#304050",inspiration:"Windows Blue"},
  "NVDA":   {accent:"#76B900",bg:"#060A04",surface:"#0C1008",border:"#1A2A08",text:"#E8F5D8",textSub:"#608040",textMuted:"#304020",inspiration:"NVIDIA Green"},
  "GOOGL":  {accent:"#4285F4",bg:"#060810",surface:"#0C1018",border:"#182030",text:"#E0ECFF",textSub:"#607090",textMuted:"#303850",inspiration:"Google Blue"},
  "META":   {accent:"#0082FB",bg:"#04080E",surface:"#080E18",border:"#102030",text:"#D8ECFF",textSub:"#507090",textMuted:"#283848",inspiration:"Meta Blue"},
  "AMZN":   {accent:"#FF9900",bg:"#080604",surface:"#120E08",border:"#301C08",text:"#FFF0D8",textSub:"#A07838",textMuted:"#604820",inspiration:"Amazon Orange"},
  "TTE.PA": {accent:"#EF2E24",bg:"#0A0404",surface:"#160808",border:"#300C0C",text:"#FFE8E8",textSub:"#A06060",textMuted:"#603030",inspiration:"Rouge TotalEnergies"},
  "BN.PA":  {accent:"#0057A8",bg:"#04080E",surface:"#080E18",border:"#101E30",text:"#D8ECFF",textSub:"#486888",textMuted:"#243450",inspiration:"Bleu Danone"},
  "JPM":    {accent:"#006FA6",bg:"#04080C",surface:"#080E14",border:"#10202A",text:"#D0E8F5",textSub:"#486878",textMuted:"#243440",inspiration:"JPMorgan Navy"},
  "DEFAULT":{accent:"#3B6FD4",bg:"#060810",surface:"#0A0E18",border:"#141E30",text:"#DCF0FF",textSub:"#507090",textMuted:"#28384A",inspiration:"Thème générique"},
};

function getTheme(ticker) {
  if (!ticker) return BRAND_THEMES["DEFAULT"];
  const t = BRAND_THEMES[ticker.toUpperCase()];
  if (t) return t;
  const hash = ticker.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const hue = (hash*47)%360;
  return {accent:`hsl(${hue},55%,55%)`,bg:`hsl(${hue},20%,5%)`,surface:`hsl(${hue},18%,8%)`,border:`hsl(${hue},20%,16%)`,text:`hsl(${hue},20%,92%)`,textSub:`hsl(${hue},15%,55%)`,textMuted:`hsl(${hue},12%,30%)`,inspiration:"Thème généré"};
}

/* ══ HOME THEME — clair, beige/blanc ══ */
const HT = {
  bg:       "#F7F4EF",   // beige très doux
  surface:  "#FFFFFF",
  surfaceAlt:"#F0EDE8",
  border:   "#E2DDD6",
  text:     "#1A1714",
  textSub:  "#7A7268",
  textMuted:"#B0A898",
  accent:   "#2C4A7C",   // bleu marine élégant
  accentSoft:"#EBF0FA",
  font:     "'Cormorant Garamond', 'Georgia', serif",
  fontSans: "'DM Sans', 'Helvetica Neue', sans-serif",
  fontMono: "'DM Mono', monospace",
};

/* ══ FORMAT ══ */
const fmt  = (n,d=1)=>{if(n==null||isNaN(n))return"—";const a=Math.abs(n);if(a>=1e12)return(n/1e12).toFixed(d)+"T";if(a>=1e9)return(n/1e9).toFixed(d)+"Md";if(a>=1e6)return(n/1e6).toFixed(d)+"M";return(+n).toFixed(d);};
const fmtP = (n)=>n==null||isNaN(n)?"—":(n*100).toFixed(1)+"%";
const fmtR = (n,d=2)=>n==null||isNaN(n)?"—":(+n).toFixed(d);

/* ══ GEO ══ */
const GEO_KW={asia:["asia","china","japan","korea","india","southeast","pacific","hong kong","singapore","taiwan","apac"],usa:["united states","north america","americas","canada","usa","us ","u.s."],europe:["europe","germany","france","uk","britain","italy","spain","emea","netherlands","switzerland","nordic"],latam:["latin america","brazil","mexico","south america"],middle:["middle east","africa","mea","gulf","saudi","uae"],other:["other","rest of","worldwide"]};
const GEO_LABELS={asia:"Asie / Pacifique",usa:"Amériques",europe:"Europe",latam:"Amér. latine",middle:"MO & Afrique",other:"Autres"};
const GEO_COLORS={asia:"#F59E0B",usa:"#3B82F6",europe:"#10B981",latam:"#EC4899",middle:"#F97316",other:"#8B5CF6"};
function classifyGeo(name){const low=(name||"").toLowerCase();for(const[key,kws]of Object.entries(GEO_KW)){if(kws.some(k=>low.includes(k)))return key;}return"other";}
const SHAPES={northAmerica:"80,32 188,26 228,54 234,84 220,124 198,150 176,160 150,150 124,134 96,122 70,100 60,70 66,44",southAmerica:"187,164 214,160 234,175 240,205 232,240 214,265 188,273 162,260 149,234 146,202 154,178",europe:"304,54 350,46 374,54 382,72 368,90 342,97 313,92 298,76 296,59",africa:"296,104 374,96 404,114 414,150 412,194 388,240 357,257 321,257 289,236 268,198 266,156 278,122",middleEast:"378,110 415,104 430,118 425,145 400,155 375,148 364,132",asia:"375,48 455,38 535,42 594,57 625,84 622,125 604,155 558,170 512,175 464,170 418,160 388,136 370,104 362,72",japan:"590,110 606,104 618,118 612,138 598,144 583,134 582,118",oceania:"538,188 614,180 650,198 652,228 622,242 567,239 533,222"};
const S2G={northAmerica:"usa",southAmerica:"latam",europe:"europe",africa:"middle",middleEast:"middle",asia:"asia",japan:"asia",oceania:"other"};

/* ══ APP ══ */
export default function App() {
  const [page,      setPage]     = useState("home");
  const [homeData,  setHomeData] = useState({});
  const [homeLoad,  setHomeLoad] = useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,     setQuery]    = useState("");
  const [results,   setResults]  = useState([]);
  const [company,   setCompany]  = useState(null);
  const [income,    setIncome]   = useState([]);
  const [balance,   setBalance]  = useState([]);
  const [cashflow,  setCashflow] = useState([]);
  const [metrics,   setMetrics]  = useState([]);
  const [geoRaw,    setGeoRaw]   = useState([]);
  const [peers,     setPeers]    = useState([]);
  const [detailLoad,setDetailLoad]=useState(false);
  const [caTab,     setCaTab]    = useState("income");
  const [ratioTab,  setRatioTab] = useState("per");
  const [hovG,      setHovG]     = useState(null);
  const [tip,       setTip]      = useState(null);
  const [aiText,    setAiText]   = useState("");
  const [aiLoad,    setAiLoad]   = useState(false);
  const [aiScope,   setAiScope]  = useState(null);
  const debounce=useRef(null);
  const mapRef=useRef(null);
  const T = company ? getTheme(company.symbol) : BRAND_THEMES["DEFAULT"];

  /* ── LOAD HOME */
  useEffect(()=>{
    if(page!=="home"||Object.keys(homeData).length>0)return;
    (async()=>{
      setHomeLoad(true);
      const result={};
      for(const[index,tickers]of Object.entries(INDICES)){
        try{
          const r=await fetch(FMP(`quote/${tickers.join(",")}&`));
          const d=await r.json();
          if(!Array.isArray(d)){result[index]=[];continue;}
          result[index]=d.filter(q=>q&&q.symbol).sort((a,b)=>(b.marketCap||0)-(a.marketCap||0)).map(q=>({symbol:q.symbol,name:q.name,mktCap:q.marketCap,price:q.price,change:q.changesPercentage}));
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
    setPage("detail");setDetailLoad(true);
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
    }catch{}
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
  const getFill=id=>{const g=geoByShape(id);if(!g)return T.surface+"55";return hovG&&S2G[hovG]===g.id?g.color:g.color+"55";};
  const getStr=id=>{const g=geoByShape(id);if(!g)return T.border+"55";return hovG&&S2G[hovG]===g.id?g.color:T.border+"66";};
  const onMove=(e,id)=>{const g=geoByShape(id);if(!g)return;setHovG(id);const rect=mapRef.current?.getBoundingClientRect();if(rect)setTip({x:e.clientX-rect.left,y:e.clientY-rect.top,g});};
  const onLeave=()=>{setHovG(null);setTip(null);};

  /* ── RATIO CHARTS */
  const ratioCharts={
    per:   metrics.slice(0,12).reverse().map(m=>({q:m.date?.slice(0,7),v:m.peRatio?+(+m.peRatio).toFixed(1):null})).filter(d=>d.v&&d.v>0&&d.v<500),
    marge: income.slice(0,8).reverse().map(q=>({q:q.date?.slice(0,7),v:q.netIncomeRatio?+(q.netIncomeRatio*100).toFixed(2):null})),
    roe:   metrics.slice(0,12).reverse().map(m=>({q:m.date?.slice(0,7),v:m.roe?+(m.roe*100).toFixed(2):null})).filter(d=>d.v),
    fcf:   cashflow.slice(0,8).reverse().map(cf=>({q:cf.date?.slice(0,7),v:cf.freeCashFlow?+(cf.freeCashFlow/1e9).toFixed(2):null})),
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
      geo:geoAgg.length>0?`Explique la répartition géographique de ${company.companyName} : ${geoAgg.map(g=>`${g.name} ${g.pct}%`).join(", ")}. Risques et opportunités ? 4 bullet points.`:`Données non disponibles.`,
    };
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,messages:[{role:"user",content:P[scope]}]})});
      const d=await res.json();setAiText(d.content?.[0]?.text||"Indisponible.");
    }catch{setAiText("• Erreur de connexion.");}
    setAiLoad(false);
  };

  const incomeChart=income.slice(0,6).reverse().map(q=>({q:q.date?.slice(0,7)||"",CA:q.revenue?+(q.revenue/1e9).toFixed(2):0,Net:q.netIncome?+(q.netIncome/1e9).toFixed(2):0}));
  const DC={background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:20};

  /* ── LOGO COMPONENT */
  const Logo=({symbol,size=52})=>{
    const [err,setErr]=useState(false);
    const initials=symbol.replace(".PA","").replace(".DE","").slice(0,2).toUpperCase();
    const hash=symbol.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
    const colors=["#2C4A7C","#7C2C4A","#2C7C4A","#4A2C7C","#7C4A2C","#2C6A7C"];
    const bg=colors[hash%colors.length];
    if(err)return(
      <div style={{width:size,height:size,borderRadius:12,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.28,fontWeight:700,color:"#fff",fontFamily:HT.fontSans,flexShrink:0}}>
        {initials}
      </div>
    );
    return(
      <div style={{width:size,height:size,borderRadius:12,background:"#fff",border:`1px solid ${HT.border}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
        <img src={`https://financialmodelingprep.com/image-stock/${symbol}.png`} alt={symbol} style={{width:size-8,height:size-8,objectFit:"contain"}} onError={()=>setErr(true)}/>
      </div>
    );
  };

  const isHome = page==="home";

  return(
    <div style={{fontFamily:HT.fontSans,minHeight:"100vh",background:isHome?HT.bg:T.bg,color:isHome?HT.text:T.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} input{font-family:inherit}
        .tab{padding:5px 11px;border-radius:7px;border:none;background:transparent;font-family:inherit;font-size:11px;cursor:pointer;transition:all .15s;white-space:nowrap;color:${T.textSub}}
        .tab.on{background:${T.accent};color:${T.bg};font-weight:600}
        .ab{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border:1px solid ${T.border};color:${T.textSub};background:transparent;border-radius:8px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;white-space:nowrap}
        .ab:hover,.ab.on{background:${T.accent};color:${T.bg};border-color:${T.accent}} .ab:disabled{opacity:.35;cursor:wait}
        .mr{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid ${T.border};font-size:12px}
        .mr:last-child{border-bottom:none}
        .sr-home{padding:10px 14px;cursor:pointer;font-size:13px;transition:background .1s;color:${HT.text};border-bottom:1px solid ${HT.border}}
        .sr-home:hover{background:${HT.accentSoft}}
        .sr-detail{padding:9px 14px;cursor:pointer;font-size:13px;transition:background .1s;color:${T.text};border-bottom:1px solid ${T.border}}
        .sr-detail:hover{background:${T.border}44}
        .shape{transition:fill .18s;cursor:crosshair}
        .logo-tile{cursor:pointer;border-radius:14px;transition:transform .2s,box-shadow .2s;background:#fff;border:1px solid ${HT.border};padding:16px 10px 12px;display:flex;flex-direction:column;align-items:center;gap:8px}
        .logo-tile:hover{transform:translateY(-3px);box-shadow:0 8px 24px ${HT.border}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pu{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .dt{animation:pu 1.2s ease-in-out infinite;color:${T.accent}} .dt:nth-child(2){animation-delay:.2s} .dt:nth-child(3){animation-delay:.4s}
        .fadein{animation:fadeUp .3s ease-out}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{border-radius:2px;background:${isHome?HT.border:T.border}}
      `}</style>

      {/* ══ HEADER ══ */}
      <div style={{position:"sticky",top:0,zIndex:100,backdropFilter:"blur(16px)",background:isHome?HT.surface+"EE":T.bg+"EE",borderBottom:`1px solid ${isHome?HT.border:T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,height:56,maxWidth:1280,margin:"0 auto",padding:"0 24px"}}>
          {page==="detail"&&(
            <button onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,color:T.textSub,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              ← Marchés
            </button>
          )}
          <div style={{fontFamily:HT.font,fontSize:20,fontWeight:500,color:isHome?HT.accent:T.accent,letterSpacing:".5px"}}>
            ✦ Analyse Fondamentale
          </div>
          <div style={{flex:1}}/>
          {/* SEARCH */}
          <div style={{position:"relative"}}>
            {!searchOpen?(
              <button onClick={()=>setSearchOpen(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 16px",background:isHome?HT.accentSoft:"transparent",border:`1px solid ${isHome?HT.accent+"44":T.border}`,borderRadius:20,color:isHome?HT.accent:T.textSub,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>
                🔍 Rechercher une action
              </button>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8,background:isHome?HT.surface:T.surface,border:`1.5px solid ${isHome?HT.accent:T.accent}`,borderRadius:10,padding:"6px 14px",minWidth:300}}>
                <span style={{fontSize:13,color:isHome?HT.textSub:T.textSub}}>🔍</span>
                <input autoFocus value={query} onChange={e=>onSearch(e.target.value)} placeholder="Entreprise ou ticker…" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:13,color:isHome?HT.text:T.text,caretColor:isHome?HT.accent:T.accent}}/>
                <button onClick={()=>{setSearchOpen(false);setQuery("");setResults([]);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:isHome?HT.textSub:T.textSub}}>✕</button>
              </div>
            )}
            {results.length>0&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,width:320,background:isHome?HT.surface:T.surface,border:`1px solid ${isHome?HT.border:T.border}`,borderRadius:12,zIndex:200,overflow:"hidden",boxShadow:"0 8px 32px #00000018"}}>
                {results.map(r=>(
                  <div key={r.symbol} className={isHome?"sr-home":"sr-detail"} onClick={()=>loadDetail(r.symbol)} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><span style={{fontWeight:600}}>{r.name}</span><span style={{fontSize:11,color:isHome?HT.textSub:T.textSub,marginLeft:8}}>{r.symbol}</span></div>
                    <span style={{fontSize:10,background:isHome?HT.accentSoft:T.border,color:isHome?HT.accent:T.textSub,padding:"2px 8px",borderRadius:5,flexShrink:0,fontWeight:500}}>{r.exchangeShortName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ PAGE HOME ══ */}
      {page==="home"&&(
        <div style={{maxWidth:1280,margin:"0 auto",padding:"32px 24px"}} className="fadein">
          <div style={{marginBottom:36}}>
            <div style={{fontFamily:HT.font,fontSize:42,fontWeight:400,color:HT.text,letterSpacing:".3px",lineHeight:1.1,marginBottom:8}}>Marchés financiers</div>
            <div style={{fontSize:14,color:HT.textSub,fontWeight:400}}>Sélectionne une entreprise pour accéder à son analyse fondamentale complète</div>
          </div>

          {homeLoad&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:12,color:HT.textSub}}>
              <div style={{width:20,height:20,border:`2px solid ${HT.border}`,borderTopColor:HT.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
              <span style={{fontFamily:HT.font,fontSize:18}}>Chargement des marchés…</span>
            </div>
          )}

          {!homeLoad&&Object.entries(homeData).map(([index,companies])=>
            companies.length===0?null:(
            <div key={index} style={{marginBottom:44}}>
              {/* Index header */}
              <div style={{display:"flex",alignItems:"baseline",gap:16,marginBottom:18}}>
                <div style={{fontFamily:HT.font,fontSize:22,fontWeight:500,color:HT.text}}>{index}</div>
                <div style={{flex:1,height:1,background:HT.border,marginBottom:2}}/>
                <div style={{fontSize:11,color:HT.textMuted,fontFamily:HT.fontSans}}>{companies.length} entreprises · capitalisation décroissante</div>
              </div>
              {/* Grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:12}}>
                {companies.map((co,i)=>(
                  <div key={co.symbol} className="logo-tile" onClick={()=>loadDetail(co.symbol)} style={{opacity:i<3?1:i<8?.93:.84,position:"relative"}}>
                    {i<3&&(
                      <div style={{position:"absolute",top:7,right:8,fontSize:9,fontWeight:700,fontFamily:HT.fontMono,color:i===0?"#B8962E":i===1?"#9090A0":"#A06840"}}>
                        #{i+1}
                      </div>
                    )}
                    <Logo symbol={co.symbol} size={54}/>
                    <div style={{fontSize:11,fontWeight:600,color:HT.text,fontFamily:HT.fontMono,textAlign:"center",marginTop:2}}>
                      {co.symbol.replace(".PA","").replace(".DE","")}
                    </div>
                    <div style={{fontSize:9,color:HT.textMuted,textAlign:"center",fontFamily:HT.fontSans}}>{fmt(co.mktCap,0)}</div>
                    <div style={{fontSize:11,fontWeight:600,color:co.change>=0?"#2D7A50":"#C0392B",fontFamily:HT.fontMono}}>
                      {co.change>=0?"+":""}{fmtR(co.change,1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ PAGE DETAIL ══ */}
      {page==="detail"&&(
        <div style={{maxWidth:980,margin:"0 auto",padding:"24px 20px"}} className="fadein">
          {detailLoad&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:12,color:T.textSub}}>
              <div style={{width:20,height:20,border:`2px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
            </div>
          )}
          {!detailLoad&&company&&(<>
            {/* HEADER */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,flexWrap:"wrap",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                {company.image&&<img src={company.image} alt="" style={{width:48,height:48,borderRadius:12,objectFit:"contain",background:T.surface,border:`1px solid ${T.border}`,padding:4}}/>}
                <div>
                  <div style={{fontFamily:HT.font,fontSize:30,fontWeight:500,color:T.text,letterSpacing:".3px"}}>{company.companyName}</div>
                  <div style={{fontSize:11,color:T.textSub,marginTop:3,fontFamily:HT.fontMono}}>{company.symbol} · {company.exchangeShortName} · {company.sector}</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:28,fontWeight:600,fontFamily:HT.fontMono,color:T.accent}}>{fmtR(company.price)} {company.currency||"€"}</div>
                <div style={{fontSize:13,color:company.changesPercentage>=0?"#5CB87A":"#E07070",fontWeight:500,marginTop:3}}>{company.changesPercentage>=0?"+":""}{fmtR(company.changesPercentage)}% aujourd'hui</div>
              </div>
            </div>
            <div style={{fontSize:10,color:T.textMuted,marginBottom:18,letterSpacing:".07em",textTransform:"uppercase",fontFamily:HT.fontSans}}>✦ {getTheme(company.symbol).inspiration}</div>

            {/* KPIS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[{l:"Capitalisation",v:fmt(company.mktCap)},{l:"PER",v:company.pe?fmtR(company.pe,1)+"×":"—"},{l:"Dividende",v:company.lastDiv?fmtR(company.lastDiv)+" "+(company.currency||"€"):"—"},{l:"Beta",v:company.beta?fmtR(company.beta,2):"—"}].map(k=>(
                <div key={k.l} style={{...DC,padding:"14px 16px"}}>
                  <div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:5,fontFamily:HT.fontSans}}>{k.l}</div>
                  <div style={{fontSize:20,fontWeight:600,fontFamily:HT.fontMono,color:T.accent}}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* SECTIONS */}
            {[["États financiers","fin"],["Répartition géographique du CA","geo"],["Ratios clés — historique","ratio"]].map(([label,id])=>(
              <div key={id}>
                <div style={{display:"flex",alignItems:"center",gap:12,margin:"22px 0 12px"}}>
                  <div style={{flex:1,height:1,background:T.border}}/>
                  <div style={{fontSize:10,color:T.accent,fontWeight:500,textTransform:"uppercase",letterSpacing:".12em",whiteSpace:"nowrap",fontFamily:HT.fontSans}}>{label}</div>
                  <div style={{flex:1,height:1,background:T.border}}/>
                </div>

                {id==="fin"&&(
                  <div style={{...DC}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                      <div style={{fontSize:13,fontWeight:600}}>8 derniers trimestres</div>
                      <div style={{display:"flex",gap:3,background:T.bg,borderRadius:9,padding:3}}>
                        {[["income","Résultats"],["balance","Bilan"],["cashflow","Cash Flow"]].map(([t,l])=>(
                          <button key={t} className={`tab${caTab===t?" on":""}`} onClick={()=>setCaTab(t)}>{l}</button>
                        ))}
                      </div>
                    </div>
                    {caTab==="income"&&income.length>0&&(<>
                      <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={incomeChart} barGap={2} margin={{top:4,right:4,bottom:0,left:-16}}>
                          <XAxis dataKey="q" tick={{fontSize:9,fill:T.textMuted}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fontSize:9,fill:T.textMuted}} axisLine={false} tickLine={false}/>
                          <RT formatter={(v,n)=>[`${v} Md`,n==="CA"?"CA":"Résultat net"]} contentStyle={{fontFamily:HT.fontSans,fontSize:11,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}} cursor={{fill:T.border+"44"}}/>
                          <Bar dataKey="CA" fill={T.accent} radius={[4,4,0,0]} opacity={.85}/>
                          <Bar dataKey="Net" fill={T.accent} radius={[4,4,0,0]} opacity={.35}/>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{overflowX:"auto",marginTop:12}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                          <thead><tr>{["Trimestre","CA","Marge brute","EBITDA","Résultat net","Marge nette"].map(h=><th key={h} style={{textAlign:"right",padding:"6px 8px",color:T.textMuted,fontWeight:500,fontSize:10,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                          <tbody>{income.slice(0,6).map((q,i)=>(
                            <tr key={i} style={{background:i%2===0?"transparent":T.border+"22"}}>
                              <td style={{padding:"6px 8px",color:T.textSub,fontFamily:HT.fontMono,fontSize:10}}>{q.date?.slice(0,7)}</td>
                              <td style={{padding:"6px 8px",textAlign:"right",fontFamily:HT.fontMono,color:T.text}}>{fmt(q.revenue)}</td>
                              <td style={{padding:"6px 8px",textAlign:"right",fontFamily:HT.fontMono,color:T.accent}}>{fmtP(q.grossProfitRatio)}</td>
                              <td style={{padding:"6px 8px",textAlign:"right",fontFamily:HT.fontMono,color:T.text}}>{fmt(q.ebitda)}</td>
                              <td style={{padding:"6px 8px",textAlign:"right",fontFamily:HT.fontMono,color:q.netIncome>=0?"#5CB87A":"#E07070"}}>{fmt(q.netIncome)}</td>
                              <td style={{padding:"6px 8px",textAlign:"right",fontFamily:HT.fontMono,color:T.accent}}>{fmtP(q.netIncomeRatio)}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </>)}
                    {caTab==="balance"&&balance.length>0&&(
                      <div>{balance.slice(0,1).map((b,i)=>(
                        <div key={i}>
                          <div style={{fontSize:10,color:T.textSub,fontFamily:HT.fontMono,marginBottom:10,padding:"3px 8px",background:T.bg,borderRadius:5,display:"inline-block"}}>{b.date?.slice(0,7)}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                            <div>
                              <div style={{fontSize:9,color:T.accent,textTransform:"uppercase",letterSpacing:".07em",padding:"0 0 5px 6px",marginBottom:3,borderBottom:`1px solid ${T.border}`}}>Actif</div>
                              {[{l:"Cash",v:b.cashAndCashEquivalents},{l:"Créances",v:b.netReceivables},{l:"Stocks",v:b.inventory},{l:"Total actif courant",v:b.totalCurrentAssets,b:true},{l:"Immobilisations",v:b.propertyPlantEquipmentNet},{l:"Total actifs",v:b.totalAssets,b:true,a:true}].map(r=>(
                                <div key={r.l} className="mr" style={{paddingLeft:6}}>
                                  <span style={{color:r.b?T.text:T.textSub,fontWeight:r.b?600:400}}>{r.l}</span>
                                  <span style={{fontFamily:HT.fontMono,fontWeight:r.b?600:400,color:r.a?T.accent:T.text}}>{fmt(r.v)}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{borderLeft:`1px solid ${T.border}`,paddingLeft:14}}>
                              <div style={{fontSize:9,color:T.accent,textTransform:"uppercase",letterSpacing:".07em",padding:"0 0 5px 0",marginBottom:3,borderBottom:`1px solid ${T.border}`}}>Passif & Fonds propres</div>
                              {[{l:"Dettes CT",v:b.shortTermDebt},{l:"Fournisseurs",v:b.accountPayables},{l:"Total passif courant",v:b.totalCurrentLiabilities,b:true},{l:"Dettes LT",v:b.longTermDebt},{l:"Total dettes",v:b.totalDebt,b:true},{l:"Capitaux propres",v:b.totalStockholdersEquity,b:true,a:true}].map(r=>(
                                <div key={r.l} className="mr">
                                  <span style={{color:r.b?T.text:T.textSub,fontWeight:r.b?600:400}}>{r.l}</span>
                                  <span style={{fontFamily:HT.fontMono,fontWeight:r.b?600:400,color:r.a?T.accent:T.text}}>{fmt(r.v)}</span>
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
                          <div style={{fontSize:10,color:T.textSub,fontFamily:HT.fontMono,marginBottom:10,padding:"3px 8px",background:T.bg,borderRadius:5,display:"inline-block"}}>{cf.date?.slice(0,7)}</div>
                          {[{l:"💼 Cash flow opérationnel",v:cf.operatingCashFlow,b:true},{l:"Dépréciation",v:cf.depreciationAndAmortization},{l:"Variation BFR",v:cf.changeInWorkingCapital},{l:"🏗 Capex",v:cf.capitalExpenditure,b:true},{l:"💰 Free Cash Flow",v:cf.freeCashFlow,b:true,a:true},{l:"Dividendes versés",v:cf.dividendsPaid},{l:"Rachats d'actions",v:cf.commonStockRepurchased},{l:"Variation nette cash",v:cf.netChangeInCash,b:true}].map(r=>(
                            <div key={r.l} className="mr">
                              <span style={{color:r.b?T.text:T.textSub,fontWeight:r.b?600:400}}>{r.l}</span>
                              <span style={{fontFamily:HT.fontMono,fontWeight:r.b?600:400,color:r.a?T.accent:(r.v>=0?"#5CB87A":"#E07070")}}>{fmt(r.v)}</span>
                            </div>
                          ))}
                        </div>
                      ))}</div>
                    )}
                  </div>
                )}

                {id==="geo"&&(
                  <div style={{...DC}}>
                    {geoAgg.length>0?(<>
                      <div style={{position:"relative",marginBottom:12}} ref={mapRef}>
                        <svg width="100%" viewBox="0 0 680 280" style={{display:"block",borderRadius:10,background:T.bg}}>
                          {[60,120,180,240].map(y=><line key={y} x1="0" y1={y} x2="680" y2={y} stroke={T.border} strokeWidth=".4" strokeDasharray="5 12"/>)}
                          {[100,200,300,400,500,600].map(x=><line key={x} x1={x} y1="0" x2={x} y2="280" stroke={T.border} strokeWidth=".4" strokeDasharray="5 12"/>)}
                          {Object.entries(SHAPES).map(([sid,pts])=>(
                            <polygon key={sid} points={pts} fill={getFill(sid)} stroke={getStr(sid)} strokeWidth="1" className="shape" onMouseMove={e=>onMove(e,sid)} onMouseLeave={onLeave}/>
                          ))}
                        </svg>
                        {tip&&(<div style={{position:"absolute",left:Math.min(tip.x+12,(mapRef.current?.offsetWidth||400)-172),top:Math.max(tip.y-75,4),background:T.surface,border:`1.5px solid ${tip.g.color}`,borderRadius:10,padding:"9px 13px",pointerEvents:"none",zIndex:10,minWidth:155}}>
                          <div style={{fontSize:10,color:T.textSub}}>{tip.g.name}</div>
                          <div style={{fontSize:20,fontWeight:600,fontFamily:HT.fontMono,color:tip.g.color}}>{tip.g.pct}%</div>
                          <div style={{height:2,background:T.border,borderRadius:1,marginTop:5}}><div style={{height:2,width:`${tip.g.pct}%`,background:tip.g.color,borderRadius:1}}/></div>
                        </div>)}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {geoAgg.map(g=>(
                          <div key={g.id} style={{display:"flex",alignItems:"center",gap:9}}>
                            <div style={{width:8,height:8,borderRadius:2,background:g.color,flexShrink:0}}/>
                            <div style={{fontSize:11,color:T.textSub,width:160,flexShrink:0}}>{g.name}</div>
                            <div style={{flex:1,height:4,background:T.border,borderRadius:2}}><div style={{height:4,width:`${g.pct}%`,background:g.color,borderRadius:2,transition:"width .6s"}}/></div>
                            <div style={{fontSize:12,fontWeight:600,fontFamily:HT.fontMono,width:36,textAlign:"right",color:g.color}}>{g.pct}%</div>
                          </div>
                        ))}
                      </div>
                    </>):(<div style={{textAlign:"center",padding:"24px 0",color:T.textMuted,fontSize:12}}>📍 Données géographiques non disponibles.</div>)}
                  </div>
                )}

                {id==="ratio"&&(
                  <div style={{...DC}}>
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
                          <RT formatter={v=>[`${v}${["marge","roe"].includes(ratioTab)?"%":""}`,ratioLabels[ratioTab]]} contentStyle={{fontFamily:HT.fontSans,fontSize:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,color:T.text}} cursor={{stroke:T.border}}/>
                          <Area type="monotone" dataKey="v" stroke={T.accent} strokeWidth={2} fill="url(#gr)" dot={{fill:T.accent,strokeWidth:0,r:3}} activeDot={{r:4,fill:T.accent}}/>
                        </ComposedChart>
                      </ResponsiveContainer>
                    ):(<div style={{textAlign:"center",padding:"24px 0",color:T.textMuted,fontSize:12}}>Données insuffisantes.</div>)}
                  </div>
                )}
              </div>
            ))}

            {/* PEERS */}
            {peers.length>0&&(
              <div style={{...DC,marginTop:14}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Pairs du secteur</div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr>{["","Cours","Variation","Capitalisation","PER","Beta"].map(h=><th key={h} style={{textAlign:"right",padding:"5px 7px",color:T.textMuted,fontWeight:500,fontSize:10,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
                  <tbody>
                    <tr style={{background:T.accent+"18"}}>
                      <td style={{padding:"6px 7px",fontWeight:600,color:T.accent,fontFamily:HT.fontMono,fontSize:11}}>{company.symbol} ★</td>
                      {[fmtR(company.price),`${company.changesPercentage>=0?"+":""}${fmtR(company.changesPercentage)}%`,fmt(company.mktCap),company.pe?fmtR(company.pe,1)+"×":"—",company.beta?fmtR(company.beta,2):"—"].map((v,i)=>(
                        <td key={i} style={{padding:"6px 7px",textAlign:"right",fontFamily:HT.fontMono,color:i===1?(company.changesPercentage>=0?"#5CB87A":"#E07070"):T.accent,fontSize:11}}>{v}</td>
                      ))}
                    </tr>
                    {peers.map((p,i)=>(
                      <tr key={i} style={{cursor:"pointer",background:i%2===0?"transparent":T.border+"22"}} onClick={()=>loadDetail(p.symbol)}>
                        <td style={{padding:"6px 7px",color:T.textSub,fontFamily:HT.fontMono,fontSize:11}}>{p.symbol}</td>
                        {[fmtR(p.price),`${p.changesPercentage>=0?"+":""}${fmtR(p.changesPercentage)}%`,fmt(p.mktCap),p.pe?fmtR(p.pe,1)+"×":"—",p.beta?fmtR(p.beta,2):"—"].map((v,i2)=>(
                          <td key={i2} style={{padding:"6px 7px",textAlign:"right",fontFamily:HT.fontMono,color:i2===1?(p.changesPercentage>=0?"#5CB87A":"#E07070"):T.text,fontSize:11}}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{fontSize:10,color:T.textMuted,marginTop:6}}>💡 Clique sur un pair pour charger son analyse</div>
              </div>
            )}

            {/* AI */}
            <div style={{...DC,marginTop:14}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>Analyse simplifiée par IA</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:12}}>Choisis le sujet à analyser</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {[{id:"resultats",l:"📊 Résultats"},{id:"bilan",l:"🏦 Bilan"},{id:"cashflow",l:"💰 Cash Flow"},{id:"geo",l:"🌍 Géographie"}].map(b=>(
                  <button key={b.id} className={`ab${aiScope===b.id&&aiText?" on":""}`} onClick={()=>analyze(b.id)} disabled={aiLoad}>
                    {aiLoad&&aiScope===b.id?(<><span className="dt">●</span><span className="dt">●</span><span className="dt">●</span></>):b.l}
                  </button>
                ))}
              </div>
              {aiText?(
                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:12}}>
                  {aiText.split("\n").filter(l=>l.trim()).map((line,i)=>(
                    <div key={i} style={{padding:"8px 12px",marginBottom:4,background:i%2===0?T.surface:T.bg,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,lineHeight:1.7,color:T.text}}>{line}</div>
                  ))}
                </div>
              ):(
                <div style={{marginTop:10,padding:12,background:T.bg,border:`1px dashed ${T.border}`,borderRadius:9,fontSize:12,color:T.textMuted,textAlign:"center"}}>Clique sur un bouton pour obtenir une analyse</div>
              )}
            </div>
            <div style={{marginTop:14,fontSize:10,color:T.textMuted,textAlign:"center",fontFamily:HT.fontSans}}>
              Données Financial Modeling Prep · Actualisation journalière · Ceci n'est pas un conseil en investissement
            </div>
          </>)}
        </div>
      )}
    </div>
  );
}
