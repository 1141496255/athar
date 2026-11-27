/* ===========================================================
   أثر — Athar
   يساند مريض الزهايمر وأسرته، ويفهم احتياجه نيابةً عنه
   Vanilla JS PWA · data stays on the device (localStorage)
   =========================================================== */
(() => {
'use strict';

const phone = document.getElementById('phone');
const appEl = document.getElementById('app');
const KEY = 'athar.v1';
const H = 3600e3, M = 60e3;

/* ---------------- Helpers ---------------- */
const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = v => String(v).replace(/\d/g, d => AR[d]);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const plural = (n, one, two, many) => n === 1 ? one : n === 2 ? two : (n <= 10 ? ar(n) + ' ' + many : ar(n) + ' ' + one);
function dur(ms){
  const m = Math.max(0, Math.round(ms / M));
  if (m < 1) return 'أقل من دقيقة';
  if (m < 60) return plural(m, 'دقيقة', 'دقيقتين', 'دقائق');
  const h = Math.floor(m / 60), r = m % 60;
  let s = plural(h, 'ساعة', 'ساعتين', 'ساعات');
  if (r >= 10 && h < 6) s += ' و' + plural(r, 'دقيقة', 'دقيقتين', 'دقائق');
  return s;
}
function durShort(ms){
  const m = Math.max(0, Math.round(ms / M)); if (m < 60) return ar(m) + ' د';
  const h = Math.floor(m / 60), r = m % 60; return ar(h) + ' س' + (r && h < 10 ? ' ' + ar(r) + ' د' : '');
}
function fmtTime(d){ d = new Date(d); const h = d.getHours(), m = d.getMinutes(); return ar((h % 12 || 12) + ':' + String(m).padStart(2, '0')) + (h < 12 ? ' ص' : ' م'); }
function hhmm(t){ const [h, m] = t.split(':').map(Number); return ar((h % 12 || 12) + ':' + String(m).padStart(2, '0')) + (h < 12 ? ' ص' : ' م'); }
function todayAt(t){ const [h, m] = t.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; }
function dayLabel(ts){
  const d = new Date(ts), n = new Date(); const diff = Math.floor((new Date(n.toDateString()) - new Date(d.toDateString())) / 864e5);
  return diff === 0 ? 'اليوم' : diff === 1 ? 'أمس' : 'قبل ' + plural(diff, 'يوم', 'يومين', 'أيام');
}
const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch(e){} };

/* ---------------- Icons ---------------- */
const P = {
  home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book:'<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5"/><path d="M20 19v3H6.5"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  watch:'<rect x="6" y="6" width="12" height="12" rx="3.5"/><path d="M9 6l1-4h4l1 4M9 18l1 4h4l1-4M12 10v2l1.5 1.5"/>',
  drop:'<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>',
  door:'<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"/><circle cx="15" cy="12" r="1"/>',
  food:'<path d="M7 2v20M4 2v6a3 3 0 0 0 6 0V2M17 2c-2 2-3 5-3 8h3v12"/>',
  pill:'<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  mosque:'<path d="M4 21v-9a8 5.5 0 0 1 16 0v9M2 21h20M12 2v4M9 21v-4a3 3 0 0 1 6 0v4"/>',
  pin:'<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  back:'<path d="m9 6 6 6-6 6"/>',
  fwd:'<path d="m15 6-6 6 6 6"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  volume:'<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  spark:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  hand:'<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  nav:'<path d="M3 11l19-9-9 19-2-8z"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  coffee:'<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
  house:'<path d="M3 10.5 12 3l9 7.5M5 9v12h14V9"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  brain:'<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04"/>',
};
const ic = (n, s = 22, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;

/* ---------------- Domain model ---------------- */
const NEEDS = {
  bathroom:{ t:'يبي الحمام', s:'الحمام', e:'🚻', log:'bathroom',
    a:'خذه للحمام بهدوء، وقل له: «تعال نتوضأ» — هالكلمة أهون عليه من «الحمام».' },
  thirst:{ t:'عطشان', s:'عطش', e:'💧', log:'water',
    a:'قدّم له ماء في كاسته المعتادة، وخلك قدامه لين يشرب.' },
  hunger:{ t:'جوعان', s:'جوع', e:'🍽️', log:'food',
    a:'قدّم له شي خفيف يحبه، تمر وقهوة غالبًا تهدّيه.' },
  pain:{ t:'متألم', s:'ألم', e:'🩹',
    a:'افحص مكان الألم المعتاد بلطف، ولو استمر راجع الدواء أو كلّم الطبيب.' },
  tired:{ t:'تعبان ويبي ينام', s:'تعب', e:'😴',
    a:'خفّف الإضاءة والأصوات، وساعده يرتاح في مكانه المعتاد.' },
  lonely:{ t:'يبي ونس', s:'ونس', e:'🤝',
    a:'اجلس جنبه وامسك يده، وكلمه عن أيام زمان أو شغّل له صوت يعرفه.' },
  scared:{ t:'خايف أو مشوّش', s:'خوف', e:'🫂',
    a:'طمّنه بصوت هادي ولا تجادله. قل له إنه في بيته وإنك معه.' },
  temp:{ t:'بردان أو حرّان', s:'حرارة', e:'🌡️',
    a:'تأكد من حرارة الغرفة ولبسه، وغطّه أو خفّف عنه.' },
  out:{ t:'يبي يطلع', s:'طلعة', e:'🚪',
    a:'لا تمنعه بقوة. امشِ معه خطوات ثم حوّل انتباهه، وتأكد إن الباب مقفل.' },
};
const BEH = [
  { id:'restless', t:'يقوم ويقعد', e:'🔄', w:{bathroom:2, pain:.6, scared:.6, out:.8} },
  { id:'pacing', t:'يمشي رايح جاي', e:'🚶', w:{out:1.4, scared:1, bathroom:1, lonely:.6} },
  { id:'pants', t:'يشد ملابسه', e:'👖', w:{bathroom:2.4, temp:.8} },
  { id:'belly', t:'يمسك بطنه', e:'✋', w:{bathroom:1.4, hunger:1.2, pain:1.2} },
  { id:'lips', t:'يلحس شفايفه', e:'👄', w:{thirst:2.4, hunger:.4} },
  { id:'kitchen', t:'يدور في المطبخ', e:'🫖', w:{hunger:2.2, thirst:1.2} },
  { id:'grimace', t:'يتأفف أو ملامحه متألمة', e:'😣', w:{pain:2.4} },
  { id:'knee', t:'يمسك ركبته', e:'🦵', w:{pain:2.6} },
  { id:'eyes', t:'يفرك عيونه', e:'😪', w:{tired:2.4} },
  { id:'shout', t:'يرفع صوته أو يعصّب', e:'📢', w:{tired:1, pain:1, scared:1.2, bathroom:.6} },
  { id:'calls', t:'ينادي أحد', e:'🗣️', w:{lonely:2.4, scared:.8} },
  { id:'door', t:'يروح للباب', e:'🚪', w:{out:2.4, bathroom:.8} },
  { id:'silent', t:'ساكت ويرفض الكلام', e:'🤐', w:{scared:1.4, pain:.8, lonely:1} },
  { id:'shiver', t:'يرتجف أو يتغطّى', e:'🥶', w:{temp:2.4, scared:.4} },
  { id:'sweat', t:'يعرق أو يفصخ', e:'🥵', w:{temp:2.2} },
  { id:'cry', t:'يبكي', e:'😢', w:{lonely:1.6, pain:1, scared:1.2} },
];
const behById = id => BEH.find(b => b.id === id);
const PRAYERS = [['الفجر','05:00'],['الظهر','11:50'],['العصر','14:55'],['المغرب','17:15'],['العشاء','18:45']];
const PLACE_TYPES = { mosque:['المسجد','mosque'], home:['بيت قديم','house'], shop:['محل / دكان','coffee'], park:['حديقة / ممشى','leaf'], family:['بيت أقارب','users'], other:['مكان آخر','pin'] };
const ROUTINE_ICONS = { mosque:'mosque', food:'food', pill:'pill', sun:'sun', moon:'moon', coffee:'coffee', heart:'heart' };

/* ---------------- Seed (demo family) ---------------- */
function seed(){
  const now = Date.now();
  const ev = (daysAgo, hour, beh, predicted, actual) => {
    const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
    return { id: uid(), ts: d.getTime(), beh, predicted, actual };
  };
  return {
    onboarded:false,
    patient:{ name:'عبدالله', nick:'أبو محمد', age:78, stage:'مرحلة متوسطة' },
    caregiver:{ name:'محمد', relation:'ولده', phone:'' },
    logs:{ water: now - 3.2*H, bathroom: now - 2.4*H, food: now - 1.6*H, meds: now - 5*H },
    routine:[
      { id:uid(), time:'05:00', title:'صلاة الفجر في المسجد', note:'يصحى لحاله قبل الأذان', icon:'mosque' },
      { id:uid(), time:'07:30', title:'الفطور', note:'تمر وقهوة بالهيل وخبز بر', icon:'food' },
      { id:uid(), time:'08:00', title:'دواء الصباح', note:'أملوديبين + ميتفورمين', icon:'pill' },
      { id:uid(), time:'10:00', title:'يسقي الزرع في الحوش', note:'يحب يقعد في الشمس ساعة', icon:'sun' },
      { id:uid(), time:'11:50', title:'صلاة الظهر', note:'يحب يروح المسجد مشي', icon:'mosque' },
      { id:uid(), time:'13:00', title:'الغداء', note:'رز ولحم، ما يحب الحار', icon:'food' },
      { id:uid(), time:'14:00', title:'قيلولة', note:'ساعة تقريبًا في غرفته', icon:'moon' },
      { id:uid(), time:'14:55', title:'صلاة العصر', note:'', icon:'mosque' },
      { id:uid(), time:'16:30', title:'قهوة العصر مع العائلة', note:'أهدأ وقت عنده لو حوله أحد', icon:'coffee' },
      { id:uid(), time:'17:15', title:'صلاة المغرب', note:'وقت المغرب يزيد عنده القلق', icon:'mosque' },
      { id:uid(), time:'19:30', title:'العشاء ودواء المساء', note:'دونيبيزيل بعد الأكل', icon:'pill' },
      { id:uid(), time:'21:30', title:'النوم', note:'يحب يسمع قرآن قبل ينام', icon:'moon' },
    ],
    expressions:[
      { id:uid(), need:'bathroom', text:'يقوم ويقعد ويشد بنطلونه، وأحيانًا يروح جهة الباب' },
      { id:uid(), need:'thirst', text:'يلحس شفايفه ويطالع الكاسة بدون ما يطلب' },
      { id:uid(), need:'hunger', text:'يسأل «متى الغدا؟» أكثر من مرة ويدور في المطبخ' },
      { id:uid(), need:'pain', text:'يمسك ركبته اليمين ويتأفف' },
      { id:uid(), need:'tired', text:'يفرك عيونه ويعصّب بسرعة' },
      { id:uid(), need:'lonely', text:'يسأل عن أهله وينادي أسماء قديمة' },
      { id:uid(), need:'scared', text:'يسكت ويطالع حوله بخوف، خصوصًا وقت المغرب' },
    ],
    calming:[
      { id:uid(), title:'صوت القرآن', text:'سورة يس بصوت هادي — تهدّيه خلال دقائق' },
      { id:uid(), title:'كلمة تطمّنه', text:'«البيت بيتك يا أبو محمد، وأنا محمد ولدك»' },
      { id:uid(), title:'فنجال قهوة', text:'قهوة بالهيل وتمرتين سكري' },
      { id:uid(), title:'مشي في الحوش', text:'تمسك يده وتمشون بين الزرع' },
      { id:uid(), title:'صور المزرعة', text:'ألبوم صور مزرعته القديمة في القصيم' },
      { id:uid(), title:'تجنّب', text:'لا ترفع صوتك ولا تجادله ولا تقول له «نسيت»' },
    ],
    health:[
      { id:uid(), kind:'condition', title:'الزهايمر — مرحلة متوسطة', text:'التشخيص ١٤٤٤هـ، عيادة الذاكرة' },
      { id:uid(), kind:'condition', title:'ضغط وسكر النوع الثاني', text:'مستقر مع الأدوية' },
      { id:uid(), kind:'med', title:'دونيبيزيل ١٠ ملغ', text:'مرة يوميًا — بعد العشاء' },
      { id:uid(), kind:'med', title:'أملوديبين ٥ ملغ', text:'مرة يوميًا — الصباح' },
      { id:uid(), kind:'med', title:'ميتفورمين ٥٠٠ ملغ', text:'مع الفطور والعشاء' },
      { id:uid(), kind:'allergy', title:'حساسية بنسلين', text:'مهم جدًا — يُبلغ أي طبيب' },
      { id:uid(), kind:'contact', title:'د. سارة — عيادة الذاكرة', text:'المراجعة كل ٣ شهور' },
    ],
    places:[
      { id:uid(), name:'مسجد الحي', type:'mosque', note:'يصلي فيه كل فرض من ٣٠ سنة', dist:450 },
      { id:uid(), name:'بيته القديم في الملز', type:'home', note:'عاش فيه ٤٠ سنة ويسأل عنه وقت المغرب', dist:6200 },
      { id:uid(), name:'بقالة أبو سعد', type:'shop', note:'كان يشتري منها الجريدة كل صبح', dist:900 },
      { id:uid(), name:'ممشى الحي', type:'park', note:'كان يمشي فيه بعد العصر', dist:1100 },
      { id:uid(), name:'بيت أخته أم فهد', type:'family', note:'كان يزورها كل جمعة', dist:3400 },
    ],
    learn:{ door:{ bathroom:1 }, restless:{ bathroom:.5 }, silent:{ scared:.6 } },
    placeVisits:{},
    events:[
      ev(6,15,['restless','pants'],'bathroom','bathroom'),
      ev(5,17,['silent','pacing'],'scared','scared'),
      ev(5,11,['lips'],'thirst','thirst'),
      ev(4,16,['door','restless'],'out','bathroom'),
      ev(3,12,['kitchen','belly'],'hunger','hunger'),
      ev(3,17,['calls','cry'],'lonely','lonely'),
      ev(2,15,['restless','door'],'bathroom','bathroom'),
      ev(1,14,['eyes','shout'],'tired','tired'),
      ev(1,10,['knee','grimace'],'pain','pain'),
      ev(0,9,['lips','kitchen'],'thirst','thirst'),
    ],
    wanderLog:[],
    geofence:{ on:true, radius:200 },
  };
}

/* ---------------- Store ---------------- */
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch(e){ S = seed(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} };

/* ---------------- Engine: understand the need ---------------- */
function timeScores(now = Date.now()){
  const h = (now - S.logs.bathroom) / H, w = (now - S.logs.water) / H, f = (now - S.logs.food) / H;
  const hour = new Date(now).getHours() + new Date(now).getMinutes() / 60;
  const sc = { bathroom: Math.max(0, Math.min(3, (h - 1.2) * .9)), thirst: Math.max(0, Math.min(3, (w - 1.5) * .9)),
    hunger: Math.max(0, Math.min(2.5, (f - 3) * .7)), tired:0, scared:0, out:0, lonely:.2, pain:.2, temp:.1 };
  const why = {};
  if (h > 1.5) why.bathroom = `آخر مرة دخل الحمام قبل ${dur(now - S.logs.bathroom)}`;
  if (w > 1.5) why.thirst = `آخر مرة شرب قبل ${dur(now - S.logs.water)}`;
  if (f > 3) why.hunger = `آخر وجبة قبل ${dur(now - S.logs.food)}`;
  // routine: nap & sleep
  const nap = S.routine.find(r => r.icon === 'moon');
  S.routine.filter(r => r.icon === 'moon').forEach(r => {
    const d = (now - todayAt(r.time)) / H;
    if (d > -0.75 && d < 1) { sc.tired += 1.4; why.tired = `قرب وقت «${r.title}» في روتينه (${hhmm(r.time)})`; }
  });
  if (hour >= 16 && hour <= 19.5) { sc.scared += .9; why.scared = 'وقت المغرب — قلقه يزيد عادةً في هالوقت'; }
  const pr = nearPrayer(now);
  if (pr && pr.diff > -40 && pr.diff < 30) { sc.out += 1.3; why.out = `وقت صلاة ${pr.name} — من عادته يطلع للمسجد`; }
  return { sc, why };
}
function nearPrayer(now = Date.now()){
  let best = null;
  PRAYERS.forEach(([name, t]) => { const diff = (todayAt(t) - now) / M; if (!best || Math.abs(diff) < Math.abs(best.diff)) best = { name, t, diff }; });
  return best;
}
function nextPrayer(now = Date.now()){
  for (const [name, t] of PRAYERS) { const d = (todayAt(t) - now) / M; if (d > 0) return { name, t, diff:d }; }
  return { name:'الفجر', t:'05:00', diff: (todayAt('05:00').getTime() + 864e5 - now) / M };
}
function analyze(behIds){
  const { sc, why } = timeScores();
  const score = {}; const reasons = {};
  Object.keys(NEEDS).forEach(n => { score[n] = sc[n] || 0; reasons[n] = why[n] ? [why[n]] : []; });
  behIds.forEach(id => {
    const b = behById(id); const L = S.learn[id] || {};
    Object.keys(NEEDS).forEach(n => {
      const v = (b.w[n] || 0) + (L[n] || 0);
      score[n] += v;
      if (v >= 1.4) reasons[n].push(L[n] >= 1 ? `«${b.t}» — تعلّم أثر إنها غالبًا تعني ${NEEDS[n].s} عنده` : `«${b.t}» علامة معروفة على ${NEEDS[n].s}`);
    });
  });
  // caregiver's own words about how he expresses each need
  S.expressions.forEach(x => { if (score[x.need] > 1.5 && reasons[x.need].length < 3) reasons[x.need].push(`الأسرة كتبت: «${x.text}»`); });
  // personal history (last 30 events)
  const hist = {}; S.events.slice(-30).forEach(e => hist[e.actual] = (hist[e.actual] || 0) + 1);
  Object.keys(hist).forEach(n => score[n] += hist[n] * .08);
  const vals = Object.entries(score).map(([n, v]) => [n, Math.exp(v * .72)]);
  const sum = vals.reduce((a, [, v]) => a + v, 0);
  const ranked = vals.map(([n, v]) => ({ need:n, p: v / sum, reasons: reasons[n] })).sort((a, b) => b.p - a.p);
  return ranked;
}
function learnFrom(behIds, predicted, actual){
  behIds.forEach(id => {
    S.learn[id] = S.learn[id] || {};
    S.learn[id][actual] = Math.min(4, (S.learn[id][actual] || 0) + .7);
    if (predicted !== actual) S.learn[id][predicted] = Math.max(-1.5, (S.learn[id][predicted] || 0) - .35);
  });
  S.events.push({ id:uid(), ts:Date.now(), beh:behIds, predicted, actual });
  const lg = NEEDS[actual].log; if (lg) S.logs[lg] = Date.now();
  save();
}
function accuracy(){
  const last = S.events.slice(-12); if (!last.length) return 0;
  return Math.round(last.filter(e => e.predicted === e.actual).length / last.length * 100);
}
function knowledge(){
  const items = S.routine.length + S.expressions.length * 1.5 + S.calming.length + S.health.length + S.places.length;
  return Math.min(98, Math.round(20 + items * 1.3 + S.events.length * 1.6));
}

/* ---------------- Engine: wandering ---------------- */
function predictPlaces(now = Date.now()){
  const hour = new Date(now).getHours();
  const pr = nearPrayer(now);
  const prayerNow = pr && pr.diff > -45 && pr.diff < 35;
  const sc = S.places.map(p => {
    let s = 1.2 - Math.min(1, p.dist / 8000);
    let why = '';
    if (p.type === 'mosque' && prayerNow) { s += 3; why = `وقت صلاة ${pr.name}، غالبًا رايح المسجد`; }
    if (p.type === 'home' && hour >= 16 && hour <= 21) { s += 1.8; why = why || 'وقت المغرب يزيد حنينه، غالبًا يدوّر على بيته القديم'; }
    if (p.type === 'shop' && hour >= 6 && hour <= 11) { s += 1.4; why = why || 'من عادته يروح البقالة الصبح'; }
    if (p.type === 'park' && hour >= 15 && hour <= 18) { s += 1.2; why = why || 'هذا وقت مشيه المعتاد'; }
    if (p.type === 'family' && new Date(now).getDay() === 5) { s += 1.4; why = why || 'يوم الجمعة كان يزور أهله'; }
    s += (S.placeVisits[p.id] || 0) * .5;
    return { place:p, s, why };
  });
  const sum = sc.reduce((a, x) => a + Math.exp(x.s), 0);
  return sc.map(x => ({ ...x, p: Math.exp(x.s) / sum })).sort((a, b) => b.p - a.p);
}

/* ---------------- Alerts (proactive) ---------------- */
function alerts(){
  const now = Date.now(), out = [], nick = S.patient.nick;
  const w = now - S.logs.water, b = now - S.logs.bathroom;
  if (w > 2.5*H) out.push({ lvl:'warn', icon:'drop', t:`صار له ${dur(w)} ما شرب`, s:'قدّم له ماء قبل ما يتضايق — العطش عنده يطلع قلق', act:['water','شرب ✓'] });
  if (b > 3*H) out.push({ lvl:'warn', icon:'door', t:`صار له ${dur(b)} ما دخل الحمام`, s:'خذه بهدوء وقل له: «تعال نتوضأ»', act:['bathroom','دخل ✓'] });
  const np = nextPrayer(now);
  if (np.diff < 35) out.push({ lvl:'info', icon:'mosque', t:`باقي ${dur(np.diff*M)} على صلاة ${np.name}`, s:`غالبًا ${nick} بيبي يطلع للمسجد — خلك قريب منه أو روح معه` });
  const hour = new Date().getHours();
  const calm = S.calming[0];
  if (hour >= 16 && hour < 20 && calm) out.push({ lvl:'info', icon:'heart', t:'وقت المغرب يزيد قلقه عادةً', s:`جرّب «${calm.title}» — ${calm.text}` });
  S.routine.filter(r => r.icon === 'pill').forEach(r => {
    const d = (now - todayAt(r.time)) / M;
    if (d > -20 && d < 60 && now - S.logs.meds > 3*H) out.push({ lvl:'warn', icon:'pill', t:`حان وقت ${r.title}`, s:r.note || '', act:['meds','أخذه ✓'] });
  });
  return out;
}

/* ---------------- UI primitives ---------------- */
let toastT;
function toast(msg, icon = 'check'){
  let t = phone.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; phone.appendChild(t); }
  t.innerHTML = ic(icon, 20) + `<span>${msg}</span>`;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}
function sheet(html, mount){
  closeSheet(true);
  const o = document.createElement('div'); o.className = 'overlay';
  o.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`;
  o.addEventListener('click', e => { if (e.target === o) closeSheet(); });
  phone.appendChild(o); requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('show')));
  mount && mount(o);
  return o;
}
function closeSheet(now){
  phone.querySelectorAll('.overlay').forEach(o => { if (now) return o.remove(); o.classList.remove('show'); setTimeout(() => o.remove(), 380); });
}
function openPage(html, cls = 'page'){
  const p = document.createElement('div'); p.className = cls; p.innerHTML = html; phone.appendChild(p); return p;
}
function closePage(sel = '.page'){ const ps = phone.querySelectorAll(sel); const p = ps[ps.length - 1]; if (p) p.remove(); }
const gauge = (ratio, color, icon) => {
  const C = 2 * Math.PI * 22, r = Math.min(1, ratio);
  return `<div class="gauge"><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="#EEF3F2" stroke-width="5"/>
  <circle cx="26" cy="26" r="22" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - r)}" style="transition:stroke-dashoffset 1s"/></svg>
  <div class="gi" style="color:${color}">${ic(icon, 20)}</div></div>`;
};
const ring = (pct, size = 62, stroke = 6, color = '#E9C98C', track = 'rgba(255,255,255,.2)') => {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}"/></svg>`;
};

/* ---------------- Router ---------------- */
let tab = 'home';
function render(){
  const screens = { home: Home, profile: Profile, insights: Insights, watch: Watch };
  appEl.innerHTML = `<div class="screen" id="scr">${screens[tab]()}</div>${Nav()}`;
}
function go(t){ tab = t; render(); }
function Nav(){
  const b = (id, icon, label) => `<button class="${tab === id ? 'on' : ''}" onclick="A.go('${id}')"><span class="ni">${ic(icon, 22)}</span>${label}</button>`;
  return `<nav class="nav">${b('home','home','الرئيسية')}${b('profile','book','ملف المريض')}
    <button class="fab" onclick="A.distress()" aria-label="المريض متضايق">${ic('hand', 30, 2)}</button>
    ${b('insights','chart','الفهم')}${b('watch','watch','الساعة')}</nav>`;
}

/* ---------------- Screen: Home ---------------- */
function Home(){
  const now = Date.now(), p = S.patient, al = alerts();
  const warn = al.some(a => a.lvl === 'warn');
  const lastEv = S.events[S.events.length - 1];
  const greet = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
  const T = (key, label, interval, icon, btn) => {
    const el = now - S.logs[key], r = el / interval, late = r > 1, fresh = el < 20*M;
    const color = late ? '#E9A64B' : '#4FA59E';
    return `<div class="tracker ${late ? 'late' : fresh ? 'done' : ''}"><div class="row">${gauge(r, color, icon)}
      <div><b>${label}</b><small>آخر مرة</small><div class="t num">${fresh ? 'الحين' : 'قبل ' + durShort(el)}</div></div></div>
      <button onclick="A.log('${key}')">${fresh ? ic('check', 16) : ''} ${btn}</button></div>`;
  };
  const items = S.routine.slice().sort((a, b) => a.time.localeCompare(b.time));
  let idx = items.findIndex(r => todayAt(r.time) > now); if (idx < 0) idx = items.length;
  const slice = items.slice(Math.max(0, idx - 1), Math.max(0, idx - 1) + 4);
  return `
  <div class="top">
    <div style="display:flex;gap:12px;align-items:center"><div class="mark"></div>
      <div class="hello"><small>${greet} يا ${esc(S.caregiver.name)}</small><b>كيف ${esc(p.nick)} اليوم؟</b></div></div>
    <button class="icon-btn" onclick="A.settings()" aria-label="الإعدادات">${ic('gear', 21)}</button>
  </div>

  <div class="hero">
    <div class="hero-row">
      <div class="avatar">${esc(p.name.trim()[0] || 'أ')}</div>
      <div><h2>${esc(p.name)} <span style="opacity:.75;font-weight:400;font-size:15px">· ${esc(p.nick)}</span></h2>
      <small>${ar(p.age)} سنة · ${esc(p.stage)}</small></div>
    </div>
    <div class="mood ${warn ? 'warn' : ''}"><span class="dot"></span>
      <b>${warn ? 'انتبه له — فيه حاجة قريبة' : 'مرتاح ومطمئن'}</b>
      <span>${lastEv ? 'آخر ضيق ' + dayLabel(lastEv.ts) : ''}</span></div>
  </div>

  <button class="cta" onclick="A.distress()">
    <span class="ic">${ic('hand', 26)}</span>
    <span><b>${esc(p.nick)} متضايق الحين؟</b><small>أثر يقرأ سلوكه ويقول لك وش يحتاج</small></span>
    <span class="arrow">${ic('fwd', 22)}</span>
  </button>

  <div class="wrap">
    <div class="sec-h"><h3>تنبيهات قبل الضيق</h3><span class="chip chip-teal">${ic('spark', 14)} استباقي</span></div>
    ${al.length ? al.map(a => `<div class="alert ${a.lvl === 'info' ? 'info' : ''}"><span class="ic">${ic(a.icon, 20)}</span>
      <div><b>${a.t}</b><small>${esc(a.s)}</small></div>
      ${a.act ? `<button class="btn btn-sm btn-ghost act" onclick="A.log('${a.act[0]}')">${a.act[1]}</button>` : ''}</div>`).join('')
      : `<div class="alert info"><span class="ic">${ic('check', 20)}</span><div><b>كل شي تمام</b><small>ما فيه حاجة متوقعة الحين — بنبهك قبل أي ضيق</small></div></div>`}

    <div class="sec-h"><h3>احتياجاته اليوم</h3><span class="muted" style="font-size:12.5px">اضغط عند كل مرة</span></div>
    <div class="trackers">
      ${T('water','الشرب',2*H,'drop','شرب الحين')}
      ${T('bathroom','الحمام',3*H,'door','دخل الحين')}
      ${T('food','الأكل',4.5*H,'food','أكل الحين')}
      ${T('meds','الدواء',12*H,'pill','أخذ دواه')}
    </div>

    <div class="sec-h"><h3>روتينه الحين</h3><button onclick="A.go('profile');A.seg('routine')">الروتين كامل</button></div>
    <div class="timeline">
      ${slice.map((r, i) => { const st = todayAt(r.time) <= now ? (items.indexOf(r) === idx - 1 ? 'now' : 'past') : '';
        return `<div class="tl-item ${st}"><div class="tl-time">${hhmm(r.time)}</div><div class="tl-line"></div>
        <div class="tl-body"><span class="tl-ic">${ic(ROUTINE_ICONS[r.icon] || 'clock', 18)}</span><div><b>${esc(r.title)}</b>${r.note ? `<small>${esc(r.note)}</small>` : ''}</div>
        ${st === 'now' ? '<span class="chip chip-sand" style="margin-inline-start:auto">الحين</span>' : ''}</div></div>`; }).join('') || '<div class="empty">أضف روتينه من ملف المريض</div>'}
    </div>

    <div class="sec-h"><h3>الحماية من الضياع</h3></div>
    <div class="card" style="display:flex;gap:14px;align-items:center">
      <span class="tl-ic" style="width:48px;height:48px;border-radius:16px;background:${S.geofence.on ? 'var(--green-50)' : 'var(--rose-50)'};color:${S.geofence.on ? '#2F7D57' : '#B5524A'}">${ic('shield', 24)}</span>
      <div style="flex:1"><b style="font-size:15px">${S.geofence.on ? 'السياج الآمن مفعّل' : 'السياج الآمن موقف'}</b>
      <div class="muted" style="font-size:12.5px;line-height:1.7">ننبهك فورًا لو طلع أبعد من ${ar(S.geofence.radius)} م عن البيت</div></div>
      <button class="btn btn-sm btn-ghost" onclick="A.wander()">جرّب التنبيه</button>
    </div>

    <button class="card mt12" style="display:flex;gap:14px;align-items:center;width:100%;text-align:start" onclick="A.handover()">
      <span class="tl-ic" style="width:48px;height:48px;border-radius:16px;background:var(--sand-100);color:var(--sand-700)">${ic('users', 24)}</span>
      <div style="flex:1"><b style="font-size:15px">وضع الاستلام</b><div class="muted" style="font-size:12.5px;line-height:1.7">لو غبت، اللي يستلم يلقى كل معرفتك عن ${esc(p.nick)}</div></div>
      <span class="muted">${ic('fwd', 20)}</span>
    </button>
  </div>`;
}

/* ---------------- Flow: distress → understand the need ---------------- */
let selBeh = [];
function distress(){
  selBeh = [];
  const now = Date.now();
  const pg = openPage(`
    <div class="page-head"><button class="icon-btn" onclick="A.closePage()">${ic('back', 22)}</button>
      <div><h2>وش تلاحظ على ${esc(S.patient.nick)}؟</h2><small>اختر كل اللي تشوفه — حتى لو شي بسيط</small></div></div>
    <div class="wrap">
      <div class="card" style="display:flex;gap:10px;justify-content:space-between;text-align:center;padding:14px">
        <div style="flex:1"><div class="muted" style="font-size:12px">آخر شرب</div><b style="font-size:15px">${durShort(now - S.logs.water)}</b></div>
        <div style="width:1px;background:var(--line)"></div>
        <div style="flex:1"><div class="muted" style="font-size:12px">آخر حمام</div><b style="font-size:15px">${durShort(now - S.logs.bathroom)}</b></div>
        <div style="width:1px;background:var(--line)"></div>
        <div style="flex:1"><div class="muted" style="font-size:12px">آخر أكل</div><b style="font-size:15px">${durShort(now - S.logs.food)}</b></div>
      </div>
      <div class="sec-h"><h3>سلوكه الحين</h3><span class="muted" style="font-size:12.5px" id="selc"></span></div>
      <div class="beh-grid">${BEH.map(b => `<button class="beh" data-id="${b.id}"><span class="e">${b.e}</span>${b.t}</button>`).join('')}</div>
    </div>
    <div class="sticky-foot">
      <button class="btn btn-primary btn-block" id="goAn">${ic('spark', 20)} افهم وش يحتاج</button>
      <button class="btn btn-block mt8" style="height:44px;color:var(--teal-700);font-size:14px" id="goAn2">ما لاحظت شي محدد — حلّل من روتينه</button>
    </div>`);
  pg.querySelectorAll('.beh').forEach(el => el.onclick = () => {
    const id = el.dataset.id; el.classList.toggle('on');
    selBeh = el.classList.contains('on') ? [...selBeh, id] : selBeh.filter(x => x !== id);
    pg.querySelector('#selc').textContent = selBeh.length ? ar(selBeh.length) + ' مختارة' : '';
    vibrate(8);
  });
  pg.querySelector('#goAn').onclick = () => { if (!selBeh.length) return toast('اختر سلوك واحد على الأقل، أو حلّل من الروتين', 'hand'); analyzing(pg); };
  pg.querySelector('#goAn2').onclick = () => { selBeh = []; analyzing(pg); };
}
function analyzing(pg){
  const steps = ['قراءة سلوكه الحين', 'مقارنته بروتينه اليومي', 'آخر مرة شرب ودخل الحمام', 'خبرة أثر من المرات السابقة'];
  pg.innerHTML = `<div class="analyzing"><div class="scan"><i></i><i></i><i></i><img src="assets/mark.png" alt=""></div>
    <h2 style="margin-top:20px;color:var(--teal-900);font-size:22px">أثر يحاول يفهم ${esc(S.patient.nick)}…</h2>
    <div class="steps-l">${steps.map(s => `<div><span class="ck">${ic('check', 13, 3)}</span>${s}</div>`).join('')}</div></div>`;
  pg.scrollTop = 0;
  const rows = pg.querySelectorAll('.steps-l div');
  rows.forEach((r, i) => setTimeout(() => r.classList.add('ok'), 450 + i * 480));
  setTimeout(() => result(pg), 450 + rows.length * 480 + 250);
}
function result(pg){
  const ranked = analyze(selBeh), top = ranked[0], N = NEEDS[top.need];
  const pct = Math.round(top.p * 100);
  const how = S.expressions.find(x => x.need === top.need);
  const calm = S.calming.filter(c => c.title !== 'تجنّب').slice(0, 2);
  vibrate([20, 40, 20]);
  pg.innerHTML = `
    <div class="page-head"><button class="icon-btn" onclick="A.closePage()">${ic('x', 22)}</button><div><h2>الأرجح…</h2><small>${fmtTime(Date.now())}</small></div></div>
    <div class="result-top">
      <small>${esc(S.patient.nick)} على الأرجح</small>
      <h1><span>${N.e}</span>${N.t}</h1>
      <div class="pct"><i id="pbar"></i></div>
      <div class="pctl"><span>درجة الترجيح</span><b class="num">${ar(pct)}٪</b></div>
      ${top.reasons.length ? `<div class="why">${top.reasons.slice(0, 3).map(r => `<div>${ic('spark', 16)}<span>${esc(r)}</span></div>`).join('')}</div>` : ''}
    </div>
    <div class="wrap">
      <div class="card mt16"><div class="advice"><span class="ic">${ic('heart', 22)}</span><div><b>وش تسوي الحين</b><p>${esc(N.a)}</p></div></div>
      ${how ? `<div class="advice mt12"><span class="ic" style="background:var(--teal-50);color:var(--teal-600)">${ic('book', 20)}</span><div><b>كيف يعبّر عنها عادةً</b><p>${esc(how.text)}</p></div></div>` : ''}
      ${calm.length ? `<div class="advice mt12"><span class="ic" style="background:var(--green-50);color:#2F7D57">${ic('leaf', 20)}</span><div><b>وش يطمّنه</b><p>${calm.map(c => esc(c.title + ': ' + c.text)).join('<br>')}</p></div></div>` : ''}
      </div>
      <div class="sec-h"><h3>احتمالات ثانية</h3></div>
      ${ranked.slice(1, 4).map(r => `<div class="alt"><span style="font-size:20px">${NEEDS[r.need].e}</span><b>${NEEDS[r.need].t}</b><div class="bar"><i style="width:${Math.round(r.p / top.p * 100)}%"></i></div><span class="num">${ar(Math.round(r.p * 100))}٪</span></div>`).join('')}
      <div class="card mt20" id="confirmBox" style="background:linear-gradient(135deg,#fff,var(--teal-50))">
        <b style="font-size:16px">بعد ما تتأكد… هل كانت هذي حاجته فعلًا؟</b>
        <p class="muted" style="font-size:13px;line-height:1.8;margin-top:4px">كل تأكيد يخلي أثر يعرف ${esc(S.patient.nick)} أكثر</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
          <button class="btn btn-primary" id="yes">${ic('check', 20)} إيه، صح</button>
          <button class="btn btn-white" id="no">لا، شي ثاني</button>
        </div>
      </div>
      <div style="height:30px"></div>
    </div>`;
  pg.scrollTop = 0;
  setTimeout(() => { const b = pg.querySelector('#pbar'); if (b) b.style.width = pct + '%'; }, 80);
  pg.querySelector('#yes').onclick = () => learned(pg, top.need, top.need);
  pg.querySelector('#no').onclick = () => {
    const box = pg.querySelector('#confirmBox');
    box.innerHTML = `<b style="font-size:16px">وش كانت حاجته فعلًا؟</b>
      <div class="confirm-grid mt12">${Object.entries(NEEDS).filter(([k]) => k !== top.need).map(([k, n]) => `<button class="cg" data-k="${k}"><span class="e">${n.e}</span>${n.s}</button>`).join('')}</div>`;
    box.querySelectorAll('.cg').forEach(b => b.onclick = () => learned(pg, top.need, b.dataset.k));
    box.scrollIntoView({ behavior:'smooth', block:'center' });
  };
}
function learned(pg, predicted, actual){
  const before = knowledge();
  learnFrom(selBeh, predicted, actual);
  const after = knowledge();
  vibrate(30);
  const right = predicted === actual;
  pg.innerHTML = `<div class="learned">
    <div class="big">${ic(right ? 'check' : 'brain', 54, 2.2)}</div>
    <h2>${right ? 'الحمد لله، فهمناه صح' : 'شكرًا، أثر تعلّم شي جديد'}</h2>
    <p>${right ? `أثر صار أوثق في فهم ${esc(S.patient.nick)} لما يسوي كذا.` : `المرة الجاية ${selBeh.length ? 'لما تلاحظ عليه «' + selBeh.map(id => behById(id).t).join('» و«') + '»' : 'لما يتضايق بنفس الوقت'}، أثر بيرجّح إنه <b>${NEEDS[actual].t}</b>.`}</p>
    ${NEEDS[actual].log ? `<p class="mt8 muted" style="font-size:13.5px">${ic('check', 14)} سجلنا ${NEEDS[actual].s} الحين في احتياجاته اليوم</p>` : ''}
    <div class="know" style="margin:26px 0 0;text-align:start"><div class="ring">${ring(after)}<b>${ar(after)}٪</b></div>
      <div><h4>معرفة أثر بـ${esc(S.patient.nick)}</h4><p>${after > before ? `زادت من ${ar(before)}٪ إلى ${ar(after)}٪` : 'كل مرة تأكد فيها، يعرفه أكثر'} · دقة آخر المرات ${ar(accuracy())}٪</p></div></div>
    <button class="btn btn-primary btn-block mt20" onclick="A.closePage();A.go('home')">رجوع للرئيسية</button>
  </div>`;
  pg.scrollTop = 0;
}

/* ---------------- Flow: wandering alert ---------------- */
let wanderTimer, wanderStart;
function wander(){
  closeSheet(true);
  const preds = predictPlaces(), top = preds[0];
  const reason = top.why || `من الأماكن اللي يحنّ لها`;
  wanderStart = Date.now();
  vibrate([400, 150, 400, 150, 600]);
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification('أثر: ' + S.patient.nick + ' طلع من البيت', { body: reason, icon:'assets/icon-192.png' }); } catch(e){}
  const icn = t => (PLACE_TYPES[t] || PLACE_TYPES.other)[1];
  const pg = openPage(`
    <div class="w-banner"><div class="row"><span class="bell">${ic('bell', 26)}</span>
      <div><h2>${esc(S.patient.nick)} طلع من البيت</h2><small>تجاوز السياج الآمن · ${fmtTime(Date.now())}</small></div>
      <button class="icon-btn" style="margin-inline-start:auto;background:rgba(255,255,255,.2);color:#fff;box-shadow:none" onclick="A.endWander(false)">${ic('x', 20)}</button></div></div>
    <div class="map">${mapSVG(top.place)}
      <div class="live"><i></i> موقع مباشر</div>
      <div class="eta"><span>يبعد عن البيت <b class="num" id="wDist">${ar(210)} م</b></span><span>طلع قبل <b class="num" id="wTime">${ar('0:05')}</b></span></div>
    </div>
    <div class="w-card"><h4>ليش طلع؟</h4>
      <div class="reason"><span class="ic">${ic(icn(top.place.type), 24)}</span><div><b>${esc(reason)}</b><p>رايح غالبًا إلى: ${esc(top.place.name)} — ${esc(top.place.note)}</p></div></div></div>
    <div class="w-card"><h4>وين رايح على الأرجح؟</h4>
      ${preds.slice(0, 4).map(x => `<div class="dest"><span style="color:#9FD3CD">${ic(icn(x.place.type), 18)}</span><b>${esc(x.place.name)}</b><div class="bar"><i style="width:${Math.round(x.p / top.p * 100)}%"></i></div><span class="num">${ar(Math.round(x.p * 100))}٪</span></div>`).join('')}
    </div>
    <div class="w-card" style="display:flex;gap:12px;align-items:center"><span style="color:var(--sand-300)">${ic('watch', 26)}</span>
      <p style="font-size:13px;line-height:1.8;opacity:.85">ما وصله أي إنذار يخوّفه — التنبيه وصلك أنت بس. تقدر ترشده بصوت هادي.</p></div>
    <div class="w-actions">
      <button class="btn btn-sand full" onclick="A.voice()">${ic('volume', 20)} إرشاد صوتي هادي له</button>
      <a class="btn btn-glass" href="tel:${esc(S.caregiver.phone || '')}" onclick="${S.caregiver.phone ? '' : "A.toast('أضف رقم من الإعدادات','phone');return false"}">${ic('phone', 20)} اتصال</a>
      <a class="btn btn-glass" href="tel:911">${ic('shield', 20)} الطوارئ ٩١١</a>
      <button class="btn btn-primary full" onclick="A.endWander(true)">${ic('check', 20)} لقيته ورجع بأمان</button>
    </div>`, 'wander');
  let d = 210;
  clearInterval(wanderTimer);
  wanderTimer = setInterval(() => {
    if (!document.body.contains(pg)) return clearInterval(wanderTimer);
    d += Math.round(4 + Math.random() * 6);
    const s = Math.floor((Date.now() - wanderStart) / 1000) + 5;
    const a = pg.querySelector('#wDist'), b = pg.querySelector('#wTime');
    if (a) a.textContent = ar(d) + ' م';
    if (b) b.textContent = ar(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));
  }, 1000);
}
function mapSVG(place){
  return `<svg viewBox="0 0 360 260" preserveAspectRatio="xMidYMid slice">
    <rect width="360" height="260" fill="#EAF0EA"/>
    <g fill="#DCE6DE">${[[14,14,70,50],[100,14,64,50],[196,14,50,36],[262,14,84,36],[14,160,40,86],[100,160,64,40],[100,214,64,36],[196,90,60,56],[270,104,76,42],[196,160,150,40],[196,214,70,36],[284,214,62,36],[14,82,40,60]].map(r => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="8"/>`).join('')}</g>
    <rect x="100" y="82" width="64" height="62" rx="10" fill="#CFE6D3"/>
    <circle cx="122" cy="104" r="7" fill="#B6D9BD"/><circle cx="142" cy="122" r="9" fill="#B6D9BD"/>
    <g stroke="#fff" stroke-width="14" stroke-linecap="round" fill="none"><path d="M0 72H360M0 152H360M0 206H360M84 0V260M180 0V260M256 60V260"/></g>
    <g stroke="#F4F7F4" stroke-width="2" stroke-dasharray="6 7" fill="none"><path d="M0 72H360M0 152H360M84 0V260M180 0V260"/></g>
    <path id="route" d="M70 196 L84 196 L84 152 L180 152 L180 72 L300 72" fill="none" stroke="#3A8780" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 10" opacity=".7"/>
    <g transform="translate(56 182)"><rect width="30" height="30" rx="10" fill="#3A8780"/><path d="M7 15 15 8l8 7M10 13v9h10v-9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>
    <circle cx="70" cy="196" r="44" fill="#3A8780" opacity=".08" stroke="#3A8780" stroke-dasharray="4 5"/>
    <g transform="translate(300 72)"><circle r="20" fill="#E9C98C" opacity=".35"><animate attributeName="r" values="14;24;14" dur="2s" repeatCount="indefinite"/></circle>
      <path d="M0 -26c-8 0-14 6-14 13 0 10 14 21 14 21s14-11 14-21c0-7-6-13-14-13z" fill="#D4A85C" transform="translate(0 -4)"/><circle cy="-17" r="5" fill="#fff"/></g>
    <text x="300" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="#5B4215" font-family="IBM Plex Sans Arabic, sans-serif">${esc(place.name)}</text>
    <g><circle r="16" fill="#E7837A" opacity=".25"><animate attributeName="r" values="10;20;10" dur="1.4s" repeatCount="indefinite"/></circle>
      <circle r="8" fill="#E7837A" stroke="#fff" stroke-width="3"/>
      <animateMotion dur="40s" fill="freeze" keyPoints="0;0.62" keyTimes="0;1" calcMode="linear"><mpath href="#route"/></animateMotion></g>
  </svg>`;
}
function voice(){
  const n = S.patient.nick;
  const msg = `يا ${n}، أنا ${S.caregiver.name} معك. لا تشيل هم. خلنا نرجع البيت نشرب قهوة سوا.`;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg); u.lang = 'ar-SA'; u.rate = .82; u.pitch = 1;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('ar')); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch(e){}
  toast('يُشغَّل الإرشاد بصوت هادي: «' + msg.slice(0, 32) + '…»', 'volume');
}
function endWander(found){
  clearInterval(wanderTimer); try { speechSynthesis.cancel(); } catch(e){}
  if (!found) { closePage('.wander'); return; }
  sheet(`<h2>الحمد لله على سلامته 🤍</h2><p class="sub">وين كان رايح فعلًا؟ عشان أثر يتوقع أدق المرة الجاية.</p>
    <div class="mt12">${S.places.map(p => `<button class="settings-row" data-id="${p.id}"><span class="ic">${ic((PLACE_TYPES[p.type] || PLACE_TYPES.other)[1], 20)}</span>${esc(p.name)}<span class="go">${ic('fwd', 18)}</span></button>`).join('')}
    <button class="settings-row" data-id=""><span class="ic">${ic('pin', 20)}</span>ما أدري / مكان ثاني<span class="go">${ic('fwd', 18)}</span></button></div>`, o => {
    o.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      if (id) S.placeVisits[id] = (S.placeVisits[id] || 0) + 1;
      S.wanderLog.push({ ts: wanderStart, place:id, back:Date.now() }); save();
      closeSheet(); closePage('.wander'); toast('تم — أثر تعلّم من هالمرة'); render();
    });
  });
}

/* ---------------- Screen: Profile (family knowledge) ---------------- */
let seg = 'routine';
const SEGS = [['routine','الروتين','clock'],['expressions','كيف يعبّر','hand'],['calming','وش يطمّنه','heart'],['health','السجل الصحي','pill'],['places','أماكن يحنّ لها','pin']];
function Profile(){
  const p = S.patient, k = knowledge();
  return `
  <div class="title" style="display:flex;justify-content:space-between;align-items:flex-start">
    <div><h1>معرفة الأسرة</h1><p>كل اللي تعرفه عن ${esc(p.nick)}، محفوظ لأي أحد يستلم.</p></div>
    <button class="icon-btn" onclick="A.editPatient()">${ic('edit', 20)}</button>
  </div>
  <div class="know"><div class="ring">${ring(k)}<b>${ar(k)}٪</b></div>
    <div style="flex:1"><h4>أثر يعرف ${esc(p.nick)} بنسبة ${ar(k)}٪</h4><p>كل معلومة تضيفها وكل تأكيد يخلّي الفهم أدق</p></div>
    <button class="btn btn-sm" style="background:rgba(255,255,255,.16);color:#fff" onclick="A.handover()">${ic('share', 16)} استلام</button></div>
  <div class="seg mt16">${SEGS.map(([id, t, i]) => `<button class="${seg === id ? 'on' : ''}" onclick="A.seg('${id}')">${ic(i, 16)} ${t}</button>`).join('')}</div>
  <div class="wrap mt12">${segBody()}</div>`;
}
function segBody(){
  const del = (list, id) => `<button class="del" onclick="A.del('${list}','${id}')" aria-label="حذف">${ic('trash', 18)}</button>`;
  const nick = esc(S.patient.nick);
  let html = '';
  if (seg === 'routine') {
    html = `<p class="muted" style="font-size:13.5px;margin-bottom:12px;line-height:1.8">روتينه اليومي يساعد أثر يفهم وقت كل حاجة، وينبهك قبلها.</p>` +
      S.routine.slice().sort((a, b) => a.time.localeCompare(b.time)).map((r, i) => `<div class="item" style="animation-delay:${i * 30}ms"><span class="ic">${ic(ROUTINE_ICONS[r.icon] || 'clock', 20)}</span>
      <div><b>${esc(r.title)}</b><p><span class="chip chip-teal" style="height:22px;font-size:11.5px">${hhmm(r.time)}</span> ${esc(r.note)}</p></div>${del('routine', r.id)}</div>`).join('');
  }
  if (seg === 'expressions') {
    html = `<p class="muted" style="font-size:13.5px;margin-bottom:12px;line-height:1.8">لأن ${nick} ما يقدر يقول وش يبي، اكتب كيف تطلع كل حاجة في سلوكه.</p>` +
      S.expressions.map((x, i) => `<div class="item" style="animation-delay:${i * 30}ms"><span class="ic sand">${NEEDS[x.need].e}</span>
      <div><b>لما يكون ${NEEDS[x.need].t}</b><p>${esc(x.text)}</p></div>${del('expressions', x.id)}</div>`).join('');
  }
  if (seg === 'calming') {
    html = `<p class="muted" style="font-size:13.5px;margin-bottom:12px;line-height:1.8">الأشياء اللي تهدّيه، واللي لازم تتجنبها — يقترحها أثر وقت الضيق.</p>` +
      S.calming.map((c, i) => `<div class="item" style="animation-delay:${i * 30}ms"><span class="ic ${c.title === 'تجنّب' ? 'sand' : ''}">${ic(c.title === 'تجنّب' ? 'x' : 'heart', 20)}</span>
      <div><b>${esc(c.title)}</b><p>${esc(c.text)}</p></div>${del('calming', c.id)}</div>`).join('');
  }
  if (seg === 'health') {
    const K = { condition:['الحالة','brain'], med:['دواء','pill'], allergy:['حساسية','shield'], contact:['طبيب / تواصل','phone'] };
    html = S.health.map((h, i) => `<div class="item" style="animation-delay:${i * 30}ms"><span class="ic ${h.kind === 'allergy' ? 'sand' : ''}">${ic(K[h.kind][1], 20)}</span>
      <div><b>${esc(h.title)}</b><p><span class="chip ${h.kind === 'allergy' ? 'chip-rose' : 'chip-teal'}" style="height:22px;font-size:11.5px">${K[h.kind][0]}</span> ${esc(h.text)}</p></div>${del('health', h.id)}</div>`).join('');
  }
  if (seg === 'places') {
    html = `<p class="muted" style="font-size:13.5px;margin-bottom:12px;line-height:1.8">لو طلع من البيت، أثر يرجّح وين رايح من أماكن حياته القديمة.</p>` +
      S.places.map((p, i) => `<div class="item" style="animation-delay:${i * 30}ms"><span class="ic">${ic((PLACE_TYPES[p.type] || PLACE_TYPES.other)[1], 20)}</span>
      <div><b>${esc(p.name)}</b><p>${esc(p.note)}${p.dist ? ` · <span class="num">${p.dist >= 1000 ? ar((p.dist / 1000).toFixed(1)) + ' كم' : ar(p.dist) + ' م'}</span>` : ''}</p></div>${del('places', p.id)}</div>`).join('');
  }
  return html + `<button class="add-row mt8" onclick="A.add()">${ic('plus', 20)} إضافة</button>`;
}
function add(){
  const needOpts = Object.entries(NEEDS).map(([k, n]) => `<option value="${k}">${n.e} ${n.t}</option>`).join('');
  const F = {
    routine: `<h2>إضافة للروتين</h2><div class="field"><label>الوقت</label><input type="time" name="time" value="12:00" required></div>
      <div class="field"><label>وش يسوي؟</label><input name="title" placeholder="مثال: قهوة العصر" required></div>
      <div class="field"><label>النوع</label><select name="icon"><option value="food">أكل</option><option value="pill">دواء</option><option value="mosque">صلاة</option><option value="moon">نوم وراحة</option><option value="sun">نشاط</option><option value="coffee">قهوة وجلسة</option><option value="heart">أخرى</option></select></div>
      <div class="field"><label>ملاحظة</label><input name="note" placeholder="تفاصيل تساعد اللي يستلم"></div>`,
    expressions: `<h2>كيف يعبّر عن حاجته</h2><div class="field"><label>الحاجة</label><select name="need">${needOpts}</select></div>
      <div class="field"><label>وش يسوي لما يحتاجها؟</label><textarea name="text" placeholder="مثال: يقوم ويقعد ويروح جهة الباب" required></textarea></div>`,
    calming: `<h2>وش يطمّنه</h2><div class="field"><label>العنوان</label><input name="title" placeholder="مثال: صوت أم كلثوم / تجنّب" required></div>
      <div class="field"><label>التفاصيل</label><textarea name="text" placeholder="كيف وإيش بالضبط" required></textarea></div>`,
    health: `<h2>السجل الصحي</h2><div class="field"><label>النوع</label><select name="kind"><option value="med">دواء</option><option value="condition">حالة</option><option value="allergy">حساسية</option><option value="contact">طبيب / تواصل</option></select></div>
      <div class="field"><label>الاسم</label><input name="title" required></div><div class="field"><label>التفاصيل</label><input name="text" placeholder="الجرعة، الوقت، ملاحظات"></div>`,
    places: `<h2>مكان يحنّ له</h2><div class="field"><label>اسم المكان</label><input name="name" placeholder="مثال: مسجد الحي" required></div>
      <div class="field"><label>النوع</label><select name="type">${Object.entries(PLACE_TYPES).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div>
      <div class="field"><label>ليش يحنّ له؟</label><input name="note" placeholder="مثال: كان يصلي فيه كل فرض"></div>
      <div class="field"><label>المسافة عن البيت (متر)</label><input type="number" name="dist" inputmode="numeric" value="1000"></div>`,
  };
  sheet(`<form id="addF">${F[seg]}<button class="btn btn-primary btn-block mt20" type="submit">حفظ</button></form>`, o => {
    o.querySelector('#addF').onsubmit = e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target).entries()); d.id = uid();
      if (d.dist) d.dist = +d.dist;
      S[seg].push(d); save(); closeSheet(); render(); toast('انحفظت — أثر صار يعرفه أكثر');
    };
  });
}
function del(list, id){ S[list] = S[list].filter(x => x.id !== id); save(); render(); toast('انحذفت', 'trash'); }
function editPatient(){
  const p = S.patient, c = S.caregiver;
  sheet(`<form id="pf"><h2>بيانات المريض والمرافق</h2>
    <div class="field"><label>اسم المريض</label><input name="name" value="${esc(p.name)}" required></div>
    <div class="field"><label>وش تناديه؟</label><input name="nick" value="${esc(p.nick)}" required></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>العمر</label><input type="number" name="age" value="${p.age}"></div>
    <div class="field"><label>المرحلة</label><select name="stage">${['مرحلة مبكرة','مرحلة متوسطة','مرحلة متقدمة'].map(s => `<option ${s === p.stage ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
    <div class="field"><label>اسم المرافق</label><input name="cg" value="${esc(c.name)}" required></div>
    <div class="field"><label>رقم للتواصل وقت الطوارئ</label><input name="phone" type="tel" value="${esc(c.phone)}" placeholder="05xxxxxxxx"></div>
    <button class="btn btn-primary btn-block mt20">حفظ</button></form>`, o => {
    o.querySelector('#pf').onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target).entries());
      Object.assign(S.patient, { name:d.name, nick:d.nick, age:+d.age || p.age, stage:d.stage }); Object.assign(S.caregiver, { name:d.cg, phone:d.phone });
      save(); closeSheet(); render(); toast('تم الحفظ'); };
  });
}

/* ---------------- Handover mode ---------------- */
function handover(){
  const p = S.patient, nick = esc(p.nick);
  const li = (b, t) => `<li><b>${b}</b><span>${t}</span></li>`;
  openPage(`
    <div class="page-head"><button class="icon-btn" onclick="A.closePage()">${ic('back', 22)}</button>
      <div><h2>وضع الاستلام</h2><small>كل اللي يحتاجه أي مرافق جديد</small></div>
      <button class="icon-btn" style="margin-inline-start:auto" onclick="A.share()">${ic('share', 20)}</button></div>
    <div class="ho-head"><div class="avatar">${esc(p.name[0])}</div><div><b style="font-size:19px;color:var(--teal-900)">${esc(p.name)} — ${nick}</b>
      <div class="muted" style="font-size:13px">${ar(p.age)} سنة · ${esc(p.stage)} · المرافق الأساسي: ${esc(S.caregiver.name)}</div></div></div>
    <div class="ho-sec"><h4>${ic('shield', 16)} أهم شي تعرفه</h4><ul>
      ${S.health.filter(h => h.kind === 'allergy').map(h => li('⚠️', esc(h.title + ' — ' + h.text))).join('')}
      ${S.calming.filter(c => c.title === 'تجنّب').map(c => li('🚫', esc(c.text))).join('')}
      ${li('🕌', 'وقت الصلاة غالبًا يطلع للمسجد — خلك معه')}
    </ul></div>
    <div class="ho-sec"><h4>${ic('hand', 16)} كيف يعبّر عن حاجته</h4><ul>${S.expressions.map(x => li(NEEDS[x.need].e + ' ' + NEEDS[x.need].s, esc(x.text))).join('')}</ul></div>
    <div class="ho-sec"><h4>${ic('heart', 16)} وش يطمّنه</h4><ul>${S.calming.filter(c => c.title !== 'تجنّب').map(c => li(esc(c.title), esc(c.text))).join('')}</ul></div>
    <div class="ho-sec"><h4>${ic('clock', 16)} روتينه اليومي</h4><ul>${S.routine.slice().sort((a, b) => a.time.localeCompare(b.time)).map(r => li(hhmm(r.time), esc(r.title + (r.note ? ' — ' + r.note : '')))).join('')}</ul></div>
    <div class="ho-sec"><h4>${ic('pill', 16)} السجل الصحي</h4><ul>${S.health.map(h => li(esc(h.title), esc(h.text))).join('')}</ul></div>
    <div class="ho-sec"><h4>${ic('pin', 16)} أماكن يحنّ لها</h4><ul>${S.places.map(pl => li(esc(pl.name), esc(pl.note))).join('')}</ul></div>
    <div class="wrap"><button class="btn btn-primary btn-block mt20" onclick="A.share()">${ic('share', 20)} شارك مع المرافق الجديد</button><div style="height:30px"></div></div>`);
}
function share(){
  const p = S.patient;
  const lines = [`أثر — دليل استلام ${p.name} (${p.nick})`, '', '• كيف يعبّر:', ...S.expressions.map(x => `- ${NEEDS[x.need].t}: ${x.text}`),
    '', '• وش يطمّنه:', ...S.calming.map(c => `- ${c.title}: ${c.text}`), '', '• الروتين:', ...S.routine.slice().sort((a, b) => a.time.localeCompare(b.time)).map(r => `- ${r.time} ${r.title}`),
    '', '• السجل الصحي:', ...S.health.map(h => `- ${h.title}: ${h.text}`), '', '• أماكن يحنّ لها:', ...S.places.map(pl => `- ${pl.name}: ${pl.note}`)];
  const text = lines.join('\n');
  if (navigator.share) navigator.share({ title:'دليل الاستلام — أثر', text }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('انسخ الدليل — الصقه في واتساب أو رسالة'));
}

/* ---------------- Screen: Insights ---------------- */
function Insights(){
  const nick = esc(S.patient.nick), ev = S.events, acc = accuracy();
  const counts = {}; ev.forEach(e => counts[e.actual] = (counts[e.actual] || 0) + 1);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = top.length ? top[0][1] : 1;
  const first = ev.slice(0, 5), firstAcc = first.length ? Math.round(first.filter(e => e.predicted === e.actual).length / first.length * 100) : 0;
  // patterns
  const pats = [];
  const byHour = {}; ev.forEach(e => { const h = new Date(e.ts).getHours(); const slot = h < 12 ? 'الصبح' : h < 16 ? 'الظهر' : h < 20 ? 'العصر والمغرب' : 'الليل'; byHour[slot] = (byHour[slot] || 0) + 1; });
  const ts = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  if (ts) pats.push(['clock', `أغلب ضيقه يكون وقت ${ts[0]}`, `${ar(ts[1])} من ${ar(ev.length)} مرات — خلك قريب منه في هالوقت`]);
  Object.entries(S.learn).forEach(([b, m]) => { const best = Object.entries(m).sort((x, y) => y[1] - x[1])[0]; if (best && best[1] >= 1 && behById(b)) pats.push(['brain', `«${behById(b).t}» عنده غالبًا تعني ${NEEDS[best[0]].s}`, 'تعلّمها أثر من تأكيداتك']); });
  const wrong = ev.filter(e => e.predicted !== e.actual).slice(-1)[0];
  if (wrong) pats.push(['spark', `صحّحت أثر مرة: كان ${NEEDS[wrong.actual].t} مو ${NEEDS[wrong.predicted].t}`, 'وصار يفرّق بينهم الحين']);
  return `
  <div class="title"><h1>كيف يفهم أثر ${nick}</h1><p>كل تأكيد منك يخلي التوقع أدق.</p></div>
  <div class="wrap mt12">
    <div class="stats">
      <div class="stat"><small>دقة التوقع</small><b class="num">${ar(acc)}٪</b>${acc > firstAcc ? `<span>▲ من ${ar(firstAcc)}٪ بالبداية</span>` : '<span>آخر ١٢ مرة</span>'}</div>
      <div class="stat"><small>مرات فهمناه</small><b class="num">${ar(ev.length)}</b><span>${ar(ev.filter(e => Date.now() - e.ts < 7*864e5).length)} هالأسبوع</span></div>
    </div>
    <div class="card mt12"><b style="font-size:15px">أكثر احتياجاته</b>
      <div class="chart">${top.map(([n, c], i) => `<div class="c ${i === 0 ? 'top' : ''}"><small class="num">${ar(c)}</small><i style="height:${Math.round(Math.max(10, c / max * 76))}px"></i><small>${NEEDS[n].e}<br>${NEEDS[n].s}</small></div>`).join('') || '<div class="empty">ما فيه بيانات بعد</div>'}</div></div>
    <div class="sec-h"><h3>أنماط اكتشفها أثر</h3></div>
    ${pats.slice(0, 4).map(p => `<div class="alert info"><span class="ic">${ic(p[0], 20)}</span><div><b>${p[1]}</b><small>${p[2]}</small></div></div>`).join('') || '<div class="empty">بتظهر الأنماط بعد كم مرة</div>'}
    <div class="sec-h"><h3>السجل</h3></div>
    <div class="card" style="padding:4px 16px">
      ${ev.slice().reverse().slice(0, 12).map(e => `<div class="ev"><span class="ic">${NEEDS[e.actual].e}</span><div style="flex:1"><b>${NEEDS[e.actual].t}</b>
        <small>${dayLabel(e.ts)} · ${fmtTime(e.ts)}${e.beh.length ? ' · ' + e.beh.map(id => behById(id)?.t).filter(Boolean).join('، ') : ''}</small></div>
        ${e.predicted === e.actual ? `<span class="chip chip-green">${ic('check', 13, 3)} توقّعها</span>` : '<span class="chip chip-amber">تعلّم</span>'}</div>`).join('') || '<div class="empty">ما فيه سجل بعد</div>'}
    </div>
  </div>`;
}

/* ---------------- Screen: Watch (next phase) ---------------- */
let watchT;
function Watch(){
  clearInterval(watchT);
  setTimeout(() => {
    const msgs = [['أنا معك يا ' + S.patient.nick, 'صوت هادي · بدون إنذار'], ['خلنا نرجع البيت', 'إرشاد بالاتجاه ← ٢٠٠ م'], ['وقت شرب الماء 💧', 'تذكير لطيف'], ['قلبك هادي 🤍', 'نبض ٧٢ · مرتاح']];
    let i = 0; watchT = setInterval(() => {
      const el = document.getElementById('wmsg'); if (!el) return clearInterval(watchT);
      i = (i + 1) % msgs.length; el.style.opacity = 0;
      setTimeout(() => { el.innerHTML = `<b>${esc(msgs[i][0])}</b><small>${msgs[i][1]}</small>`; el.style.opacity = 1; }, 300);
    }, 2600);
  });
  const F = [['hand','يلاحظ قلقه بنفسه','حساسات النبض والحركة تلتقط بداية الضيق، وأثر يقول لك وش يحتاج قبل ما يزيد.'],
    ['nav','يتتبع موقعه لو طلع','موقع مباشر بدون ما يحتاج جوال، وتوقّع وين رايح من أماكن حياته.'],
    ['volume','يرشده بصوت هادي','صوت يعرفه يطمّنه ويوجهه للبيت — بدون أي إنذار يخوّفه.'],
    ['bell','التنبيهات لك أنت','كل الإنذارات تروح لجوال المرافق، والمريض ما يشوف إلا الهدوء.']];
  return `
  <div class="title" style="text-align:center"><span class="chip chip-sand">${ic('spark', 14)} المرحلة الجاية</span><h1 class="mt8">ساعة أثر</h1><p>نبدأ كتطبيق، وبعدها الساعة — تفهمه وهو بعيد عنك.</p></div>
  <div class="watch-stage"><div class="strap t"></div><div class="strap b"></div>
    <div class="wcase"><div class="wscreen"><span class="w-rings"></span><span class="w-rings"></span>
      <img src="assets/icon-192.png" alt="">
      <div id="wmsg" style="transition:opacity .3s;position:relative;display:flex;flex-direction:column"><b>أنا معك يا ${esc(S.patient.nick)}</b><small>صوت هادي · بدون إنذار</small></div>
    </div></div></div>
  <div class="wrap mt16"><div class="card" style="padding:4px 18px">
    ${F.map(f => `<div class="feat"><span class="ic">${ic(f[0], 21)}</span><div><b>${f[1]}</b><p>${f[2]}</p></div></div>`).join('')}
  </div>
  <button class="btn btn-primary btn-block mt16" onclick="A.toast('سجلنا اهتمامك — بنعلمك أول ما تتوفر الساعة','bell')">${ic('bell', 20)} علّمني لما تتوفر</button></div>`;
}

/* ---------------- Settings ---------------- */
function settings(){
  const notif = 'Notification' in window ? Notification.permission : 'unsupported';
  sheet(`<h2>الإعدادات</h2>
    <div class="mt12">
      <button class="settings-row" id="s1"><span class="ic">${ic('edit', 20)}</span>بيانات المريض والمرافق<span class="go">${ic('fwd', 18)}</span></button>
      <button class="settings-row" id="s2"><span class="ic">${ic('shield', 20)}</span>السياج الآمن: ${S.geofence.on ? 'مفعّل' : 'موقف'} · ${ar(S.geofence.radius)} م<span class="go">${S.geofence.on ? 'إيقاف' : 'تفعيل'}</span></button>
      <button class="settings-row" id="s3"><span class="ic">${ic('bell', 20)}</span>إشعارات الجوال<span class="go">${notif === 'granted' ? 'مفعّلة' : notif === 'unsupported' ? 'غير مدعومة' : 'تفعيل'}</span></button>
      <button class="settings-row" id="s4"><span class="ic">${ic('nav', 20)}</span>تجربة تنبيه «طلع من البيت»<span class="go">${ic('fwd', 18)}</span></button>
      <button class="settings-row" id="s5"><span class="ic" style="background:var(--rose-50);color:#B5524A">${ic('trash', 20)}</span>إرجاع البيانات التجريبية<span class="go">${ic('fwd', 18)}</span></button>
    </div>
    <p class="muted mt16" style="font-size:12.5px;line-height:1.8;text-align:center">كل بيانات ${esc(S.patient.nick)} محفوظة على جوالك فقط.<br>أثر · الإصدار ١٫٠</p>`, o => {
    o.querySelector('#s1').onclick = editPatient;
    o.querySelector('#s2').onclick = () => { S.geofence.on = !S.geofence.on; save(); closeSheet(); render(); toast(S.geofence.on ? 'السياج الآمن مفعّل' : 'السياج الآمن موقف', 'shield'); };
    o.querySelector('#s3').onclick = () => { if ('Notification' in window) Notification.requestPermission().then(() => { closeSheet(); toast('تم تحديث الإشعارات', 'bell'); }); };
    o.querySelector('#s4').onclick = wander;
    o.querySelector('#s5').onclick = () => { if (confirm('ترجع كل البيانات للنسخة التجريبية؟ بتنحذف تعديلاتك.')) { S = seed(); S.onboarded = true; save(); closeSheet(); render(); toast('رجعت البيانات التجريبية'); } };
  });
}

/* ---------------- Logging ---------------- */
function log(key){
  S.logs[key] = Date.now(); save(); vibrate(15);
  const L = { water:'سجلنا إنه شرب 💧', bathroom:'سجلنا إنه دخل الحمام', food:'سجلنا إنه أكل', meds:'سجلنا إنه أخذ دواه 💊' };
  toast(L[key]); render();
}

/* ---------------- Onboarding ---------------- */
function onboarding(){
  const slides = [
    { art:`<div style="position:relative;width:70%;aspect-ratio:1"><span class="ripple" style="inset:10%"></span><span class="ripple" style="inset:10%"></span><img src="assets/mark.png" style="width:100%;mix-blend-mode:multiply;position:relative" alt=""></div>`,
      h:'معرفتك عنه.. محفوظة', p:'اكتب روتينه، وكيف يعبّر عن كل حاجة، ووش يطمّنه. لو غبت، اللي يستلم يلقى كل شي.' },
    { art:`<div style="width:78%"><div class="result-top" style="margin:0;padding:18px;text-align:start"><small>على الأرجح</small><h1 style="font-size:24px">🚻 يبي الحمام</h1>
        <div class="pct"><i style="width:82%"></i></div><div class="pctl"><span>درجة الترجيح</span><b>٨٢٪</b></div></div>
        <div class="alert" style="margin-top:12px;text-align:start"><span class="ic">${ic('drop', 18)}</span><div><b style="font-size:13px">صار له ٣ ساعات ما شرب</b><small>قدّم له ماء قبل ما يتضايق</small></div></div></div>`,
      h:'يفهم وش يحتاج', p:'لما يتضايق، أثر يربط سلوكه بروتينه وآخر مرة شرب أو دخل الحمام، ويتعلّم منك مع كل مرة.' },
    { art:`<div style="width:86%;border-radius:26px;overflow:hidden;box-shadow:var(--sh-2);height:78%">${mapSVG({ name:'مسجد الحي' })}</div>`,
      h:'لو طلع.. يرجّعه', p:'تنبيه فوري مع موقعه، وتوقّع ليش طلع ووين رايح — «وقت صلاة، غالبًا رايح المسجد».' },
  ];
  let i = 0;
  const o = document.createElement('div'); o.className = 'onb';
  o.innerHTML = `<div style="position:absolute;top:18px;left:20px;z-index:2"><button class="btn btn-sm" style="color:var(--ink-3)" id="skip">تخطّي</button></div>
    <div class="onb-slides" id="sl">${slides.map(s => `<div class="onb-slide"><div class="onb-art">${s.art}</div><h2>${s.h}</h2><p>${s.p}</p></div>`).join('')}</div>
    <div class="onb-foot"><div class="dots">${slides.map((_, k) => `<i class="${k === 0 ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn btn-primary" id="nx">التالي ${ic('fwd', 20)}</button></div>`;
  phone.appendChild(o);
  const sl = o.querySelector('#sl'), dots = o.querySelectorAll('.dots i'), nx = o.querySelector('#nx');
  const show = () => { sl.style.transform = `translateX(${i * 100}%)`; dots.forEach((d, k) => d.classList.toggle('on', k === i)); nx.innerHTML = i === slides.length - 1 ? 'يلا نبدأ ' + ic('fwd', 20) : 'التالي ' + ic('fwd', 20); };
  let sx = null;
  sl.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive:true });
  sl.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { i = Math.max(0, Math.min(slides.length - 1, i + (dx > 0 ? 1 : -1))); show(); } sx = null; });
  nx.onclick = () => { if (i < slides.length - 1) { i++; show(); } else setup(o); };
  o.querySelector('#skip').onclick = () => setup(o);
}
function setup(o){
  o.innerHTML = `<div style="padding:40px 24px 30px;overflow-y:auto;height:100%">
    <div class="mark" style="width:64px;height:64px;border-radius:22px"></div>
    <h2 style="font-size:26px;color:var(--teal-900);margin-top:18px">خلنا نتعرّف عليه</h2>
    <p class="muted" style="line-height:1.9;margin-top:4px">جهزنا لك أسرة تجريبية تقدر تعدّلها — أو اكتب بياناتك الحين.</p>
    <form id="sf">
      <div class="field"><label>اسم المريض</label><input name="name" value="${esc(S.patient.name)}" required></div>
      <div class="field"><label>وش تناديه؟</label><input name="nick" value="${esc(S.patient.nick)}" required></div>
      <div class="field"><label>عمره</label><input name="age" type="number" value="${S.patient.age}"></div>
      <div class="field"><label>اسمك (المرافق)</label><input name="cg" value="${esc(S.caregiver.name)}" required></div>
      <button class="btn btn-primary btn-block mt20">ابدأ مع أثر ${ic('fwd', 20)}</button>
      <p class="muted mt12" style="font-size:12.5px;text-align:center">البيانات تنحفظ على جوالك، وتقدر تعدّل كل شي من ملف المريض.</p>
    </form></div>`;
  o.querySelector('#sf').onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target).entries());
    const oldNick = S.patient.nick;
    Object.assign(S.patient, { name:d.name, nick:d.nick, age:+d.age || 70 }); S.caregiver.name = d.cg;
    if (oldNick !== d.nick) S.calming.forEach(c => c.text = c.text.replace(oldNick, d.nick));
    S.onboarded = true; save();
    o.style.transition = 'opacity .4s'; o.style.opacity = 0; setTimeout(() => o.remove(), 400);
    render();
  };
}

/* ---------------- Boot ---------------- */
window.A = { go, distress, closePage: () => closePage(), log, wander, endWander, voice, handover, share, settings, add, del, editPatient, toast,
  seg: s => { seg = s; if (tab === 'profile') render(); },
  _dev: { onboarding } };

render();
setTimeout(() => {
  document.getElementById('splash').classList.add('out');
  setTimeout(() => document.getElementById('splash').remove(), 800);
  if (!S.onboarded) onboarding();
}, 2700);
setInterval(() => { if (tab === 'home' && !phone.querySelector('.page,.wander,.overlay,.onb')) { const sc = document.getElementById('scr'); const y = sc ? sc.scrollTop : 0; render(); const n = document.getElementById('scr'); if (n) n.scrollTop = y; } }, 60e3);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
