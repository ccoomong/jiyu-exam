/* =========================================================
   지유의 시험 대비 ♡  —  앱 로직
   - 매번 랜덤 출제 (안 풀어본 문제 우선)
   - 보기 순서도 매번 섞기
   ========================================================= */

/* ---------- 문제마다 고유 id 부여 (출제 기록용) ---------- */
SUBJECTS.forEach(sub=>{
  sub.chapters.forEach(ch=>{
    ch.questions.forEach((q,i)=>{ q._id = sub.id+"/"+ch.id+"/"+i; });
  });
});

/* ---------- 출제 기록 (안 풀어본 문제 우선) ---------- */
const SEEN_KEY = "jiyu_seen_v2";
function loadSeen(){
  try{ return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||"[]")); }
  catch(e){ return new Set(); }
}
function saveSeen(set){
  try{ localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); }catch(e){}
}
/* pool에서 count개를 안 본 것 우선으로 뽑고, 다 봤으면 그 풀만 기록을 비워 다시 순환 */
function pickQuestions(pool, count){
  count = Math.min(count, pool.length);
  const seen = loadSeen();
  let unseen = shuffle(pool.filter(q=>!seen.has(q._id)));
  const chosen = [];
  for(const q of unseen){ if(chosen.length>=count) break; chosen.push(q); }
  if(chosen.length < count){
    // 안 본 게 부족하면: 이 풀의 기록을 비우고(순환) 나머지를 채움
    pool.forEach(q=> seen.delete(q._id));
    const rest = shuffle(pool.filter(q=>!chosen.includes(q)));
    for(const q of rest){ if(chosen.length>=count) break; chosen.push(q); }
  }
  chosen.forEach(q=> seen.add(q._id));
  saveSeen(seen);
  return shuffle(chosen);
}

/* ---------- 떠다니는 하트 ---------- */
(function heartsBg(){
  const layer = document.getElementById("hearts");
  const glyphs = ["♥","♡","💗","💕"];
  function spawn(){
    const h = document.createElement("div");
    h.className = "floaty";
    h.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
    h.style.left = Math.random()*100 + "vw";
    h.style.fontSize = (14 + Math.random()*26) + "px";
    h.style.animationDuration = (9 + Math.random()*8) + "s";
    h.style.opacity = (0.3 + Math.random()*0.4).toFixed(2);
    layer.appendChild(h);
    setTimeout(()=>h.remove(), 18000);
  }
  for(let i=0;i<8;i++) setTimeout(spawn, i*700);
  setInterval(spawn, 1300);
})();

/* ---------- 화면 전환 ---------- */
const screens = {
  home: document.getElementById("screen-home"),
  subject: document.getElementById("screen-subject"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result")
};
const topSub = document.getElementById("topSub");
function show(name){
  for(const k in screens) screens[k].classList.toggle("hidden", k!==name);
  window.scrollTo({top:0,behavior:"smooth"});
}

/* ---------- 유틸 ---------- */
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function el(tag, cls, html){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(html!=null) e.innerHTML = html;
  return e;
}
function countTypes(qs){
  let mc=0, essay=0;
  qs.forEach(q=> q.type==="essay" ? essay++ : mc++);
  return {mc, essay, total:qs.length};
}

/* 챕터별 랜덤 출제 개수 */
const CHAPTER_COUNT = 12;
const FULL_COUNT = 25;

/* =========================================================
   화면 1: 과목 선택
   ========================================================= */
function renderHome(){
  topSub.textContent = "우리 지유, 오늘도 화이팅! 과목을 골라봐 ♡";
  const sec = screens.home;
  sec.innerHTML = "";
  const grid = el("div","grid two");
  SUBJECTS.forEach(sub=>{
    const card = el("div","card" + (sub.ready ? "" : " locked"));
    card.appendChild(el("div","corner","♥"));
    card.appendChild(el("div","card-name", sub.name));
    card.appendChild(el("div","card-desc", sub.desc));
    if(sub.ready){
      const n = sub.chapters.reduce((s,c)=>s+c.questions.length,0);
      card.appendChild(el("div","badge", "챕터 "+sub.chapters.length+"개 · 문제 "+n+"개 ♡"));
      card.onclick = ()=> renderSubject(sub);
    }else{
      card.appendChild(el("div","badge soon", "자료 준비 중이에요 🌸"));
    }
    grid.appendChild(card);
  });
  sec.appendChild(grid);
  show("home");
}

/* =========================================================
   화면 2: 챕터 선택
   ========================================================= */
function renderSubject(sub){
  topSub.textContent = sub.name + " — 풀 때마다 다른 문제가 나와요 ♡";
  const sec = screens.subject;
  sec.innerHTML = "";

  const back = el("button","back","‹ 과목 다시 고르기");
  back.onclick = renderHome;
  sec.appendChild(back);

  sec.appendChild(el("div","section-h", sub.name + " 💗"));
  sec.appendChild(el("div","section-sub", "풀 때마다 안 풀어본 문제부터 랜덤으로 새로 나와요. 보기 순서도 매번 섞여요!"));

  /* 전체 범위 */
  const allQs = sub.chapters.flatMap(c=>c.questions);
  if(allQs.length){
    const fullCard = el("div","card");
    fullCard.style.cursor = "default";
    fullCard.appendChild(el("div","corner","★"));
    fullCard.appendChild(el("div","card-name","전체 범위 모의고사 ✨"));
    const ct = countTypes(allQs);
    fullCard.appendChild(el("div","card-desc",
      "전 챕터에서 랜덤 출제! (전체 문제풀: 객관식 "+ct.mc+" · 서술형 "+ct.essay+" · 총 "+ct.total+"개)"));
    const row = el("div","selfcheck");
    row.style.marginTop = "18px";
    const b1 = el("button","btn","랜덤 "+Math.min(FULL_COUNT,ct.total)+"문제 풀기 ♡");
    b1.onclick = ()=> startQuiz(sub.name+" · 전체 랜덤", allQs, FULL_COUNT);
    const b2 = el("button","btn ghost","전체 다 풀기 ("+ct.total+") 📚");
    b2.onclick = ()=> startQuiz(sub.name+" · 전체 범위", allQs, allQs.length);
    row.appendChild(b1); row.appendChild(b2);
    fullCard.appendChild(row);
    sec.appendChild(fullCard);
  }

  sec.appendChild(el("div","divider","<span>♡ 챕터별 연습 ♡</span>"));

  /* 챕터별 */
  const grid = el("div","grid chips");
  sub.chapters.forEach(ch=>{
    const card = el("div","card ch-card" + (ch.questions.length ? "" : " locked"));
    const top = el("div","ch-top");
    top.appendChild(el("div","card-name", ch.name));
    if(ch.sub) top.appendChild(el("div","ch-sub", ch.sub));
    card.appendChild(top);
    if(ch.questions.length){
      const ct = countTypes(ch.questions);
      const pick = Math.min(CHAPTER_COUNT, ct.total);
      card.appendChild(el("div","ch-count","랜덤 "+pick+"문제 출제 · (전체 "+ct.total+"개 보유) ♡"));
      card.onclick = ()=> startQuiz(sub.name+" · "+ch.name, ch.questions, CHAPTER_COUNT);
    }else{
      card.appendChild(el("div","ch-count","아직 문제가 없어요 🌸"));
    }
    grid.appendChild(card);
  });
  sec.appendChild(grid);
  show("subject");
}

/* =========================================================
   화면 3: 퀴즈
   ========================================================= */
let QZ = null;
function startQuiz(title, pool, count){
  const questions = pickQuestions(pool, count);
  questions.forEach(q=>{ delete q._done; });   // 재출제 대비 상태 초기화
  QZ = {
    title, pool, count,
    questions,
    idx: 0,
    mcTotal: 0, mcCorrect: 0,
    essayTotal: 0, essayGood: 0,
    answered: []
  };
  QZ.questions.forEach(q=>{ q.type==="essay" ? QZ.essayTotal++ : QZ.mcTotal++; });
  topSub.textContent = "집중! 천천히 풀어도 괜찮아 ♡";
  renderQuestion();
  show("quiz");
}

function renderQuestion(){
  const sec = screens.quiz;
  sec.innerHTML = "";
  const q = QZ.questions[QZ.idx];
  const total = QZ.questions.length;

  const back = el("button","back","‹ 그만 풀기");
  back.onclick = ()=>{
    if(confirm("지금까지 푼 건 사라져. 정말 그만 풀까?")) renderHome();
  };
  sec.appendChild(back);

  const head = el("div","quiz-head");
  head.appendChild(el("div","quiz-title", QZ.title));
  sec.appendChild(head);

  /* 진행바 */
  const pw = el("div","progress-wrap");
  const track = el("div","progress-track");
  const fill = el("div","progress-fill");
  fill.style.width = ((QZ.idx)/total*100)+"%";
  track.appendChild(fill);
  pw.appendChild(track);
  const meta = el("div","progress-meta");
  meta.appendChild(el("span",null,"문제 "+(QZ.idx+1)+" / "+total));
  meta.appendChild(el("span",null,"맞춘 객관식 "+QZ.mcCorrect+" / "+QZ.mcTotal+" ♡"));
  pw.appendChild(meta);
  sec.appendChild(pw);

  /* 문제 카드 */
  const card = el("div","qcard");
  if(q.type==="essay") card.appendChild(el("div","qtype essay","✍ 서술형"));
  else card.appendChild(el("div","qtype mc","◎ 객관식"));
  card.appendChild(el("div","qtext", q.q));

  if(q.type==="mc") renderMC(card, q);
  else renderEssay(card, q);

  sec.appendChild(card);
  setTimeout(()=>{ fill.style.width = ((QZ.idx+ (q._done?1:0.06))/total*100)+"%"; },50);
}

/* ----- 객관식 (보기 순서 매번 섞기) ----- */
function renderMC(card, q){
  const wrap = el("div","options");
  const letters = ["A","B","C","D","E"];

  // 보기 섞기: {text, isAnswer} 형태로 섞은 뒤 정답 위치 재계산
  const shuffled = shuffle(q.options.map((text,i)=>({text, isAnswer:i===q.answer})));
  const correctIdx = shuffled.findIndex(o=>o.isAnswer);

  const opts = [];
  shuffled.forEach((o,i)=>{
    const btn = el("button","opt");
    btn.appendChild(el("span","mark", letters[i]));
    btn.appendChild(el("span",null, o.text));
    btn.onclick = ()=> chooseMC(i);
    wrap.appendChild(btn);
    opts.push(btn);
  });
  card.appendChild(wrap);

  const explain = el("div","explain");
  card.appendChild(explain);

  const nav = el("div","nav");
  nav.appendChild(el("div"));
  const next = el("button","btn", QZ.idx<QZ.questions.length-1 ? "다음 ♡" : "결과 보기 🎀");
  next.style.visibility = "hidden";
  nav.appendChild(next);
  card.appendChild(nav);

  function chooseMC(i){
    if(q._done) return;
    q._done = true;
    opts.forEach((o,k)=>{
      o.classList.add("disabled");
      if(k===correctIdx) o.classList.add("correct");
      if(k===i && i!==correctIdx) o.classList.add("wrong");
    });
    const ok = (i===correctIdx);
    if(ok) QZ.mcCorrect++;
    QZ.answered.push({type:"mc", ok});
    explain.innerHTML = (ok ? "<b>정답이야! 잘했어 💗</b><br/>" : "<b>아쉬워! 정답은 "+letters[correctIdx]+"번이야 🌸</b><br/>") + q.explain;
    explain.classList.add("show");
    next.style.visibility = "visible";
  }
  next.onclick = goNext;
}

/* ----- 서술형 ----- */
function renderEssay(card, q){
  const ta = el("textarea","answer");
  ta.placeholder = "여기에 답을 적어보고, 아래 '모범답안 보기'로 확인해봐 ♡ (안 적고 바로 봐도 괜찮아!)";
  card.appendChild(ta);

  const reveal = el("button","btn ghost","모범답안 보기 ✨");
  reveal.style.marginTop = "16px";
  card.appendChild(reveal);

  const model = el("div","model");
  model.appendChild(el("div","mh","모범답안 💌"));
  model.appendChild(el("div","mbody", q.model));
  if(q.keywords && q.keywords.length){
    const kwLabel = el("div",null,"꼭 들어가면 좋은 키워드 ♡");
    kwLabel.style.cssText="font-family:'Gaegu',sans-serif;font-weight:700;color:#6b7fd0;margin-top:14px;font-size:14px;";
    model.appendChild(kwLabel);
    const kw = el("div","kw");
    q.keywords.forEach(k=> kw.appendChild(el("span",null,k)));
    model.appendChild(kw);
  }
  card.appendChild(model);

  const nav = el("div","nav");
  nav.appendChild(el("div"));
  const next = el("button","btn", QZ.idx<QZ.questions.length-1 ? "다음 ♡" : "결과 보기 🎀");
  next.style.visibility = "hidden";
  nav.appendChild(next);
  card.appendChild(nav);

  reveal.onclick = ()=>{
    model.classList.add("show");
    reveal.classList.add("hidden");
    if(!q._done){
      q._done = true;
      const sc = el("div","selfcheck");
      sc.appendChild(el("span","lbl","스스로 채점해볼까? →"));
      const good = el("button","btn ghost","잘 썼어! 💗");
      const again = el("button","btn ghost","다시 볼래 🌸");
      const finish = ()=>{ good.disabled=true; again.disabled=true; next.style.visibility="visible"; };
      good.onclick = ()=>{ QZ.essayGood++; QZ.answered.push({type:"essay",ok:true}); finish(); };
      again.onclick = ()=>{ QZ.answered.push({type:"essay",ok:false}); finish(); };
      sc.appendChild(good); sc.appendChild(again);
      model.appendChild(sc);
    } else {
      next.style.visibility = "visible";
    }
  };
  next.onclick = goNext;
}

function goNext(){
  if(QZ.idx < QZ.questions.length-1){
    QZ.idx++;
    renderQuestion();
  } else {
    renderResult();
  }
}

/* =========================================================
   화면 4: 결과
   ========================================================= */
function renderResult(){
  const sec = screens.result;
  sec.innerHTML = "";
  const mcT = QZ.mcTotal, mcC = QZ.mcCorrect;
  const esT = QZ.essayTotal, esG = QZ.essayGood;
  const pct = mcT ? Math.round(mcC/mcT*100) : (esT ? Math.round(esG/esT*100) : 100);

  let emoji, msg;
  if(pct>=90){ emoji="🏆"; msg="우와 완벽해!! 지유 천재야 💗\n이대로면 시험 만점각이야!"; }
  else if(pct>=70){ emoji="🌸"; msg="아주 잘하고 있어!\n조금만 더 다듬으면 완벽해 ♡"; }
  else if(pct>=50){ emoji="🍀"; msg="좋아, 반 이상 맞췄어!\n틀린 것만 다시 보면 금방 늘 거야 ♡"; }
  else { emoji="💪"; msg="괜찮아, 지금부터가 진짜 공부야!\n한 번 더 풀면 분명히 늘어 ♡"; }

  const box = el("div","result");
  box.appendChild(el("div","big-emoji", emoji));
  box.appendChild(el("div","score-ring", pct+"점"));
  box.appendChild(el("div","score-label", QZ.title));
  box.appendChild(el("div","result-msg", msg.replace(/\n/g,"<br/>")));

  const stats = el("div","result-stats");
  if(mcT){
    const s = el("div","stat");
    s.appendChild(el("div","n", mcC+" / "+mcT));
    s.appendChild(el("div","t","객관식 정답"));
    stats.appendChild(s);
  }
  if(esT){
    const s = el("div","stat");
    s.appendChild(el("div","n", esG+" / "+esT));
    s.appendChild(el("div","t","서술형 (스스로 OK)"));
    stats.appendChild(s);
  }
  box.appendChild(stats);

  const actions = el("div","result-actions");
  const retry = el("button","btn","새 문제로 또 풀기 🔄");  // 매번 새 랜덤 출제
  retry.onclick = ()=> startQuiz(QZ.title, QZ.pool, QZ.count);
  const home = el("button","btn ghost","과목 선택으로 🏠");
  home.onclick = renderHome;
  actions.appendChild(retry);
  actions.appendChild(home);
  box.appendChild(actions);

  sec.appendChild(box);
  burst();
  topSub.textContent = "수고했어 지유야! 정말 잘했어 ♡";
  show("result");
}

function burst(){
  const layer = document.getElementById("hearts");
  for(let i=0;i<24;i++){
    setTimeout(()=>{
      const h = el("div","floaty","♥");
      h.style.left = (20+Math.random()*60)+"vw";
      h.style.bottom = "10vh";
      h.style.color = ["#ff7ea8","#ef5b8c","#ffb3c9","#ff9ec0"][i%4];
      h.style.fontSize = (18+Math.random()*22)+"px";
      h.style.animationDuration = (4+Math.random()*3)+"s";
      h.style.opacity = "0.9";
      layer.appendChild(h);
      setTimeout(()=>h.remove(), 7000);
    }, i*60);
  }
}

/* ---------- 시작 ---------- */
renderHome();
