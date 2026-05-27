const FMP  = (p) => `/api/fmp?path=${encodeURIComponent(p.replace(/[&?]+$/, ''))}`;
const FMP4 = (p) => `/api/fmp?path=${encodeURIComponent("v4/" + p.replace(/[&?]+$/, ''))}`;
