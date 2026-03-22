import { useState, useEffect, useCallback, useRef } from "react";

// ── Storage ───────────────────────────────────────────────────
const STORAGE_KEY = "wedding-app-v3";
const REF_STORAGE_KEY = "wedding-ref-v3";

async function loadData() {
  try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function saveData(d) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(d)); } catch {}
}
async function loadRefImages() {
  try { const r = await window.storage.get(REF_STORAGE_KEY); return r ? JSON.parse(r.value) : {}; }
  catch { return {}; }
}
async function saveRefImages(d) {
  try { await window.storage.set(REF_STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ── 디자인 토큰 ───────────────────────────────────────────────
const C = {
  lime:     "#C8F135",
  limeD:    "#7A9000",
  limeDim:  "rgba(200,241,53,0.15)",
  ink:      "#0F0F0F",
  ink2:     "#1C1C1E",
  page:     "#E8E4DC",
  card:     "#FFFFFF",
  card2:    "#F0EDE5",
  border:   "rgba(0,0,0,0.10)",
  font:     "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',-apple-system,sans-serif",
  ls:       "-0.03em",
  rxs:      "10px",
  rsm:      "14px",
  rmd:      "18px",
  rlg:      "22px",
  rxl:      "26px",
};

const CAT_COLORS = {
  "예식장":"#1E6FD9","스드메":"#7C3AED","예물·예단":"#DB2777",
  "본식":"#0891B2","뷰티":"#EC4899","청첩장":"#D97706",
  "신혼여행":"#059669","이사":"#6B7280","기타":"#9CA3AF"
};
const PHASE_COLORS = {
  "1단계":"#7A9000","2단계":"#1C1C1E","3단계":"#0891B2",
  "4단계":"#059669","5단계":"#D97706","6단계":"#DB2777",
  "7단계":"#EF4444","귀국 후":"#6B7280"
};
const REF_CATEGORIES = [
  { id:"concept",    label:"사진컨셉", icon:"📷" },
  { id:"invitation", label:"청첩장",   icon:"💌" },
  { id:"bride",      label:"신부헤메", icon:"👰" },
  { id:"groom",      label:"신랑헤메", icon:"🤵" },
];

// ── 초기 데이터 ───────────────────────────────────────────────
const WEDDING_DATE = new Date("2027-07-10");

const INITIAL_DISCUSSIONS = [
  { id:"date", title:"예식 기본 설정", segLabel:"📅 예식", icon:"📅", items:[
    {id:"d0",label:"예식장 장소",type:"venue",venues:[],decided:null,note:""},
    {id:"d1",label:"예식 날짜 & 시간",options:["7월 초 (5~6일)","7월 중순 (12~13일)","7월 말 (19~20일)"],decided:null,note:""},
    {id:"d2",label:"하객 인원 규모",options:["소규모 80~100명","중규모 120~150명","대규모 200명+"],decided:null,note:""},
    {id:"d3",label:"예식 컨셉",options:["전통 + 모던 믹스","미니멀 웨딩","가든 하우스풍"],decided:null,note:""},
    {id:"d4",label:"주례 여부",options:["주례 있음","주례 없음 (자유 식순)","미정"],decided:null,note:""},
  ]},
  { id:"ring", title:"예물 & 예단", segLabel:"💍 예물", icon:"💍", items:[
    {id:"r1",label:"커플링 브랜드",options:["까르띠에","불가리","티파니","국내 브랜드"],decided:null,note:""},
    {id:"r2",label:"신부 예물",options:["커플링만","다이아 반지 별도","세트 구성"],decided:null,note:""},
    {id:"r3",label:"신랑 예물",options:["시계","반지","없음"],decided:null,note:""},
    {id:"r4",label:"예단 규모",options:["간소하게 (50만원 이하)","일반적 (100~200만원)","양가 협의 후"],decided:null,note:""},
    {id:"r5",label:"예단 전달 방식",options:["함 보내기","직접 방문 전달","생략"],decided:null,note:""},
  ]},
  { id:"house", title:"신혼집", segLabel:"🏠 집", icon:"🏠", items:[
    {id:"h1",label:"주거 형태",options:["매매","전세","월세"],decided:null,note:""},
    {id:"h2",label:"선호 지역 기준",options:["직장 접근성 우선","양가 중간 거리","학군 우선"],decided:null,note:""},
    {id:"h3",label:"혼수 가전 범위",options:["필수 가전만","필수 + 선택 가전","풀 세트"],decided:null,note:""},
  ]},
  { id:"honeymoon", title:"신혼여행", segLabel:"✈️ 여행", icon:"✈️", items:[
    {id:"t1",label:"목적지",options:["유럽 (500만원+)","몰디브/발리 (350~500만원)","일본 (150~250만원)","하와이 (400만원+)"],decided:null,note:""},
    {id:"t2",label:"기간",options:["5박 7일","7박 9일","그 이상"],decided:null,note:""},
    {id:"t3",label:"여행 스타일",options:["럭셔리 리조트","도시 관광","자연/액티비티"],decided:null,note:""},
  ]},
  { id:"sdme", title:"스드메 & 본식", segLabel:"📸 스드메", icon:"📸", items:[
    {id:"s1",label:"스튜디오 촬영",options:["실내 스튜디오만","야외 촬영 포함","두 곳 모두"],decided:null,note:""},
    {id:"s2",label:"드레스 수량",options:["1벌","2벌 (본식 + 피로연)","3벌 이상"],decided:null,note:""},
    {id:"s3",label:"신랑 예복",options:["수트","턱시도","미정"],decided:null,note:""},
    {id:"s4",label:"사회자",options:["웨딩홀 전담 MC","지인","미정"],decided:null,note:""},
    {id:"s5",label:"축가",options:["지인","전문 가수","없음"],decided:null,note:""},
  ]},
  { id:"budget", title:"예산 분담", segLabel:"💰 예산", icon:"💰", items:[
    {id:"b1",label:"예식장 비용 부담",options:["남자 측","여자 측","반반","양가 협의"],decided:null,note:""},
    {id:"b2",label:"스드메 비용 부담",options:["신부 측","신랑 측","공동 부담"],decided:null,note:""},
    {id:"b3",label:"신혼집 보증금 부담",options:["남자 측","반반","각자 비율 협의"],decided:null,note:""},
    {id:"b4",label:"혼수 부담",options:["신부 측","신랑 측","공동 부담"],decided:null,note:""},
  ]},
  { id:"family", title:"양가 의례", segLabel:"👨‍👩‍👧 의례", icon:"👨‍👩‍👧", items:[
    {id:"f1",label:"상견례 장소",options:["고급 한식당","프라이빗 룸 레스토랑","호텔 식당"],decided:null,note:""},
    {id:"f2",label:"상견례 비용 부담",options:["남자 측","반반","여자 측"],decided:null,note:""},
    {id:"f3",label:"폐백 진행 여부",options:["진행","생략","간소화"],decided:null,note:""},
    {id:"f4",label:"함 보내기",options:["진행","생략"],decided:null,note:""},
    {id:"f5",label:"혼인신고 시기",options:["예식 전","예식 당일","예식 후"],decided:null,note:""},
  ]},
];

const INITIAL_BUDGET = [
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
  {id:"tl5",phase:"2단계",label:"예식장 방문 상담",deadline:"2026-07-31",done:false},
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
  return new Promise((res,rej) => { const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(file); });
}
async function resizeImage(dataUrl, maxW=1200) {
  return new Promise(res => {
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

// ── 공통 스타일 상수 ──────────────────────────────────────────
const S = {
  page:    { background:C.page, minHeight:"100vh", fontFamily:C.font, letterSpacing:C.ls },
  cardW:   { background:C.card, borderRadius:C.rlg, padding:"16px", marginBottom:"10px", border:`1px solid ${C.border}` },
  cardW2:  { background:C.card2, borderRadius:C.rlg, padding:"16px", marginBottom:"10px", border:`1px solid ${C.border}` },
  cardInk: { background:C.ink, borderRadius:C.rxl, padding:"20px", marginBottom:"10px" },
  cardLime:{ background:C.lime, borderRadius:C.rxl, padding:"20px 20px 16px", marginBottom:"10px", position:"relative", overflow:"hidden" },
};

// ── D-Day 카드 ────────────────────────────────────────────────
function DdayCard({ weddingDate }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const diff = Math.ceil((weddingDate - now) / 86400000);
  const total = Math.ceil((weddingDate - new Date("2026-03-22")) / 86400000);
  const pct = Math.min(100, Math.max(0, ((total-diff)/total)*100));
  return (
    <div style={{ ...S.cardLime, overflow:"visible" }}>
      <p style={{ fontSize:10,fontWeight:700,color:C.ink,opacity:.5,letterSpacing:C.ls,marginBottom:4 }}>결혼까지</p>
      <div style={{ fontSize:54,fontWeight:800,color:C.ink,lineHeight:1,letterSpacing:"-0.05em" }}>{diff.toLocaleString()}</div>
      <p style={{ fontSize:11,color:C.ink,opacity:.55,marginTop:5,letterSpacing:C.ls }}>2027년 7월 10일</p>
      <div style={{ background:"rgba(0,0,0,0.12)",borderRadius:"100px",height:3,marginTop:12,overflow:"hidden" }}>
        <div style={{ width:`${pct.toFixed(1)}%`,height:"100%",background:C.ink,borderRadius:"100px" }}/>
      </div>
      <span style={{ display:"inline-block",background:"transparent",color:C.ink,border:`1.5px solid rgba(0,0,0,0.25)`,borderRadius:C.rxs,padding:"4px 10px",fontSize:10,fontWeight:700,marginTop:12,letterSpacing:C.ls }}>
        준비율 {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ── 진행률 카드 (홈) ──────────────────────────────────────────
function ProgressCard({ discussions, timeline }) {
  const totalD = discussions.reduce((s,g)=>s+g.items.length,0);
  const doneD  = discussions.reduce((s,g)=>s+g.items.filter(i=>i.decided!==null).length,0);
  const doneTl = timeline.filter(t=>t.done).length;
  const totalTl = timeline.length;
  const pctD = totalD===0 ? 0 : Math.round((doneD/totalD)*100);
  const pctTl = totalTl===0 ? 0 : Math.round((doneTl/totalTl)*100);

  const Item = ({ label, done, total, pct, fillColor }) => (
    <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
      <p style={{ fontSize:10,fontWeight:700,color:"#999",letterSpacing:C.ls,marginBottom:4 }}>{label}</p>
      <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:10 }}>
        <span style={{ fontSize:26,fontWeight:800,color:C.ink,lineHeight:1,letterSpacing:"-0.04em" }}>{done}</span>
        <span style={{ fontSize:12,fontWeight:600,color:"#bbb",letterSpacing:C.ls }}>/{total}</span>
      </div>
      <div style={{ background:"rgba(0,0,0,0.08)",borderRadius:"100px",height:4,overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",borderRadius:"100px",background:fillColor,transition:"width 0.4s" }}/>
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",marginTop:4 }}>
        <span style={{ fontSize:9,color:"#bbb" }}>0%</span>
        <span style={{ fontSize:9,fontWeight:600,color:"#bbb" }}>{pct}%</span>
      </div>
    </div>
  );

  return (
    <div style={{ ...S.cardW, marginBottom:"10px" }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1px 1fr",gap:0,alignItems:"stretch" }}>
        <div style={{ paddingRight:14 }}>
          <Item label="의논 완료" done={doneD} total={totalD} pct={pctD} fillColor={C.ink}/>
        </div>
        <div style={{ background:C.border,margin:"4px 0" }}/>
        <div style={{ paddingLeft:14 }}>
          <Item label="타임라인" done={doneTl} total={totalTl} pct={pctTl} fillColor={C.lime}/>
        </div>
      </div>
    </div>
  );
}

// ── 세그먼트 컨트롤 ───────────────────────────────────────────
function SegmentControl({ items, active, onChange }) {
  return (
    <div style={{ background:C.card2,borderRadius:C.rsm,padding:"3px",display:"flex",gap:"2px",marginBottom:16,border:`1px solid ${C.border}` }}>
      {items.map(item => (
        <button key={item.id} onClick={()=>onChange(item.id)} style={{
          flex:1, padding:"7px 4px", borderRadius:"11px",
          fontSize:11, fontWeight: active===item.id ? 700 : 600,
          cursor:"pointer", background: active===item.id ? C.ink : "transparent",
          color: active===item.id ? C.lime : "#888",
          border:"none", fontFamily:C.font, letterSpacing:C.ls,
          transition:"all 0.18s", textAlign:"center", whiteSpace:"nowrap"
        }}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── 예식장 장소 카드 (직접 기입) ────────────────────────────
function VenueCard({ item, groupId, onUpdate }) {
  const [inputVal, setInputVal] = useState("");
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(item.note||"");
  const venues = item.venues||[];

  const addVenue = () => {
    const v = inputVal.trim();
    if(!v) return;
    const next = [...venues, { id:Date.now().toString(), name:v }];
    onUpdate(groupId, item.id, "venues", next);
    // 첫 번째 추가 시 자동 선택
    if(next.length===1) onUpdate(groupId, item.id, "decided", v);
    setInputVal("");
  };
  const removeVenue = (vid) => {
    const next = venues.filter(v=>v.id!==vid);
    onUpdate(groupId, item.id, "venues", next);
    if(item.decided === venues.find(v=>v.id===vid)?.name) {
      onUpdate(groupId, item.id, "decided", next.length>0?next[0].name:null);
    }
  };
  const selectVenue = (name) => {
    onUpdate(groupId, item.id, "decided", item.decided===name?null:name);
  };
  const saveNote = () => {
    onUpdate(groupId, item.id, "note", noteVal.trim());
    setEditingNote(false);
  };

  return (
    <div style={{ background:C.card,borderRadius:C.rlg,padding:"14px",border:`1px solid ${item.decided?C.ink:C.border}`,marginBottom:0,transition:"border-color 0.2s" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
        <p style={{ margin:0,fontSize:12,fontWeight:700,color:C.ink,letterSpacing:C.ls }}>🏛 예식장 장소</p>
        {item.decided && <span style={{ background:C.lime,color:C.ink,fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:C.rxs,letterSpacing:C.ls }}>선택 완료</span>}
      </div>

      {/* 후보 장소 목록 */}
      {venues.length>0 && (
        <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:12 }}>
          {venues.map(v=>{
            const sel = item.decided===v.name;
            return (
              <div key={v.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:C.rsm,border:`1.5px solid ${sel?C.ink:"rgba(0,0,0,0.1)"}`,background:sel?C.ink:C.card2,cursor:"pointer",transition:"all 0.15s" }}
                onClick={()=>selectVenue(v.name)}>
                <div style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${sel?"transparent":"#C0BBAC"}`,background:sel?C.lime:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:C.ink,transition:"all 0.2s" }}>
                  {sel?"✓":""}
                </div>
                <span style={{ flex:1,fontSize:12,fontWeight:sel?700:500,color:sel?C.lime:C.ink,letterSpacing:C.ls }}>{v.name}</span>
                <button onClick={e=>{e.stopPropagation();removeVenue(v.id);}} style={{ background:"none",border:"none",fontSize:14,cursor:"pointer",color:sel?"rgba(255,255,255,0.5)":"#ccc",lineHeight:1,padding:"0 2px" }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* 입력 필드 */}
      <div style={{ display:"flex",gap:7 }}>
        <input
          type="text" value={inputVal}
          onChange={e=>setInputVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") addVenue(); }}
          placeholder="예식장 이름을 입력하세요"
          style={{ flex:1,padding:"9px 12px",borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.13)`,fontSize:12,outline:"none",fontFamily:C.font,color:C.ink,background:C.card2,letterSpacing:C.ls }}
        />
        <button onClick={addVenue} style={{ padding:"9px 14px",background:C.ink,color:C.lime,border:"none",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:C.font,letterSpacing:C.ls,flexShrink:0 }}>추가</button>
      </div>

      {/* 메모 */}
      <div style={{ marginTop:10 }}>
        {editingNote ? (
          <div>
            <textarea value={noteVal} onChange={e=>setNoteVal(e.target.value)} placeholder="예식장 관련 메모 (연락처, 견적 조건 등)"
              style={{ width:"100%",minHeight:64,borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.15)`,padding:"8px 12px",fontSize:12,fontFamily:C.font,resize:"none",outline:"none",background:C.card2,color:C.ink,letterSpacing:C.ls,lineHeight:1.5,boxSizing:"border-box" }}/>
            <div style={{ display:"flex",gap:8,marginTop:6 }}>
              <button onClick={saveNote} style={{ padding:"5px 14px",background:C.ink,color:C.lime,border:"none",borderRadius:C.rxs,fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:C.font,letterSpacing:C.ls }}>저장</button>
              <button onClick={()=>setEditingNote(false)} style={{ padding:"5px 14px",background:C.card2,color:C.ink,border:`1px solid ${C.border}`,borderRadius:C.rxs,fontSize:12,cursor:"pointer",fontFamily:C.font,letterSpacing:C.ls }}>취소</button>
            </div>
          </div>
        ) : item.note ? (
          <div onClick={()=>{setEditingNote(true);setNoteVal(item.note);}} style={{ background:"#F8FAF0",borderRadius:C.rxs,padding:"7px 11px",fontSize:12,color:"#555",cursor:"pointer",borderLeft:`3px solid ${C.limeD}`,letterSpacing:C.ls }}>📝 {item.note}</div>
        ) : (
          <button onClick={()=>setEditingNote(true)} style={{ background:"none",border:"none",color:"#bbb",fontSize:12,cursor:"pointer",padding:"4px 0",fontFamily:C.font,letterSpacing:C.ls }}>+ 메모 추가 (연락처, 견적 등)</button>
        )}
      </div>
    </div>
  );
}

// ── 의논 탭 ───────────────────────────────────────────────────
function DiscussionTab({ discussions, onUpdate, onAddItem, onDeleteItem }) {
  const [activeGroup, setActiveGroup] = useState(discussions[0].id);
  const [editingNote, setEditingNote] = useState(null);
  const [noteVal, setNoteVal] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newOpts, setNewOpts] = useState("");
  const group = discussions.find(g=>g.id===activeGroup);
  const segItems = discussions.map(g=>({ id:g.id, label:g.segLabel }));

  const handleAddItem = () => {
    const label = newLabel.trim();
    if(!label) return;
    const options = newOpts.split(",").map(s=>s.trim()).filter(Boolean);
    const id = "custom_"+Date.now();
    onAddItem(activeGroup, {id, label, options, decided:null, note:""});
    setNewLabel(""); setNewOpts(""); setAddModal(false);
  };

  return (
    <div>
      <SegmentControl items={segItems} active={activeGroup} onChange={setActiveGroup}/>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {group.items.map(item=>(
          item.type==="venue"
          ? <VenueCard key={item.id} item={item} groupId={group.id} onUpdate={onUpdate}/>
          : <div key={item.id} style={{ background:C.card,borderRadius:C.rlg,padding:"14px",border:`1px solid ${item.decided!==null?C.ink:C.border}`,transition:"border-color 0.2s" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9 }}>
              <p style={{ margin:0,fontSize:12,fontWeight:700,color:C.ink,letterSpacing:C.ls,flex:1,minWidth:0,paddingRight:6 }}>{item.label}</p>
              <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
                {item.decided!==null && (
                  <span style={{ background:C.lime,color:C.ink,fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:C.rxs,letterSpacing:C.ls }}>결정 완료</span>
                )}
                {item.id.startsWith("custom_") && (
                  <button onClick={()=>onDeleteItem(group.id,item.id)} style={{ background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#ccc",lineHeight:1,padding:"0 2px" }}>✕</button>
                )}
              </div>
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {item.options.map(opt=>{
                const sel = item.decided===opt;
                return (
                  <button key={opt} onClick={()=>onUpdate(group.id,item.id,"decided",sel?null:opt)} style={{
                    padding:"6px 13px",borderRadius:C.rsm,fontSize:11,fontWeight:sel?700:600,
                    cursor:"pointer",background:sel?C.ink:C.card,color:sel?C.lime:C.ink,
                    border:`1.5px solid ${sel?C.ink:"rgba(0,0,0,0.13)"}`,
                    fontFamily:C.font,transition:"all 0.15s",letterSpacing:C.ls
                  }}>
                    {sel && <span style={{marginRight:4}}>✓</span>}{opt}
                  </button>
                );
              })}
            </div>
            {editingNote===item.id ? (
              <div style={{ marginTop:10 }}>
                <textarea value={noteVal} onChange={e=>setNoteVal(e.target.value)} placeholder="메모를 입력하세요..."
                  style={{ width:"100%",minHeight:60,borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.15)`,padding:"8px 12px",fontSize:12,resize:"vertical",fontFamily:C.font,boxSizing:"border-box",outline:"none",color:C.ink,background:C.card2,letterSpacing:C.ls }}/>
                <div style={{ display:"flex",gap:8,marginTop:6 }}>
                  <button onClick={()=>{onUpdate(group.id,item.id,"note",noteVal);setEditingNote(null);}} style={{ padding:"5px 14px",background:C.ink,color:C.lime,border:"none",borderRadius:C.rxs,fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:C.font,letterSpacing:C.ls }}>저장</button>
                  <button onClick={()=>setEditingNote(null)} style={{ padding:"5px 14px",background:C.card2,color:C.ink,border:`1px solid ${C.border}`,borderRadius:C.rxs,fontSize:12,cursor:"pointer",fontFamily:C.font,letterSpacing:C.ls }}>취소</button>
                </div>
              </div>
            ) : (
              <div>
                {item.note ? (
                  <div onClick={()=>{setEditingNote(item.id);setNoteVal(item.note);}} style={{ background:"#F8FAF0",borderRadius:C.rxs,padding:"7px 11px",fontSize:12,color:"#555",cursor:"pointer",borderLeft:`3px solid ${C.limeD}`,marginTop:10,letterSpacing:C.ls }}>📝 {item.note}</div>
                ) : (
                  <button onClick={()=>{setEditingNote(item.id);setNoteVal("");}} style={{ background:"none",border:"none",color:"#bbb",fontSize:12,cursor:"pointer",padding:"4px 0",marginTop:6,fontFamily:C.font,letterSpacing:C.ls }}>+ 메모 추가</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 항목 추가 버튼 */}
      <button onClick={()=>setAddModal(true)} style={{ width:"100%",marginTop:4,padding:"11px",borderRadius:C.rsm,border:`1.5px dashed rgba(0,0,0,0.15)`,background:"transparent",fontSize:12,fontWeight:700,color:C.ink,cursor:"pointer",fontFamily:C.font,letterSpacing:C.ls }}>
        + 의논 항목 추가
      </button>

      {/* 추가 모달 */}
      {addModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
          <div style={{ background:C.card,borderRadius:`${C.rxl} ${C.rxl} 0 0`,padding:"22px 18px 36px",width:"100%",maxWidth:480 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <p style={{ margin:0,fontSize:15,fontWeight:800,color:C.ink,letterSpacing:C.ls }}>의논 항목 추가</p>
              <button onClick={()=>setAddModal(false)} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#bbb" }}>✕</button>
            </div>
            <p style={{ fontSize:11,color:"#999",marginBottom:6,letterSpacing:C.ls }}>질문 / 항목명</p>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="예: 웨딩홀 선택 기준"
              style={{ width:"100%",padding:"11px 13px",borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.14)`,fontSize:13,outline:"none",fontFamily:C.font,color:C.ink,background:C.card2,letterSpacing:C.ls,marginBottom:12,boxSizing:"border-box" }}/>
            <p style={{ fontSize:11,color:"#999",marginBottom:6,letterSpacing:C.ls }}>선택지 (쉼표로 구분, 없으면 비워두세요)</p>
            <input value={newOpts} onChange={e=>setNewOpts(e.target.value)} placeholder="예: A홀, B홀, 미정"
              style={{ width:"100%",padding:"11px 13px",borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.14)`,fontSize:13,outline:"none",fontFamily:C.font,color:C.ink,background:C.card2,letterSpacing:C.ls,marginBottom:16,boxSizing:"border-box" }}/>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setAddModal(false)} style={{ flex:1,padding:"11px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.card2,color:C.ink,border:`1px solid ${C.border}`,fontFamily:C.font,letterSpacing:C.ls }}>취소</button>
              <button onClick={handleAddItem} style={{ flex:2,padding:"11px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.ink,color:C.lime,border:"none",fontFamily:C.font,letterSpacing:C.ls }}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 예산 탭 ───────────────────────────────────────────────────
function BudgetTab({ budget, onUpdate, onAdd, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCat, setNewCat] = useState("예식장");
  const [newEst, setNewEst] = useState("");

  const ALL_CATS = ["예식장","스드메","예물·예단","본식","뷰티","청첩장","신혼여행","이사","기타"];
  // 예식장을 항상 첫 번째로 노출
  const orderedCats = ["예식장", ...([...new Set(budget.map(b=>b.category))].filter(c=>c!=="예식장"))];
  const categories = orderedCats.filter(cat=>
    budget.some(b=>b.category===cat) || cat==="예식장"
  );

  const totalEst = budget.reduce((s,b)=>s+b.estimated,0);
  const totalAct = budget.reduce((s,b)=>s+(b.paid?(b.actual??b.estimated):0),0);
  const pctPaid = totalEst===0 ? 0 : (totalAct/totalEst)*100;

  const handleAdd = () => {
    const label = newLabel.trim();
    if(!label) return;
    onAdd({ id:"budg_"+Date.now(), category:newCat, label, estimated:Number(newEst)||0, actual:null, paid:false });
    setNewLabel(""); setNewEst(""); setAddModal(false);
  };

  return (
    <div>
      <div style={S.cardInk}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
          <div>
            <p style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:C.ls,marginBottom:3 }}>총 예상</p>
            <p style={{ fontSize:26,fontWeight:800,color:"#fff",lineHeight:1.1,letterSpacing:"0" }}>{Math.round(totalEst/10000).toLocaleString()}<span style={{ fontSize:14,opacity:.4 }}>만원</span></p>
          </div>
          <div>
            <p style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:C.ls,marginBottom:3 }}>납부 완료</p>
            <p style={{ fontSize:26,fontWeight:800,color:C.lime,lineHeight:1.1,letterSpacing:"0" }}>{Math.round(totalAct/10000).toLocaleString()}<span style={{ fontSize:14,opacity:.6 }}>만원</span></p>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.12)",borderRadius:"100px",height:4,overflow:"hidden" }}>
          <div style={{ width:`${pctPaid.toFixed(1)}%`,height:"100%",background:C.lime,borderRadius:"100px",transition:"width 0.5s" }}/>
        </div>
        <p style={{ fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:5,letterSpacing:C.ls }}>납부율 {pctPaid.toFixed(1)}% · 잔여 {Math.round((totalEst-totalAct)/10000).toLocaleString()}만원</p>
      </div>

      {categories.map(cat=>{
        const items = budget.filter(b=>b.category===cat);
        const cc = CAT_COLORS[cat]||"#9CA3AF";
        return (
          <div key={cat}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",margin:"14px 0 8px" }}>
              <p style={{ fontSize:10,fontWeight:700,color:"#888",letterSpacing:C.ls,margin:0,display:"flex",alignItems:"center",gap:6 }}>
                <span style={{ width:8,height:8,borderRadius:"50%",background:cc,display:"inline-block" }}/>
                {cat}
              </p>
              {items.length===0 && cat==="예식장" && (
                <span style={{ fontSize:10,color:"#bbb",letterSpacing:C.ls }}>아래 + 버튼으로 추가해보세요</span>
              )}
            </div>
            {items.map(item=>(
              <div key={item.id} style={{ display:"flex",alignItems:"center",gap:10,background:item.paid?"#F8FFE0":C.card,borderRadius:C.rsm,padding:"10px 12px",border:`1px solid ${item.paid?C.limeD:C.border}`,marginBottom:7,transition:"all 0.15s" }}>
                <div onClick={()=>onUpdate(item.id,"paid",!item.paid)} style={{ width:20,height:20,borderRadius:6,border:`1.5px solid ${item.paid?C.ink:"#C0BBAC"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,background:item.paid?C.ink:C.card,color:item.paid?C.lime:"transparent",transition:"all 0.2s",cursor:"pointer" }}>
                  {item.paid?"✓":""}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ margin:0,fontSize:12,fontWeight:600,color:item.paid?"#aaa":C.ink,textDecoration:item.paid?"line-through":"none",letterSpacing:C.ls }}>{item.label}</p>
                  <p style={{ margin:"2px 0 0",fontSize:10,color:"#999",letterSpacing:C.ls }}>예상 {item.estimated.toLocaleString()}만원</p>
                </div>
                {editingId===item.id ? (
                  <div style={{ display:"flex",gap:6 }}>
                    <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)}
                      style={{ width:68,padding:"4px 8px",borderRadius:C.rxs,border:`1px solid ${C.border}`,fontSize:12,textAlign:"right",outline:"none",fontFamily:C.font,color:C.ink,background:C.card }}/>
                    <button onClick={()=>{onUpdate(item.id,"actual",Number(editVal)||null);setEditingId(null);}}
                      style={{ padding:"4px 10px",background:C.ink,color:C.lime,border:"none",borderRadius:C.rxs,fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:C.font }}>저장</button>
                  </div>
                ) : (
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <button onClick={e=>{e.stopPropagation();setEditingId(item.id);setEditVal(item.actual??"");}}
                      style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:C.rxs,padding:"3px 9px",fontSize:11,color:item.actual?C.limeD:"#bbb",cursor:"pointer",fontWeight:item.actual?700:400,whiteSpace:"nowrap",fontFamily:C.font,letterSpacing:C.ls }}>
                      {item.actual?`${item.actual.toLocaleString()}만원`:"금액 입력"}
                    </button>
                    {item.id.startsWith("budg_") && (
                      <button onClick={()=>onDelete(item.id)} style={{ background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#ccc",lineHeight:1,padding:"0 2px",flexShrink:0 }}>✕</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* 항목 추가 버튼 */}
      <button onClick={()=>setAddModal(true)} style={{ width:"100%",marginTop:8,padding:"11px",borderRadius:C.rsm,border:`1.5px dashed rgba(0,0,0,0.15)`,background:"transparent",fontSize:12,fontWeight:700,color:C.ink,cursor:"pointer",fontFamily:C.font,letterSpacing:C.ls }}>
        + 예산 항목 추가
      </button>

      {/* 추가 모달 */}
      {addModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
          <div style={{ background:C.card,borderRadius:`${C.rxl} ${C.rxl} 0 0`,padding:"22px 18px 36px",width:"100%",maxWidth:480 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <p style={{ margin:0,fontSize:15,fontWeight:800,color:C.ink,letterSpacing:C.ls }}>예산 항목 추가</p>
              <button onClick={()=>setAddModal(false)} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#bbb" }}>✕</button>
            </div>
            <p style={{ fontSize:11,color:"#999",marginBottom:6,letterSpacing:C.ls }}>카테고리</p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:14 }}>
              {ALL_CATS.map(c=>(
                <button key={c} onClick={()=>setNewCat(c)} style={{ padding:"5px 12px",borderRadius:C.rsm,fontSize:11,fontWeight:600,cursor:"pointer",background:newCat===c?C.ink:C.card2,color:newCat===c?C.lime:C.ink,border:`1.5px solid ${newCat===c?C.ink:"rgba(0,0,0,0.12)"}`,fontFamily:C.font,letterSpacing:C.ls }}>
                  {c}
                </button>
              ))}
            </div>
            <p style={{ fontSize:11,color:"#999",marginBottom:6,letterSpacing:C.ls }}>항목명</p>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="예: 예식장 계약금"
              style={{ width:"100%",padding:"11px 13px",borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.14)`,fontSize:13,outline:"none",fontFamily:C.font,color:C.ink,background:C.card2,letterSpacing:C.ls,marginBottom:12,boxSizing:"border-box" }}/>
            <p style={{ fontSize:11,color:"#999",marginBottom:6,letterSpacing:C.ls }}>예상 금액 (만원)</p>
            <input type="number" value={newEst} onChange={e=>setNewEst(e.target.value)} placeholder="예: 300"
              style={{ width:"100%",padding:"11px 13px",borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.14)`,fontSize:13,outline:"none",fontFamily:C.font,color:C.ink,background:C.card2,letterSpacing:C.ls,marginBottom:16,boxSizing:"border-box" }}/>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setAddModal(false)} style={{ flex:1,padding:"11px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.card2,color:C.ink,border:`1px solid ${C.border}`,fontFamily:C.font,letterSpacing:C.ls }}>취소</button>
              <button onClick={handleAdd} style={{ flex:2,padding:"11px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.ink,color:C.lime,border:"none",fontFamily:C.font,letterSpacing:C.ls }}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 타임라인 탭 ───────────────────────────────────────────────
function TimelineTab({ timeline, onToggle, onAdd, onDelete }) {
  const [addModal, setAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPhase, setNewPhase] = useState("1단계");
  const [newDeadline, setNewDeadline] = useState("");

  const PHASES = ["1단계","2단계","3단계","4단계","5단계","6단계","7단계","귀국 후"];
  const phases = [...new Set(timeline.map(t=>t.phase))];

  const handleAdd = () => {
    const label = newLabel.trim();
    if(!label||!newDeadline) return;
    onAdd({ id:"tl_"+Date.now(), phase:newPhase, label, deadline:newDeadline, done:false });
    setNewLabel(""); setNewDeadline(""); setAddModal(false);
  };

  return (
    <div>
      {phases.map(phase=>{
        const items = timeline.filter(t=>t.phase===phase);
        const done = items.filter(t=>t.done).length;
        const color = PHASE_COLORS[phase]||"#9CA3AF";
        return (
          <div key={phase} style={{ marginBottom:16 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:C.ink,letterSpacing:C.ls }}>
                <div style={{ width:3,height:15,borderRadius:2,background:color }}/>
                {phase}
              </div>
              <span style={{ fontSize:10,fontWeight:700,background:color==="1단계"?C.lime:color==="귀국 후"?"#E0DDD5":C.ink,color:color==="1단계"?C.ink:color==="귀국 후"?"#666":C.lime,borderRadius:C.rxs,padding:"2px 9px",letterSpacing:C.ls }}>
                {done}/{items.length}
              </span>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {items.map(item=>{
                const days = daysUntil(item.deadline);
                const overdue = !item.done && days<0;
                const urgent = !item.done && days>=0 && days<=30;
                return (
                  <div key={item.id} style={{ display:"flex",alignItems:"center",gap:9,background:item.done?C.card2:C.card,borderRadius:C.rsm,padding:"10px 12px",border:`1px solid ${item.done?"rgba(0,0,0,0.05)":C.border}`,opacity:item.done?0.5:1,transition:"all 0.15s" }}>
                    <div onClick={()=>onToggle(item.id)} style={{ width:18,height:18,borderRadius:"50%",border:`1.5px solid ${item.done?"#22C55E":"#C0BBAC"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,background:item.done?"#22C55E":C.card,color:"#fff",transition:"all 0.2s",cursor:"pointer" }}>
                      {item.done?"✓":""}
                    </div>
                    <div style={{ flex:1 }} onClick={()=>onToggle(item.id)} >
                      <p style={{ margin:0,fontSize:12,fontWeight:500,color:item.done?"#aaa":C.ink,textDecoration:item.done?"line-through":"none",letterSpacing:C.ls,cursor:"pointer" }}>{item.label}</p>
                      <p style={{ margin:"2px 0 0",fontSize:10,color:"#999",letterSpacing:C.ls }}>마감 {fmtDate(item.deadline)}</p>
                    </div>
                    {!item.done && (
                      <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:C.rxs,flexShrink:0,background:overdue?"#FEF2F2":urgent?"#FFFBEB":C.card2,color:overdue?"#EF4444":urgent?"#F59E0B":"#888",letterSpacing:C.ls }}>
                        {overdue?`D+${Math.abs(days)}`:days===0?"오늘":`D-${days}`}
                      </span>
                    )}
                    {item.id.startsWith("tl_") && (
                      <button onClick={()=>onDelete(item.id)} style={{ background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#ccc",lineHeight:1,padding:"0 2px",flexShrink:0 }}>✕</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* 항목 추가 버튼 */}
      <button onClick={()=>setAddModal(true)} style={{ width:"100%",marginTop:4,padding:"11px",borderRadius:C.rsm,border:`1.5px dashed rgba(0,0,0,0.15)`,background:"transparent",fontSize:12,fontWeight:700,color:C.ink,cursor:"pointer",fontFamily:C.font,letterSpacing:C.ls }}>
        + 타임라인 항목 추가
      </button>

      {/* 추가 모달 */}
      {addModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
          <div style={{ background:C.card,borderRadius:`${C.rxl} ${C.rxl} 0 0`,padding:"22px 18px 36px",width:"100%",maxWidth:480 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <p style={{ margin:0,fontSize:15,fontWeight:800,color:C.ink,letterSpacing:C.ls }}>타임라인 항목 추가</p>
              <button onClick={()=>setAddModal(false)} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#bbb" }}>✕</button>
            </div>
            <p style={{ fontSize:11,color:"#999",marginBottom:6,letterSpacing:C.ls }}>단계</p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:14 }}>
              {PHASES.map(p=>(
                <button key={p} onClick={()=>setNewPhase(p)} style={{ padding:"5px 12px",borderRadius:C.rsm,fontSize:11,fontWeight:600,cursor:"pointer",background:newPhase===p?C.ink:C.card2,color:newPhase===p?C.lime:C.ink,border:`1.5px solid ${newPhase===p?C.ink:"rgba(0,0,0,0.12)"}`,fontFamily:C.font,letterSpacing:C.ls }}>
                  {p}
                </button>
              ))}
            </div>
            <p style={{ fontSize:11,color:"#999",marginBottom:6,letterSpacing:C.ls }}>할 일</p>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="예: 스드메 업체 미팅"
              style={{ width:"100%",padding:"11px 13px",borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.14)`,fontSize:13,outline:"none",fontFamily:C.font,color:C.ink,background:C.card2,letterSpacing:C.ls,marginBottom:12,boxSizing:"border-box" }}/>
            <p style={{ fontSize:11,color:"#999",marginBottom:6,letterSpacing:C.ls }}>마감일</p>
            <input type="date" value={newDeadline} onChange={e=>setNewDeadline(e.target.value)}
              style={{ width:"100%",padding:"11px 13px",borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.14)`,fontSize:13,outline:"none",fontFamily:C.font,color:C.ink,background:C.card2,letterSpacing:C.ls,marginBottom:16,boxSizing:"border-box" }}/>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setAddModal(false)} style={{ flex:1,padding:"11px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.card2,color:C.ink,border:`1px solid ${C.border}`,fontFamily:C.font,letterSpacing:C.ls }}>취소</button>
              <button onClick={handleAdd} style={{ flex:2,padding:"11px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.ink,color:C.lime,border:"none",fontFamily:C.font,letterSpacing:C.ls }}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 레퍼런스 탭 ───────────────────────────────────────────────
function ReferenceTab({ refImages, onAddImage, onDeleteImage, onUpdateMemo }) {
  const [activeCat, setActiveCat] = useState(REF_CATEGORIES[0].id);
  const [lightbox, setLightbox] = useState(null);
  const [memoModal, setMemoModal] = useState(null);
  const [memoVal, setMemoVal] = useState("");
  const [uploading, setUploading] = useState(false);
  // URL 모달 상태
  const [urlModal, setUrlModal] = useState(false);
  const [urlVal, setUrlVal] = useState("");
  const [urlError, setUrlError] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  const fileInputRef = useRef(null);
  const cat = REF_CATEGORIES.find(c=>c.id===activeCat);
  const images = refImages[activeCat]||[];

  // 파일 업로드
  const handleFileChange = async(e) => {
    const files = Array.from(e.target.files).filter(f=>f.type.startsWith("image/"));
    if(!files.length) return;
    setUploading(true);
    try {
      for(const file of files){
        let dataUrl = await readFileAsDataURL(file);
        if(file.size > 2*1024*1024) dataUrl = await resizeImage(dataUrl,1200);
        const id = Date.now()+Math.random().toString(36).slice(2);
        await onAddImage(activeCat,{id,src:dataUrl,name:file.name,memo:"",addedAt:new Date().toISOString()});
        setMemoModal({id,catId:activeCat,src:dataUrl});
        setMemoVal("");
      }
    } finally { setUploading(false); e.target.value=""; }
  };

  // URL 유효성 검사
  const isValidUrl = (str) => {
    try { const u = new URL(str); return u.protocol==="https:"||u.protocol==="http:"; }
    catch { return false; }
  };

  // URL로 이미지 추가 (CORS 우회: crossOrigin 없이 로드 확인)
  const handleUrlAdd = async() => {
    const url = urlVal.trim();
    if(!url){ setUrlError("URL을 입력해주세요."); return; }
    if(!isValidUrl(url)){ setUrlError("올바른 URL 형식이 아니에요. (http:// 또는 https://)"); return; }
    setUrlError("");
    setUrlLoading(true);
    try {
      await new Promise((res,rej)=>{
        const img = new Image();
        const timer = setTimeout(()=>{
          img.src = "";
          rej(new Error("로딩 시간이 초과됐어요. URL을 다시 확인해주세요."));
        }, 10000);
        img.onload = ()=>{ clearTimeout(timer); res(); };
        img.onerror = ()=>{ clearTimeout(timer); rej(new Error("이미지를 불러올 수 없어요. 직접 이미지 링크(.jpg .png .webp)인지 확인해주세요.")); };
        img.src = url;
      });
      const id = Date.now()+Math.random().toString(36).slice(2);
      const name = url.split("/").pop().split("?")[0]||"image";
      await onAddImage(activeCat,{id,src:url,name,memo:"",addedAt:new Date().toISOString(),isUrl:true});
      setUrlVal("");
      setUrlModal(false);
      setMemoModal({id,catId:activeCat,src:url});
      setMemoVal("");
    } catch(err) {
      setUrlError(err.message||"이미지를 불러올 수 없어요.");
    } finally {
      setUrlLoading(false);
    }
  };

  const segItems = REF_CATEGORIES.map(c=>({ id:c.id, label:`${c.icon} ${c.label}` }));

  // 버튼 공통 스타일
  const addBtnBase = {
    flex:1, padding:"11px 8px", borderRadius:C.rsm, fontSize:12, fontWeight:700,
    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
    gap:6, fontFamily:C.font, letterSpacing:C.ls, transition:"all 0.15s", border:"1.5px solid",
  };

  return (
    <div>
      <SegmentControl items={segItems} active={activeCat} onChange={setActiveCat}/>

      {/* 추가 버튼 2개 */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display:"none" }}/>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
        <button onClick={()=>fileInputRef.current?.click()} disabled={uploading} style={{
          ...addBtnBase, borderColor:"rgba(0,0,0,0.15)", background:C.card,
          color:C.ink, cursor:uploading?"not-allowed":"pointer", opacity:uploading?0.6:1,
        }}>
          {uploading ? <>⏳ 업로드 중...</> : <><span style={{fontSize:16}}>📁</span>파일 업로드</>}
        </button>
        <button onClick={()=>{ setUrlModal(true); setUrlVal(""); setUrlError(""); }} style={{
          ...addBtnBase, borderColor:C.ink, background:C.ink, color:C.lime,
        }}>
          <span style={{fontSize:16}}>🔗</span>URL로 추가
        </button>
      </div>

      {/* 갤러리 */}
      {images.length===0 ? (
        <div style={{ textAlign:"center",padding:"40px 16px",border:`1px dashed ${C.border}`,borderRadius:C.rlg }}>
          <div style={{ fontSize:34,marginBottom:8 }}>{cat.icon}</div>
          <p style={{ fontSize:13,fontWeight:700,color:C.ink,marginBottom:3,letterSpacing:C.ls }}>{cat.label} 레퍼런스 없음</p>
          <p style={{ fontSize:11,color:"#999",letterSpacing:C.ls }}>파일 업로드 또는 URL로 추가해보세요</p>
        </div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6 }}>
          {images.map(img=>(
            <div key={img.id} style={{ borderRadius:C.rsm,overflow:"hidden",background:C.card2,cursor:"pointer",border:`1px solid ${C.border}` }}
              onClick={()=>setLightbox({...img,catId:activeCat})}>
              <div style={{ aspectRatio:"1",overflow:"hidden",position:"relative" }}>
                <img src={img.src} alt={img.name} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
                {img.isUrl && (
                  <span style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 5px",borderRadius:4,letterSpacing:C.ls }}>URL</span>
                )}
              </div>
              <div style={{ padding:"6px 8px",background:C.card,borderTop:`1px solid ${C.border}` }}>
                {img.memo
                  ? <p style={{ fontSize:10,color:"#555",lineHeight:1.3,letterSpacing:C.ls,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{img.memo}</p>
                  : <p style={{ fontSize:10,color:"#bbb",letterSpacing:C.ls }}>메모 없음</p>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* URL 입력 모달 */}
      {urlModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
          <div style={{ background:C.card,borderRadius:`${C.rxl} ${C.rxl} 0 0`,padding:"22px 18px 36px",width:"100%",maxWidth:480 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <p style={{ fontSize:15,fontWeight:800,color:C.ink,letterSpacing:C.ls,margin:0 }}>🔗 URL로 이미지 추가</p>
              <button onClick={()=>setUrlModal(false)} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#bbb",lineHeight:1 }}>✕</button>
            </div>
            <p style={{ fontSize:11,color:"#999",letterSpacing:C.ls,marginBottom:16 }}>이미지 직접 링크(jpg, png, webp 등)를 붙여넣으세요</p>

            {/* URL 미리보기 */}
            {urlVal && isValidUrl(urlVal) && (
              <div style={{ width:"100%",aspectRatio:"16/9",overflow:"hidden",borderRadius:C.rsm,marginBottom:12,background:C.card2,border:`1px solid ${C.border}` }}>
                <img src={urlVal} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}
                  onError={e=>{ e.target.style.display="none"; }}/>
              </div>
            )}

            <input
              type="url"
              value={urlVal}
              onChange={e=>{ setUrlVal(e.target.value); setUrlError(""); }}
              onKeyDown={e=>{ if(e.key==="Enter") handleUrlAdd(); }}
              placeholder="https://example.com/image.jpg"
              style={{
                width:"100%",padding:"12px 14px",borderRadius:C.rsm,fontSize:13,
                border:`1.5px solid ${urlError?"#EF4444":"rgba(0,0,0,0.15)"}`,
                outline:"none",fontFamily:C.font,color:C.ink,background:C.card2,
                letterSpacing:C.ls,boxSizing:"border-box",
              }}
            />
            {urlError && <p style={{ fontSize:11,color:"#EF4444",marginTop:6,letterSpacing:C.ls }}>{urlError}</p>}

            <div style={{ display:"flex",gap:8,marginTop:14 }}>
              <button onClick={()=>setUrlModal(false)} style={{ flex:1,padding:"11px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.card2,color:C.ink,border:`1px solid ${C.border}`,fontFamily:C.font,letterSpacing:C.ls }}>취소</button>
              <button onClick={handleUrlAdd} disabled={urlLoading} style={{ flex:2,padding:"11px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:urlLoading?"not-allowed":"pointer",background:urlLoading?C.card2:C.ink,color:urlLoading?"#bbb":C.lime,border:"none",fontFamily:C.font,letterSpacing:C.ls,transition:"all 0.15s" }}>
                {urlLoading?"⏳ 확인 중...":"추가하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메모 모달 */}
      {memoModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:250,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
          <div style={{ background:C.card,borderRadius:`${C.rxl} ${C.rxl} 0 0`,padding:"20px 18px 32px",width:"100%",maxWidth:480 }}>
            <p style={{ fontSize:14,fontWeight:800,color:C.ink,marginBottom:12,letterSpacing:C.ls }}>메모 작성</p>
            <img src={memoModal.src} alt="" style={{ width:"100%",aspectRatio:"16/9",objectFit:"cover",borderRadius:C.rsm,marginBottom:12 }}/>
            <textarea value={memoVal} onChange={e=>setMemoVal(e.target.value)} placeholder="이 이미지에 대한 메모를 남겨보세요..."
              style={{ width:"100%",minHeight:72,borderRadius:C.rsm,border:`1.5px solid rgba(0,0,0,0.15)`,padding:"10px 12px",fontSize:12,fontFamily:C.font,resize:"none",outline:"none",background:C.card2,color:C.ink,letterSpacing:C.ls,lineHeight:1.5 }}/>
            <div style={{ display:"flex",gap:8,marginTop:10 }}>
              <button onClick={()=>setMemoModal(null)} style={{ flex:1,padding:"10px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.card2,color:C.ink,border:`1px solid ${C.border}`,fontFamily:C.font,letterSpacing:C.ls }}>건너뛰기</button>
              <button onClick={()=>{ onUpdateMemo(memoModal.catId,memoModal.id,memoVal.trim()); setMemoModal(null); }}
                style={{ flex:1,padding:"10px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.ink,color:C.lime,border:"none",fontFamily:C.font,letterSpacing:C.ls }}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div style={{ position:"fixed",inset:0,background:"rgba(10,10,10,0.92)",zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20 }}>
          <img src={lightbox.src} alt="" style={{ maxWidth:"100%",maxHeight:"52%",borderRadius:C.rlg,objectFit:"contain" }}/>
          {lightbox.isUrl && (
            <p style={{ fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:8,letterSpacing:C.ls,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{lightbox.src}</p>
          )}
          <div style={{ background:"rgba(255,255,255,0.1)",borderRadius:C.rsm,padding:"10px 14px",marginTop:10,width:"100%",maxWidth:320 }}>
            <p style={{ fontSize:12,color:lightbox.memo?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.35)",lineHeight:1.5,letterSpacing:C.ls }}>
              {lightbox.memo||"메모를 추가해보세요"}
            </p>
          </div>
          <div style={{ display:"flex",gap:8,marginTop:14,flexWrap:"wrap",justifyContent:"center" }}>
            <button onClick={()=>setLightbox(null)} style={{ padding:"9px 16px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:"rgba(255,255,255,0.14)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",fontFamily:C.font,letterSpacing:C.ls }}>닫기</button>
            <button onClick={()=>{ setMemoModal({id:lightbox.id,catId:lightbox.catId,src:lightbox.src}); setMemoVal(lightbox.memo||""); setLightbox(null); }}
              style={{ padding:"9px 16px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:C.lime,color:C.ink,border:"none",fontFamily:C.font,letterSpacing:C.ls }}>메모 수정</button>
            <button onClick={()=>{ onDeleteImage(lightbox.catId,lightbox.id); setLightbox(null); }}
              style={{ padding:"9px 16px",borderRadius:C.rsm,fontSize:12,fontWeight:700,cursor:"pointer",background:"#EF4444",color:"#fff",border:"none",fontFamily:C.font,letterSpacing:C.ls }}>삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [discussions, setDiscussions] = useState(INITIAL_DISCUSSIONS);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);
  const [refImages, setRefImages] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(()=>{
    Promise.all([loadData(),loadRefImages()]).then(([d,r])=>{
      if(d){ if(d.discussions)setDiscussions(d.discussions); if(d.budget)setBudget(d.budget); if(d.timeline)setTimeline(d.timeline); }
      if(r)setRefImages(r);
      setLoaded(true);
    });
  },[]);

  useEffect(()=>{ if(!loaded)return; saveData({discussions,budget,timeline}); },[discussions,budget,timeline,loaded]);

  const updateDiscussion = useCallback((groupId,itemId,field,value)=>{
    setDiscussions(prev=>prev.map(g=>g.id!==groupId?g:{...g,items:g.items.map(i=>i.id!==itemId?i:{...i,[field]:value})}));
  },[]);
  const addDiscussionItem = useCallback((groupId,item)=>{
    setDiscussions(prev=>prev.map(g=>g.id!==groupId?g:{...g,items:[...g.items,item]}));
  },[]);
  const deleteDiscussionItem = useCallback((groupId,itemId)=>{
    setDiscussions(prev=>prev.map(g=>g.id!==groupId?g:{...g,items:g.items.filter(i=>i.id!==itemId)}));
  },[]);
  const updateBudget = useCallback((id,field,value)=>{
    setBudget(prev=>prev.map(b=>b.id!==id?b:{...b,[field]:value}));
  },[]);
  const addBudgetItem = useCallback((item)=>{
    setBudget(prev=>[...prev,item]);
  },[]);
  const deleteBudgetItem = useCallback((id)=>{
    setBudget(prev=>prev.filter(b=>b.id!==id));
  },[]);
  const toggleTimeline = useCallback((id)=>{
    setTimeline(prev=>prev.map(t=>t.id!==id?t:{...t,done:!t.done}));
  },[]);
  const addTimelineItem = useCallback((item)=>{
    setTimeline(prev=>[...prev,item]);
  },[]);
  const deleteTimelineItem = useCallback((id)=>{
    setTimeline(prev=>prev.filter(t=>t.id!==id));
  },[]);
  const addRefImage = useCallback(async(catId,img)=>{
    setRefImages(prev=>{ const next={...prev,[catId]:[...(prev[catId]||[]),img]}; saveRefImages(next); return next; });
  },[]);
  const deleteRefImage = useCallback((catId,imgId)=>{
    setRefImages(prev=>{ const next={...prev,[catId]:(prev[catId]||[]).filter(i=>i.id!==imgId)}; saveRefImages(next); return next; });
  },[]);
  const updateMemo = useCallback((catId,imgId,memo)=>{
    setRefImages(prev=>{ const next={...prev,[catId]:(prev[catId]||[]).map(i=>i.id!==imgId?i:{...i,memo})}; saveRefImages(next); return next; });
  },[]);

  const tabs = [
    {id:"home",label:"홈",icon:"🏠"},
    {id:"discussion",label:"의논",icon:"💬"},
    {id:"budget",label:"예산",icon:"💰"},
    {id:"timeline",label:"타임라인",icon:"📅"},
    {id:"reference",label:"레퍼런스",icon:"🖼️"},
  ];

  if(!loaded) return (
    <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.page,fontFamily:C.font }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36,marginBottom:12 }}>💍</div>
        <p style={{ color:"#999",fontSize:14,letterSpacing:C.ls }}>로딩 중...</p>
      </div>
    </div>
  );

  const totalDiscItems = discussions.reduce((s,g)=>s+g.items.length,0);
  const undecided = discussions.flatMap(g=>g.items.filter(i=>i.decided===null));

  return (
    <div style={{ maxWidth:480,margin:"0 auto",minHeight:"100vh",background:C.page,fontFamily:C.font,letterSpacing:C.ls,position:"relative",paddingBottom:82 }}>

      {/* 헤더 */}
      <div style={{ padding:"18px 18px 14px",background:C.page,position:"sticky",top:0,zIndex:10,borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
          <div>
            <p style={{ margin:0,fontSize:10,fontWeight:600,color:"#888",letterSpacing:C.ls,marginBottom:2 }}>Our Wedding</p>
            <h1 style={{ margin:0,fontSize:24,fontWeight:800,color:C.ink,lineHeight:1,letterSpacing:"-0.04em" }}>2027년 7월</h1>
          </div>
          <div style={{ background:C.lime,borderRadius:C.rsm,padding:"7px 14px",textAlign:"center" }}>
            <p style={{ margin:0,fontSize:10,fontWeight:700,color:C.ink,letterSpacing:C.ls }}>D-day</p>
            <p style={{ margin:0,fontSize:17,fontWeight:800,color:C.ink,lineHeight:1.2 }}>{daysUntil(WEDDING_DATE).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ padding:"16px 16px 0" }}>

        {tab==="home" && (
          <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
            <DdayCard weddingDate={WEDDING_DATE}/>
            <ProgressCard discussions={discussions} timeline={timeline}/>

            <div style={S.cardW}>
              <p style={{ margin:"0 0 9px",fontSize:12,fontWeight:700,color:C.ink,letterSpacing:C.ls }}>📌 마감 임박</p>
              <div style={{ display:"flex",flexDirection:"column" }}>
                {timeline.filter(t=>!t.done&&daysUntil(t.deadline)<=60).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,4).map(item=>{
                  const days=daysUntil(item.deadline); const overdue=days<0;
                  return (
                    <div key={item.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ width:7,height:7,borderRadius:"50%",flexShrink:0,background:overdue?"#EF4444":days<=14?"#F59E0B":C.limeD }}/>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0,fontSize:12,fontWeight:500,color:C.ink,letterSpacing:C.ls }}>{item.label}</p>
                        <p style={{ margin:"1px 0 0",fontSize:10,color:"#999",letterSpacing:C.ls }}>{fmtDate(item.deadline)} · {item.phase}</p>
                      </div>
                      <span style={{ fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:C.rxs,background:overdue?"#FEF2F2":"#F8FFE0",color:overdue?"#EF4444":C.limeD,letterSpacing:C.ls }}>
                        {overdue?`D+${Math.abs(days)}`:`D-${days}`}
                      </span>
                    </div>
                  );
                })}
                {timeline.filter(t=>!t.done&&daysUntil(t.deadline)<=60).length===0&&<p style={{ color:"#bbb",fontSize:13,textAlign:"center",padding:"16px 0",letterSpacing:C.ls }}>60일 내 마감 항목이 없어요 🎉</p>}
              </div>
            </div>

            <div style={S.cardW2}>
              <p style={{ margin:"0 0 9px",fontSize:12,fontWeight:700,color:C.ink,letterSpacing:C.ls }}>💬 의논 중인 항목</p>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {undecided.slice(0,8).map(i=>{
                  const g = discussions.find(g=>g.items.some(it=>it.id===i.id));
                  return (
                    <button key={i.id} onClick={()=>setTab("discussion")} style={{ background:C.card,border:`1.5px solid ${C.border}`,borderRadius:C.rsm,padding:"5px 11px",fontSize:11,fontWeight:500,color:C.ink,cursor:"pointer",fontFamily:C.font,letterSpacing:C.ls }}>
                      {g?.icon} {i.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab==="discussion" && <DiscussionTab discussions={discussions} onUpdate={updateDiscussion} onAddItem={addDiscussionItem} onDeleteItem={deleteDiscussionItem}/>}
        {tab==="budget"     && <BudgetTab budget={budget} onUpdate={updateBudget} onAdd={addBudgetItem} onDelete={deleteBudgetItem}/>}
        {tab==="timeline"   && <TimelineTab timeline={timeline} onToggle={toggleTimeline} onAdd={addTimelineItem} onDelete={deleteTimelineItem}/>}
        {tab==="reference"  && <ReferenceTab refImages={refImages} onAddImage={addRefImage} onDeleteImage={deleteRefImage} onUpdateMemo={updateMemo}/>}
      </div>

      {/* 하단 탭바 */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(255,255,255,0.88)",borderTop:`1px solid ${C.border}`,display:"flex",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:"9px 0 13px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative",fontFamily:C.font }}>
            <span style={{ fontSize:tab===t.id?20:18,lineHeight:1,transition:"font-size 0.15s" }}>{t.icon}</span>
            <span style={{ fontSize:9,fontWeight:tab===t.id?800:600,color:tab===t.id?C.ink:"#aaa",letterSpacing:C.ls }}>{t.label}</span>
            {tab===t.id && <div style={{ position:"absolute",bottom:0,width:16,height:3,borderRadius:2,background:C.ink }}/>}
          </button>
        ))}
      </div>
    </div>
  );
}
