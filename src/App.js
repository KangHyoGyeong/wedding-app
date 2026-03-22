import { useState, useEffect, useCallback, useRef } from "react";

// ── Storage ───────────────────────────────────────────────────
const STORAGE_KEY = "wedding-app-v2";
const REF_STORAGE_KEY = "wedding-ref-images";

async function loadData() {
  try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function saveData(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
async function loadRefImages() {
  try { const r = await window.storage.get(REF_STORAGE_KEY); return r ? JSON.parse(r.value) : {}; }
  catch { return {}; }
}
async function saveRefImages(data) {
  try { await window.storage.set(REF_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ── 디자인 토큰 ───────────────────────────────────────────────
const T = {
  primary:    "#1E6FD9",
  primaryDark:"#1558B0",
  primaryBg:  "#EBF3FF",
  primaryText:"#1558B0",
  accent:     "#4D9FFF",
  bg:         "#F6F8FC",
  card:       "#FFFFFF",
  border:     "#E4EAF5",
  borderMid:  "#C8D6EE",
  text:       "#111827",
  textSub:    "#6B7280",
  textMuted:  "#9CA3AF",
  red:        "#EF4444",
  redBg:      "#FEF2F2",
  orange:     "#F59E0B",
  orangeBg:   "#FFFBEB",
  green:      "#22C55E",
  greenBg:    "#F0FDF4",
  font:       "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', -apple-system, sans-serif",
};

const CAT_COLORS = {
  "예식장":"#1E6FD9","스드메":"#7C3AED","예물·예단":"#DB2777",
  "본식":"#0891B2","뷰티":"#EC4899","청첩장":"#D97706",
  "신혼여행":"#059669","이사":"#6B7280","기타":"#9CA3AF"
};
const PHASE_COLORS = {
  "1단계":"#1E6FD9","2단계":"#7C3AED","3단계":"#0891B2",
  "4단계":"#059669","5단계":"#D97706","6단계":"#DB2777",
  "7단계":"#EF4444","귀국 후":"#6B7280"
};
const REF_CATEGORIES = [
  { id:"concept",    label:"사진컨셉", icon:"📷" },
  { id:"invitation", label:"청첩장",  icon:"💌" },
  { id:"bride",      label:"신부헤메", icon:"👰" },
  { id:"groom",      label:"신랑헤메", icon:"🤵" },
];

// ── 초기 데이터 ───────────────────────────────────────────────
const WEDDING_DATE = new Date("2027-07-10");

const INITIAL_DISCUSSIONS = [
  { id:"date", title:"예식 기본 설정", icon:"📅", items:[
    {id:"d1",label:"예식 날짜 & 시간",options:["7월 초 (5~6일)","7월 중순 (12~13일)","7월 말 (19~20일)"],decided:null,note:""},
    {id:"d2",label:"하객 인원 규모",options:["소규모 80~100명","중규모 120~150명","대규모 200명+"],decided:null,note:""},
    {id:"d3",label:"예식 컨셉",options:["전통 + 모던 믹스","미니멀 웨딩","가든 하우스풍"],decided:null,note:""},
    {id:"d4",label:"주례 여부",options:["주례 있음","주례 없음 (자유 식순)","미정"],decided:null,note:""},
  ]},
  { id:"ring", title:"예물 & 예단", icon:"💍", items:[
    {id:"r1",label:"커플링 브랜드",options:["까르띠에","불가리","티파니","국내 브랜드"],decided:null,note:""},
    {id:"r2",label:"신부 예물",options:["커플링만","다이아 반지 별도","세트 구성"],decided:null,note:""},
    {id:"r3",label:"신랑 예물",options:["시계","반지","없음"],decided:null,note:""},
    {id:"r4",label:"예단 규모",options:["간소하게 (50만원 이하)","일반적 (100~200만원)","양가 협의 후"],decided:null,note:""},
    {id:"r5",label:"예단 전달 방식",options:["함 보내기","직접 방문 전달","생략"],decided:null,note:""},
  ]},
  { id:"house", title:"신혼집", icon:"🏠", items:[
    {id:"h1",label:"주거 형태",options:["매매","전세","월세"],decided:null,note:""},
    {id:"h2",label:"선호 지역 기준",options:["직장 접근성 우선","양가 중간 거리","학군 우선"],decided:null,note:""},
    {id:"h3",label:"혼수 가전 범위",options:["필수 가전만","필수 + 선택 가전","풀 세트"],decided:null,note:""},
  ]},
  { id:"honeymoon", title:"신혼여행", icon:"✈️", items:[
    {id:"t1",label:"목적지",options:["유럽 (500만원+)","몰디브/발리 (350~500만원)","일본 (150~250만원)","하와이 (400만원+)"],decided:null,note:""},
    {id:"t2",label:"기간",options:["5박 7일","7박 9일","그 이상"],decided:null,note:""},
    {id:"t3",label:"여행 스타일",options:["럭셔리 리조트","도시 관광","자연/액티비티"],decided:null,note:""},
  ]},
  { id:"sdme", title:"스드메 & 본식", icon:"📸", items:[
    {id:"s1",label:"스튜디오 촬영",options:["실내 스튜디오만","야외 촬영 포함","두 곳 모두"],decided:null,note:""},
    {id:"s2",label:"드레스 수량",options:["1벌","2벌 (본식 + 피로연)","3벌 이상"],decided:null,note:""},
    {id:"s3",label:"신랑 예복",options:["수트","턱시도","미정"],decided:null,note:""},
    {id:"s4",label:"사회자",options:["웨딩홀 전담 MC","지인","미정"],decided:null,note:""},
    {id:"s5",label:"축가",options:["지인","전문 가수","없음"],decided:null,note:""},
  ]},
  { id:"budget", title:"예산 분담", icon:"💰", items:[
    {id:"b1",label:"예식장 비용 부담",options:["남자 측","여자 측","반반","양가 협의"],decided:null,note:""},
    {id:"b2",label:"스드메 비용 부담",options:["신부 측","신랑 측","공동 부담"],decided:null,note:""},
    {id:"b3",label:"신혼집 보증금 부담",options:["남자 측","반반","각자 비율 협의"],decided:null,note:""},
    {id:"b4",label:"혼수 부담",options:["신부 측","신랑 측","공동 부담"],decided:null,note:""},
  ]},
  { id:"family", title:"양가 의례", icon:"👨‍👩‍👧", items:[
    {id:"f1",label:"상견례 장소",options:["고급 한식당","프라이빗 룸 레스토랑","호텔 식당"],decided:null,note:""},
    {id:"f2",label:"상견례 비용 부담",options:["남자 측","반반","여자 측"],decided:null,note:""},
    {id:"f3",label:"폐백 진행 여부",options:["진행","생략","간소화"],decided:null,note:""},
    {id:"f4",label:"함 보내기",options:["진행","생략"],decided:null,note:""},
    {id:"f5",label:"혼인신고 시기",options:["예식 전","예식 당일","예식 후"],decided:null,note:""},
  ]},
];

const INITIAL_BUDGET = [
  {id:"bg1",category:"예식장",label:"예식장 계약금",estimated:300,actual:null,paid:false},
  {id:"bg2",category:"예식장",label:"예식장 잔금",estimated:1150,actual:null,paid:false},
  {id:"bg3",category:"스드메",label:"스드메 계약금",estimated:100,actual:null,paid:false},
  {id:"bg4",category:"스드메",label:"스튜디오 촬영 잔금",estimated:150,actual:null,paid:false},
  {id:"bg5",category:"스드메",label:"드레스 대여 잔금",estimated:80,actual:null,paid:false},
  {id:"bg6",category:"스드메",label:"메이크업 잔금",estimated:50,actual:null,paid:false},
  {id:"bg7",category:"예물·예단",label:"커플링",estimated:80,actual:null,paid:false},
  {id:"bg8",category:"예물·예단",label:"예물 (시계·기타)",estimated:70,actual:null,paid:false},
  {id:"bg9",category:"예물·예단",label:"예단",estimated:100,actual:null,paid:false},
  {id:"bg10",category:"본식",label:"사회자",estimated:50,actual:null,paid:false},
  {id:"bg11",category:"본식",label:"축가·영상 촬영",estimated:80,actual:null,paid:false},
  {id:"bg12",category:"본식",label:"신랑 예복",estimated:50,actual:null,paid:false},
  {id:"bg13",category:"뷰티",label:"피부과 시술",estimated:30,actual:null,paid:false},
  {id:"bg14",category:"뷰티",label:"헤어 펌·염색",estimated:10,actual:null,paid:false},
  {id:"bg15",category:"청첩장",label:"청첩장 인쇄 + 모바일",estimated:30,actual:null,paid:false},
  {id:"bg16",category:"신혼여행",label:"항공권",estimated:150,actual:null,paid:false},
  {id:"bg17",category:"신혼여행",label:"숙소",estimated:100,actual:null,paid:false},
  {id:"bg18",category:"이사",label:"이사 비용",estimated:50,actual:null,paid:false},
  {id:"bg19",category:"기타",label:"예비비",estimated:290,actual:null,paid:false},
];

const INITIAL_TIMELINE = [
  {id:"tl1",phase:"1단계",label:"결혼 날짜 범위 확정",deadline:"2026-05-31",done:false},
  {id:"tl2",phase:"1단계",label:"상견례 예약 및 진행",deadline:"2026-06-30",done:false},
  {id:"tl3",phase:"1단계",label:"총 예산 양가 협의 확정",deadline:"2026-05-31",done:false},
  {id:"tl4",phase:"1단계",label:"웨딩박람회 방문",deadline:"2026-06-30",done:false},
  {id:"tl5",phase:"2단계",label:"로얄파크컨벤션 방문 상담",deadline:"2026-07-31",done:false},
  {id:"tl6",phase:"2단계",label:"예식장 최종 계약 및 계약금 납부",deadline:"2026-09-30",done:false},
  {id:"tl7",phase:"2단계",label:"스드메 패키지 계약",deadline:"2026-09-30",done:false},
  {id:"tl8",phase:"3단계",label:"예물 쇼핑",deadline:"2026-11-30",done:false},
  {id:"tl9",phase:"3단계",label:"신혼집 방향 결정",deadline:"2026-11-30",done:false},
  {id:"tl10",phase:"4단계",label:"신혼집 계약 완료",deadline:"2027-02-28",done:false},
  {id:"tl11",phase:"4단계",label:"청첩장 디자인 및 주문",deadline:"2027-02-28",done:false},
  {id:"tl12",phase:"4단계",label:"신혼여행 항공권·숙소 예약",deadline:"2027-02-28",done:false},
  {id:"tl13",phase:"5단계",label:"청첩장 발송",deadline:"2027-04-30",done:false},
  {id:"tl14",phase:"5단계",label:"웨딩 스튜디오 본촬영",deadline:"2027-04-30",done:false},
  {id:"tl15",phase:"5단계",label:"드레스 가봉 1차",deadline:"2027-04-30",done:false},
  {id:"tl16",phase:"6단계",label:"피부과 시술 완료",deadline:"2027-05-31",done:false},
  {id:"tl17",phase:"6단계",label:"드레스 가봉 2차 및 픽업",deadline:"2027-06-20",done:false},
  {id:"tl18",phase:"6단계",label:"웨딩홀 잔금 납부",deadline:"2027-06-30",done:false},
  {id:"tl19",phase:"6단계",label:"스드메 잔금 납부",deadline:"2027-06-30",done:false},
  {id:"tl20",phase:"7단계",label:"하객 안내 문자 발송",deadline:"2027-07-07",done:false},
  {id:"tl21",phase:"7단계",label:"웨딩홀 최종 미팅",deadline:"2027-07-07",done:false},
  {id:"tl22",phase:"귀국 후",label:"혼인신고",deadline:"2027-08-31",done:false},
];

// ── 유틸 ──────────────────────────────────────────────────────
function daysUntil(date) {
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return Math.ceil((d - now) / 86400000);
}
function fmtDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
}
function readFileAsDataURL(file) {
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(file); });
}
function resizeImage(dataUrl, maxW=1200) {
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      const ratio=Math.min(1,maxW/img.width);
      const c=document.createElement("canvas");
      c.width=img.width*ratio; c.height=img.height*ratio;
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL("image/jpeg",0.82));
    };
    img.src=dataUrl;
  });
}

// ── D-Day 카드 ────────────────────────────────────────────────
function DdayCard({ weddingDate }) {
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const diff = Math.ceil((weddingDate - now) / 86400000);
  const total = Math.ceil((weddingDate - new Date("2026-03-22")) / 86400000);
  const pct = Math.min(100, Math.max(0, ((total-diff)/total)*100));
  return (
    <div style={{ background:`linear-gradient(135deg,${T.primary} 0%,#3B82F6 100%)`, borderRadius:20, padding:"26px 28px", color:"#fff", position:"relative", overflow:"hidden", fontFamily:T.font }}>
      <div style={{ position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }}/>
      <div style={{ position:"absolute",bottom:-60,right:40,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)" }}/>
      <p style={{ margin:"0 0 4px",fontSize:10,opacity:.75,letterSpacing:2.5,textTransform:"uppercase",fontWeight:700 }}>Wedding Countdown</p>
      <div style={{ display:"flex",alignItems:"baseline",gap:6,margin:"0 0 2px" }}>
        <span style={{ fontSize:60,fontWeight:800,lineHeight:1 }}>{diff.toLocaleString()}</span>
        <span style={{ fontSize:18,opacity:.8,fontWeight:500 }}>일</span>
      </div>
      <p style={{ margin:"0 0 18px",fontSize:13,opacity:.7 }}>2027년 7월 10일 · 로얄파크컨벤션</p>
      <div style={{ background:"rgba(255,255,255,0.22)",borderRadius:100,height:5,overflow:"hidden" }}>
        <div style={{ width:`${pct.toFixed(1)}%`,height:"100%",background:"#fff",borderRadius:100,transition:"width 0.6s ease" }}/>
      </div>
      <p style={{ margin:"7px 0 0",fontSize:11,opacity:.6 }}>준비 기간 진행률 {pct.toFixed(1)}%</p>
    </div>
  );
}

// ── 진행률 링 ─────────────────────────────────────────────────
function ProgressRing({ value, max, size=64, stroke=5, color=T.primary }) {
  const r=(size-stroke)/2, circ=2*Math.PI*r, pct=max===0?0:value/max;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
    </svg>
  );
}

// ── 요약 카드 ─────────────────────────────────────────────────
function SummaryCards({ discussions, budget, timeline }) {
  const totalD=discussions.reduce((s,g)=>s+g.items.length,0);
  const doneD=discussions.reduce((s,g)=>s+g.items.filter(i=>i.decided!==null).length,0);
  const totalB=budget.reduce((s,b)=>s+b.estimated,0);
  const paidB=budget.reduce((s,b)=>s+(b.paid?(b.actual??b.estimated):0),0);
  const doneTl=timeline.filter(t=>t.done).length;
  const cards=[
    {label:"의논 완료",value:doneD,max:totalD,color:T.primary},
    {label:"타임라인",value:doneTl,max:timeline.length,color:"#7C3AED"},
    {label:"납부(만원)",value:Math.round(paidB/10000),max:Math.round(totalB/10000),color:"#059669"},
  ];
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
      {cards.map(c=>(
        <div key={c.label} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
          <div style={{ position:"relative" }}>
            <ProgressRing value={c.value} max={c.max} color={c.color}/>
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:c.color }}>
              {c.max===0?"0":Math.round((c.value/c.max)*100)}%
            </div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:17,fontWeight:700,color:T.text }}>{c.value.toLocaleString()}<span style={{ fontSize:11,color:T.textMuted }}>/{c.max}</span></div>
            <div style={{ fontSize:10,color:T.textMuted,marginTop:1 }}>{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 의논 탭 ───────────────────────────────────────────────────
function DiscussionTab({ discussions, onUpdate }) {
  const [activeGroup,setActiveGroup]=useState(discussions[0].id);
  const [editingNote,setEditingNote]=useState(null);
  const [noteVal,setNoteVal]=useState("");
  const group=discussions.find(g=>g.id===activeGroup);
  return (
    <div style={{ fontFamily:T.font }}>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:18 }}>
        {discussions.map(g=>{
          const done=g.items.filter(i=>i.decided!==null).length;
          const active=g.id===activeGroup;
          return (
            <button key={g.id} onClick={()=>setActiveGroup(g.id)} style={{
              padding:"6px 13px",borderRadius:100,border:`1.5px solid`,
              borderColor:active?T.primary:T.border,background:active?T.primary:T.card,
              color:active?"#fff":T.textSub,fontSize:12,fontWeight:600,cursor:"pointer",
              display:"flex",alignItems:"center",gap:5,fontFamily:T.font,transition:"all 0.15s"
            }}>
              <span>{g.icon}</span><span>{g.title}</span>
              <span style={{ background:active?"rgba(255,255,255,0.25)":T.primaryBg,color:active?"#fff":T.primaryText,borderRadius:100,padding:"1px 7px",fontSize:10 }}>{done}/{g.items.length}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {group.items.map(item=>(
          <div key={item.id} style={{ background:T.card,border:`1px solid ${item.decided!==null?T.primary:T.border}`,borderRadius:14,padding:"15px 16px",transition:"border-color 0.2s" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
              <p style={{ margin:0,fontSize:13,fontWeight:600,color:T.text }}>{item.label}</p>
              {item.decided!==null&&<span style={{ background:T.primaryBg,color:T.primaryText,fontSize:11,fontWeight:600,padding:"2px 9px",borderRadius:100 }}>결정 완료</span>}
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
              {item.options.map(opt=>{
                const sel=item.decided===opt;
                return (
                  <button key={opt} onClick={()=>onUpdate(group.id,item.id,"decided",sel?null:opt)} style={{
                    padding:"5px 13px",borderRadius:100,border:`1.5px solid`,
                    borderColor:sel?T.primary:T.border,background:sel?T.primary:"#FAFBFF",
                    color:sel?"#fff":T.textSub,fontSize:12,fontWeight:sel?600:400,
                    cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"
                  }}>{sel&&<span style={{marginRight:4}}>✓</span>}{opt}</button>
                );
              })}
            </div>
            {editingNote===item.id?(
              <div style={{ marginTop:10 }}>
                <textarea value={noteVal} onChange={e=>setNoteVal(e.target.value)} placeholder="메모를 입력하세요..."
                  style={{ width:"100%",minHeight:60,borderRadius:10,border:`1px solid ${T.border}`,padding:"8px 12px",fontSize:13,resize:"vertical",fontFamily:T.font,boxSizing:"border-box",outline:"none",color:T.text }}/>
                <div style={{ display:"flex",gap:8,marginTop:6 }}>
                  <button onClick={()=>{onUpdate(group.id,item.id,"note",noteVal);setEditingNote(null);}} style={{ padding:"5px 14px",background:T.primary,color:"#fff",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:T.font }}>저장</button>
                  <button onClick={()=>setEditingNote(null)} style={{ padding:"5px 14px",background:T.border,color:T.textSub,border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:T.font }}>취소</button>
                </div>
              </div>
            ):(
              <div>
                {item.note?(
                  <div onClick={()=>{setEditingNote(item.id);setNoteVal(item.note);}} style={{ background:"#F8FAFF",borderRadius:8,padding:"7px 11px",fontSize:12,color:T.textSub,cursor:"pointer",borderLeft:`3px solid ${T.accent}`,marginTop:10 }}>📝 {item.note}</div>
                ):(
                  <button onClick={()=>{setEditingNote(item.id);setNoteVal("");}} style={{ background:"none",border:"none",color:T.textMuted,fontSize:12,cursor:"pointer",padding:"4px 0",marginTop:6,fontFamily:T.font }}>+ 메모 추가</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 예산 탭 ───────────────────────────────────────────────────
function BudgetTab({ budget, onUpdate }) {
  const [editingId,setEditingId]=useState(null);
  const [editVal,setEditVal]=useState("");
  const categories=[...new Set(budget.map(b=>b.category))];
  const totalEst=budget.reduce((s,b)=>s+b.estimated,0);
  const totalAct=budget.reduce((s,b)=>s+(b.paid?(b.actual??b.estimated):0),0);
  const pctPaid=totalEst===0?0:(totalAct/totalEst)*100;
  return (
    <div style={{ fontFamily:T.font }}>
      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 20px",marginBottom:18 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}>
          <div>
            <p style={{ margin:"0 0 2px",fontSize:11,color:T.textMuted,fontWeight:500 }}>총 예상 예산</p>
            <p style={{ margin:0,fontSize:22,fontWeight:800,color:T.text }}>{Math.round(totalEst/10000).toLocaleString()}만원</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ margin:"0 0 2px",fontSize:11,color:T.textMuted,fontWeight:500 }}>납부 완료</p>
            <p style={{ margin:0,fontSize:22,fontWeight:800,color:T.primary }}>{Math.round(totalAct/10000).toLocaleString()}만원</p>
          </div>
        </div>
        <div style={{ background:T.border,borderRadius:100,height:7,overflow:"hidden" }}>
          <div style={{ width:`${pctPaid.toFixed(1)}%`,height:"100%",background:`linear-gradient(90deg,${T.primary},${T.accent})`,borderRadius:100,transition:"width 0.5s ease" }}/>
        </div>
        <p style={{ margin:"6px 0 0",fontSize:11,color:T.textMuted }}>납부율 {pctPaid.toFixed(1)}% · 잔여 {Math.round((totalEst-totalAct)/10000).toLocaleString()}만원</p>
      </div>
      {categories.map(cat=>{
        const items=budget.filter(b=>b.category===cat);
        const catEst=items.reduce((s,b)=>s+b.estimated,0);
        const catAct=items.reduce((s,b)=>s+(b.paid?(b.actual??b.estimated):0),0);
        const cc=CAT_COLORS[cat]||"#9CA3AF";
        return (
          <div key={cat} style={{ marginBottom:16 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                <div style={{ width:9,height:9,borderRadius:"50%",background:cc }}/>
                <span style={{ fontSize:13,fontWeight:700,color:T.text }}>{cat}</span>
              </div>
              <span style={{ fontSize:12,color:T.textMuted }}>{Math.round(catAct/10000)}/{Math.round(catEst/10000)}만원</span>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
              {items.map(item=>(
                <div key={item.id} style={{ background:T.card,border:`1px solid ${item.paid?cc+"40":T.border}`,borderRadius:12,padding:"11px 15px",display:"flex",alignItems:"center",gap:11 }}>
                  <button onClick={()=>onUpdate(item.id,"paid",!item.paid)} style={{ width:22,height:22,borderRadius:6,border:`2px solid`,flexShrink:0,borderColor:item.paid?T.primary:T.borderMid,background:item.paid?T.primary:T.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,transition:"all 0.2s" }}>{item.paid?"✓":""}</button>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:0,fontSize:13,fontWeight:500,color:item.paid?T.textMuted:T.text,textDecoration:item.paid?"line-through":"none" }}>{item.label}</p>
                    <p style={{ margin:"2px 0 0",fontSize:11,color:T.textMuted }}>예상 {item.estimated.toLocaleString()}만원</p>
                  </div>
                  {editingId===item.id?(
                    <div style={{ display:"flex",gap:6 }}>
                      <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder={item.estimated} style={{ width:80,padding:"4px 8px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,textAlign:"right",outline:"none",fontFamily:T.font,color:T.text }}/>
                      <button onClick={()=>{onUpdate(item.id,"actual",Number(editVal)||null);setEditingId(null);}} style={{ padding:"4px 10px",background:T.primary,color:"#fff",border:"none",borderRadius:8,fontSize:11,cursor:"pointer",fontWeight:600,fontFamily:T.font }}>저장</button>
                    </div>
                  ):(
                    <button onClick={()=>{setEditingId(item.id);setEditVal(item.actual??"");}} style={{ background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 10px",fontSize:12,color:item.actual?T.primary:T.textMuted,cursor:"pointer",fontWeight:item.actual?600:400,whiteSpace:"nowrap",fontFamily:T.font }}>{item.actual?`${item.actual.toLocaleString()}만원`:"금액 입력"}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 타임라인 탭 ───────────────────────────────────────────────
function TimelineTab({ timeline, onToggle }) {
  const phases=[...new Set(timeline.map(t=>t.phase))];
  return (
    <div style={{ fontFamily:T.font }}>
      {phases.map(phase=>{
        const items=timeline.filter(t=>t.phase===phase);
        const done=items.filter(t=>t.done).length;
        const color=PHASE_COLORS[phase]||"#9CA3AF";
        return (
          <div key={phase} style={{ marginBottom:22 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                <div style={{ width:3,height:18,borderRadius:2,background:color }}/>
                <span style={{ fontSize:13,fontWeight:700,color:T.text }}>{phase}</span>
              </div>
              <span style={{ fontSize:11,background:color+"18",color,borderRadius:100,padding:"2px 10px",fontWeight:600 }}>{done}/{items.length}</span>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
              {items.map(item=>{
                const days=daysUntil(item.deadline);
                const overdue=!item.done&&days<0;
                const urgent=!item.done&&days>=0&&days<=30;
                return (
                  <div key={item.id} onClick={()=>onToggle(item.id)} style={{ background:T.card,border:`1px solid`,borderColor:item.done?"#DCFCE7":overdue?T.redBg:T.border,borderRadius:12,padding:"10px 15px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",opacity:item.done?0.55:1,transition:"all 0.15s" }}>
                    <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid`,borderColor:item.done?"#22C55E":color,background:item.done?"#22C55E":T.card,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,color:"#fff",fontWeight:700,transition:"all 0.2s" }}>{item.done?"✓":""}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0,fontSize:13,fontWeight:500,color:item.done?T.textMuted:T.text,textDecoration:item.done?"line-through":"none" }}>{item.label}</p>
                      <p style={{ margin:"2px 0 0",fontSize:11,color:T.textMuted }}>마감 {fmtDate(item.deadline)}</p>
                    </div>
                    {!item.done&&<span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:100,flexShrink:0,background:overdue?T.redBg:urgent?T.orangeBg:"#F3F4F6",color:overdue?T.red:urgent?T.orange:T.textMuted }}>{overdue?`D+${Math.abs(days)}`:days===0?"오늘":`D-${days}`}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 레퍼런스 탭 ───────────────────────────────────────────────
function ReferenceTab({ refImages, onAddImage, onDeleteImage }) {
  const [activeCategory,setActiveCategory]=useState(REF_CATEGORIES[0].id);
  const [lightbox,setLightbox]=useState(null);
  const [uploading,setUploading]=useState(false);
  const fileInputRef=useRef(null);
  const cat=REF_CATEGORIES.find(c=>c.id===activeCategory);
  const images=refImages[activeCategory]||[];

  const handleFileChange=async(e)=>{
    const files=Array.from(e.target.files);
    if(!files.length)return;
    setUploading(true);
    try {
      for(const file of files){
        if(!file.type.startsWith("image/"))continue;
        let dataUrl=await readFileAsDataURL(file);
        if(file.size>2*1024*1024) dataUrl=await resizeImage(dataUrl,1200);
        const id=Date.now()+Math.random().toString(36).slice(2);
        await onAddImage(activeCategory,{id,src:dataUrl,name:file.name,addedAt:new Date().toISOString()});
      }
    } finally { setUploading(false); e.target.value=""; }
  };

  return (
    <div style={{ fontFamily:T.font }}>
      {/* 카테고리 탭 */}
      <div style={{ display:"flex",gap:8,marginBottom:18,overflowX:"auto",paddingBottom:2 }}>
        {REF_CATEGORIES.map(c=>{
          const cnt=(refImages[c.id]||[]).length;
          const active=c.id===activeCategory;
          return (
            <button key={c.id} onClick={()=>setActiveCategory(c.id)} style={{
              flexShrink:0,padding:"8px 16px",borderRadius:100,border:`1.5px solid`,
              borderColor:active?T.primary:T.border,background:active?T.primary:T.card,
              color:active?"#fff":T.textSub,fontSize:13,fontWeight:600,cursor:"pointer",
              fontFamily:T.font,display:"flex",alignItems:"center",gap:6,transition:"all 0.15s"
            }}>
              <span>{c.icon}</span><span>{c.label}</span>
              {cnt>0&&<span style={{ background:active?"rgba(255,255,255,0.25)":T.primaryBg,color:active?"#fff":T.primaryText,borderRadius:100,padding:"1px 7px",fontSize:11 }}>{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* 업로드 버튼 */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display:"none" }}/>
      <button onClick={()=>fileInputRef.current?.click()} disabled={uploading} style={{
        width:"100%",padding:"13px",borderRadius:14,
        border:`2px dashed ${uploading?T.primary:T.borderMid}`,
        background:uploading?T.primaryBg:T.card,
        color:T.primaryText,fontSize:13,fontWeight:600,cursor:uploading?"not-allowed":"pointer",
        marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
        fontFamily:T.font,transition:"all 0.15s"
      }}>
        {uploading?<><span style={{fontSize:16}}>⏳</span> 업로드 중...</>:<><span style={{fontSize:18,fontWeight:300}}>+</span> {cat.icon} {cat.label} 이미지 추가</>}
      </button>

      {/* 갤러리 */}
      {images.length===0?(
        <div style={{ textAlign:"center",padding:"48px 0",border:`1px dashed ${T.border}`,borderRadius:16 }}>
          <div style={{ fontSize:40,marginBottom:10 }}>{cat.icon}</div>
          <p style={{ color:T.textSub,fontSize:14,fontWeight:600,margin:"0 0 4px" }}>{cat.label} 레퍼런스가 없어요</p>
          <p style={{ color:T.textMuted,fontSize:12,margin:0 }}>위 버튼을 눌러 이미지를 추가해보세요</p>
        </div>
      ):(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
          {images.map(img=>(
            <div key={img.id} style={{ position:"relative",aspectRatio:"1",borderRadius:12,overflow:"hidden",background:T.border,cursor:"pointer" }}
              onClick={()=>setLightbox({src:img.src,id:img.id,catId:activeCategory})}>
              <img src={img.src} alt={img.name} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
            </div>
          ))}
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20 }}>
          <img src={lightbox.src} alt="" onClick={e=>e.stopPropagation()} style={{ maxWidth:"100%",maxHeight:"74vh",borderRadius:12,objectFit:"contain" }}/>
          <div style={{ display:"flex",gap:12,marginTop:20 }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setLightbox(null)} style={{ padding:"10px 24px",background:"rgba(255,255,255,0.12)",color:"#fff",border:"1.5px solid rgba(255,255,255,0.25)",borderRadius:100,fontSize:14,cursor:"pointer",fontWeight:500,fontFamily:T.font }}>닫기</button>
            <button onClick={()=>{onDeleteImage(lightbox.catId,lightbox.id);setLightbox(null);}} style={{ padding:"10px 24px",background:T.red,color:"#fff",border:"none",borderRadius:100,fontSize:14,cursor:"pointer",fontWeight:700,fontFamily:T.font }}>삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("home");
  const [discussions,setDiscussions]=useState(INITIAL_DISCUSSIONS);
  const [budget,setBudget]=useState(INITIAL_BUDGET);
  const [timeline,setTimeline]=useState(INITIAL_TIMELINE);
  const [refImages,setRefImages]=useState({});
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    Promise.all([loadData(),loadRefImages()]).then(([d,r])=>{
      if(d){ if(d.discussions)setDiscussions(d.discussions); if(d.budget)setBudget(d.budget); if(d.timeline)setTimeline(d.timeline); }
      if(r)setRefImages(r);
      setLoaded(true);
    });
  },[]);

  useEffect(()=>{ if(!loaded)return; saveData({discussions,budget,timeline}); },[discussions,budget,timeline,loaded]);

  const updateDiscussion=useCallback((groupId,itemId,field,value)=>{
    setDiscussions(prev=>prev.map(g=>g.id!==groupId?g:{...g,items:g.items.map(i=>i.id!==itemId?i:{...i,[field]:value})}));
  },[]);
  const updateBudget=useCallback((id,field,value)=>{ setBudget(prev=>prev.map(b=>b.id!==id?b:{...b,[field]:value})); },[]);
  const toggleTimeline=useCallback((id)=>{ setTimeline(prev=>prev.map(t=>t.id!==id?t:{...t,done:!t.done})); },[]);
  const addRefImage=useCallback(async(catId,img)=>{
    setRefImages(prev=>{ const next={...prev,[catId]:[...(prev[catId]||[]),img]}; saveRefImages(next); return next; });
  },[]);
  const deleteRefImage=useCallback((catId,imgId)=>{
    setRefImages(prev=>{ const next={...prev,[catId]:(prev[catId]||[]).filter(i=>i.id!==imgId)}; saveRefImages(next); return next; });
  },[]);

  const tabs=[
    {id:"home",label:"홈",icon:"🏠"},
    {id:"discussion",label:"의논",icon:"💬"},
    {id:"budget",label:"예산",icon:"💰"},
    {id:"timeline",label:"타임라인",icon:"📅"},
    {id:"reference",label:"레퍼런스",icon:"🖼️"},
  ];

  if(!loaded) return (
    <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:T.font }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36,marginBottom:12 }}>💍</div>
        <p style={{ color:T.textMuted,fontSize:14 }}>로딩 중...</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:480,margin:"0 auto",minHeight:"100vh",background:T.bg,fontFamily:T.font,position:"relative",paddingBottom:82 }}>

      {/* 헤더 */}
      <div style={{ padding:"18px 20px 14px",background:T.bg,position:"sticky",top:0,zIndex:10,borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <p style={{ margin:0,fontSize:10,color:T.textMuted,letterSpacing:2,textTransform:"uppercase",fontWeight:700 }}>Our Wedding</p>
            <h1 style={{ margin:0,fontSize:20,fontWeight:800,color:T.text }}>2027년 7월 💍</h1>
          </div>
          <div style={{ background:T.primaryBg,borderRadius:12,padding:"6px 14px",textAlign:"center" }}>
            <p style={{ margin:0,fontSize:10,color:T.primaryText,fontWeight:700 }}>D-day</p>
            <p style={{ margin:0,fontSize:18,fontWeight:800,color:T.primary }}>{daysUntil(WEDDING_DATE).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ padding:"18px 18px 0" }}>
        {tab==="home"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
            <DdayCard weddingDate={WEDDING_DATE}/>
            <SummaryCards discussions={discussions} budget={budget} timeline={timeline}/>
            <div>
              <h2 style={{ margin:"0 0 10px",fontSize:14,fontWeight:700,color:T.text }}>📌 곧 마감되는 항목</h2>
              <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                {timeline.filter(t=>!t.done&&daysUntil(t.deadline)<=60).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,5).map(item=>{
                  const days=daysUntil(item.deadline); const overdue=days<0;
                  return (
                    <div key={item.id} onClick={()=>toggleTimeline(item.id)} style={{ background:T.card,borderRadius:12,border:`1px solid ${overdue?T.red+"40":T.border}`,padding:"10px 15px",display:"flex",alignItems:"center",gap:11,cursor:"pointer" }}>
                      <div style={{ width:7,height:7,borderRadius:"50%",flexShrink:0,background:overdue?T.red:days<=14?T.orange:T.primary }}/>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0,fontSize:13,fontWeight:500,color:T.text }}>{item.label}</p>
                        <p style={{ margin:"2px 0 0",fontSize:11,color:T.textMuted }}>{fmtDate(item.deadline)} · {item.phase}</p>
                      </div>
                      <span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:100,background:overdue?T.redBg:T.orangeBg,color:overdue?T.red:T.orange }}>{overdue?`D+${Math.abs(days)}`:`D-${days}`}</span>
                    </div>
                  );
                })}
                {timeline.filter(t=>!t.done&&daysUntil(t.deadline)<=60).length===0&&<p style={{ color:T.textMuted,fontSize:13,textAlign:"center",padding:"18px 0" }}>60일 내 마감 항목이 없어요 🎉</p>}
              </div>
            </div>
            <div>
              <h2 style={{ margin:"0 0 10px",fontSize:14,fontWeight:700,color:T.text }}>💬 아직 의논 중인 항목</h2>
              <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
                {discussions.flatMap(g=>g.items.filter(i=>i.decided===null).map(i=>(
                  <button key={i.id} onClick={()=>setTab("discussion")} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:100,padding:"5px 13px",fontSize:12,color:T.textSub,cursor:"pointer",fontFamily:T.font }}>{g.icon} {i.label}</button>
                ))).slice(0,8)}
              </div>
            </div>
          </div>
        )}
        {tab==="discussion"&&<DiscussionTab discussions={discussions} onUpdate={updateDiscussion}/>}
        {tab==="budget"&&<BudgetTab budget={budget} onUpdate={updateBudget}/>}
        {tab==="timeline"&&<TimelineTab timeline={timeline} onToggle={toggleTimeline}/>}
        {tab==="reference"&&<ReferenceTab refImages={refImages} onAddImage={addRefImage} onDeleteImage={deleteRefImage}/>}
      </div>

      {/* 하단 탭바 */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(246,248,252,0.96)",borderTop:`1px solid ${T.border}`,display:"flex",backdropFilter:"blur(12px)" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:"9px 0 13px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative",transition:"all 0.15s" }}>
            <span style={{ fontSize:tab===t.id?20:18,transition:"font-size 0.15s" }}>{t.icon}</span>
            <span style={{ fontSize:9,fontWeight:tab===t.id?700:400,color:tab===t.id?T.primary:T.textMuted,fontFamily:T.font }}>{t.label}</span>
            {tab===t.id&&<div style={{ position:"absolute",bottom:0,width:20,height:3,borderRadius:2,background:T.primary }}/>}
          </button>
        ))}
      </div>
    </div>
  );
}
