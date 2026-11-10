(() => {
  'use strict';

  const PHRASES = window.SPEAK5_PHRASES || [];
  const OLD_KEY = 'speak5_data_v1';
  const KEY = 'tomeng_notebook_v2';
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const iconPaths = {
    home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/>',
    book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 17.5V5.5M8 7h8"/>',
    play:'<path d="m8 5 11 7-11 7z"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
    chart:'<path d="M4 20V9m6 11V4m6 16v-7m4 7H2"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
    volume:'<path d="M11 5 6 9H3v6h3l5 4zM15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    shuffle:'<path d="M3 7h3c4 0 6 10 10 10h5m-4-4 4 4-4 4M3 17h3c1.8 0 3.2-2 4.5-4M16 7h5m-4-4 4 4-4 4"/>',
    flame:'<path d="M12 22c4.5 0 8-3.4 8-8 0-3.7-2-6.7-5-10-.3 3-1.9 4.5-3 5-1-2-1.8-3.1-3-4.3-.3 3-5 5.2-5 9.3 0 4.6 3.5 8 8 8z"/>',
    spark:'<path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7z"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.spark}</svg>`;

  const categories = [
    {id:'meeting', number:'01', name:'Phòng họp', desc:'Mở đầu, làm rõ và chốt cuộc họp.', className:'coral', days:[1,2,5,10,14,15,19,26]},
    {id:'workday', number:'02', name:'Ngày làm việc', desc:'Tiến độ, ưu tiên và xử lý vướng mắc.', className:'olive', days:[6,7,8,9,29]},
    {id:'product', number:'03', name:'Product & Design', desc:'Review, yêu cầu, dữ liệu và handoff.', className:'yellow', days:[3,4,11,12,13,16,17,18,20,21,22,23,24,25,28]},
    {id:'daily', number:'04', name:'Giao tiếp hằng ngày', desc:'Small talk và hội thoại tự nhiên.', className:'blue', days:[27,30]},
    {id:'confidence', number:'05', name:'Nói tự tin', desc:'Phản xạ, hỏi lại và nói có sắc thái.', className:'cream', days:[1,2,27,30]},
    {id:'leadership', number:'06', name:'Lãnh đạo & đồng thuận', desc:'Điều phối, quyết định và theo dõi.', className:'ink', days:[5,7,10,14,15,26,29]}
  ];
  const grammar = [
    {group:'Các thì trong giao tiếp', title:'Present simple · Hiện tại đơn', pattern:'I work / She works', tip:'Dùng cho lịch cố định, thói quen và sự thật ổn định. Trong công việc: “I usually send the recap after each meeting.”', clue:'usually · every week · on Mondays'},
    {group:'Các thì trong giao tiếp', title:'Present continuous · Hiện tại tiếp diễn', pattern:'I am working', tip:'Dùng cho việc đang diễn ra hoặc tình huống tạm thời quanh hiện tại. “I’m working on the updated flow this week.”', clue:'now · at the moment · this week'},
    {group:'Các thì trong giao tiếp', title:'Present perfect · Hiện tại hoàn thành', pattern:'I have finished', tip:'Nối việc đã xảy ra với kết quả hiện tại; không nêu thời điểm quá khứ cụ thể. “I’ve shared the latest version.”', clue:'already · just · yet · so far'},
    {group:'Các thì trong giao tiếp', title:'Past simple · Quá khứ đơn', pattern:'I joined / We agreed', tip:'Việc đã kết thúc tại một thời điểm quá khứ rõ ràng. “We agreed on the scope yesterday.”', clue:'yesterday · last week · in 2024'},
    {group:'Các thì trong giao tiếp', title:'Past continuous · Quá khứ tiếp diễn', pattern:'I was working', tip:'Bối cảnh đang diễn ra tại một thời điểm quá khứ; thường có việc khác xen vào. “I was presenting when the call dropped.”', clue:'while · when · at 3 p.m.'},
    {group:'Các thì trong giao tiếp', title:'Will · Quyết định / dự đoán', pattern:'I’ll check / It will help', tip:'Quyết định ngay lúc nói, lời hứa hoặc dự đoán. “I’ll send you the notes after this call.”', clue:'I’ll · probably · I think'},
    {group:'Các thì trong giao tiếp', title:'Going to · Dự định đã có', pattern:'I’m going to review', tip:'Kế hoạch hoặc ý định đã hình thành trước lúc nói. “We’re going to test the new flow tomorrow.”', clue:'plan · intend · đã sắp xếp'},
    {group:'Các thì trong giao tiếp', title:'Present continuous · Lịch tương lai', pattern:'We’re meeting at ten', tip:'Dùng cho lịch đã sắp xếp cụ thể, thường có giờ/ngày. “I’m meeting the client on Thursday.”', clue:'giờ/ngày cụ thể · lịch đã chốt'},
    {group:'Mạo từ a / an / the', title:'A / an · Một thứ chưa xác định', pattern:'a user · an issue', tip:'Danh từ đếm được số ít, mới được nhắc hoặc chưa xác định. Chọn a/an theo âm đầu: an hour nhưng a university.', clue:'lần đầu nhắc · bất kỳ một'},
    {group:'Mạo từ a / an / the', title:'The · Thứ đã xác định', pattern:'the user · the issue', tip:'Người nghe biết chính xác bạn nói đến thứ nào: đã nhắc trước, có ngữ cảnh chung hoặc chỉ có một.', clue:'đã nhắc · cụ thể · duy nhất trong ngữ cảnh'},
    {group:'Mạo từ a / an / the', title:'Không dùng mạo từ', pattern:'We need feedback', tip:'Thường bỏ mạo từ với danh từ số nhiều hoặc không đếm được khi nói chung: “Design takes time.” “We need feedback.”', clue:'nói chung · số nhiều · không đếm được'},
    {group:'Giới từ dễ nhầm', title:'At · Điểm thời gian / địa điểm', pattern:'at 3 p.m. · at the office', tip:'Dùng at cho giờ cụ thể, địa điểm như một điểm và sự kiện: at noon, at the entrance, at a meeting.', clue:'giờ cụ thể · một điểm'},
    {group:'Giới từ dễ nhầm', title:'On · Ngày / bề mặt', pattern:'on Friday · on the screen', tip:'Dùng on với ngày, ngày tháng và thứ nằm trên bề mặt: on Monday, on the dashboard.', clue:'ngày · thứ · bề mặt'},
    {group:'Giới từ dễ nhầm', title:'In · Khoảng thời gian / không gian', pattern:'in June · in the document', tip:'Dùng in với tháng, năm, khoảng dài và không gian có ranh giới: in 2026, in the file, in the room.', clue:'tháng/năm · bên trong'},
    {group:'Giới từ dễ nhầm', title:'For · Mục đích / khoảng kéo dài', pattern:'for the team · for two weeks', tip:'For trả lời “cho ai/để làm gì” hoặc “trong bao lâu”: designed for mobile, for three days.', clue:'đối tượng · mục đích · thời lượng'},
    {group:'Giới từ dễ nhầm', title:'Since · Mốc bắt đầu', pattern:'since Monday · since 2022', tip:'Since đi với một mốc bắt đầu; thường dùng cùng hiện tại hoàn thành: “I’ve worked here since May.”', clue:'một mốc thời gian'},
    {group:'Giới từ dễ nhầm', title:'By · Hạn chót / trước thời điểm', pattern:'by Friday', tip:'By Friday nghĩa là không muộn hơn thứ Sáu. Khác until Friday: kéo dài liên tục đến thứ Sáu.', clue:'deadline · không muộn hơn'},
    {group:'Cấu trúc câu dùng ngay', title:'Could you…? · Nhờ vả lịch sự', pattern:'Could you take a look?', tip:'Cách nhờ lịch sự trong họp và email. Thêm please nếu cần mềm hơn, tránh dùng can you trong yêu cầu nhạy cảm.', clue:'nhờ xem · nhờ hỗ trợ'},
    {group:'Cấu trúc câu dùng ngay', title:'Would you mind + V-ing?', pattern:'Would you mind sharing the file?', tip:'Dùng để nhờ ai làm gì một cách nhẹ nhàng. Sau mind dùng động từ thêm -ing.', clue:'mind + V-ing'},
    {group:'Cấu trúc câu dùng ngay', title:'Because / so · Nêu nguyên nhân và kết quả', pattern:'Because X, Y. / X, so Y.', tip:'Because giới thiệu nguyên nhân; so giới thiệu kết quả. Tránh ghép because và so trong cùng một mệnh đề.', clue:'because = vì · so = nên'},
    {group:'Cấu trúc câu dùng ngay', title:'Although / but · Nhượng bộ', pattern:'Although X, Y. / X, but Y.', tip:'Chọn một cấu trúc: although ở đầu câu hoặc but nối hai ý. Tránh dùng although… but cùng lúc.', clue:'although = mặc dù · but = nhưng'},
    {group:'Cấu trúc câu dùng ngay', title:'Much / many / a lot of', pattern:'much time · many tasks · a lot of work', tip:'Many đi với danh từ đếm được số nhiều; much với danh từ không đếm được; a lot of dùng tự nhiên trong cả hai kiểu.', clue:'many tasks · much time · a lot of work'},
    {group:'Cấu trúc câu dùng ngay', title:'Few / a few · Little / a little', pattern:'a few options · a little time', tip:'A few / a little nghĩa là có một ít, sắc thái tích cực. Few / little nhấn mạnh gần như không đủ.', clue:'few + đếm được · little + không đếm được'}
  ];
  const byId = new Map(PHRASES.map((phrase) => [phrase.id, phrase]));

  function loadStore() {
    try {
      const current = JSON.parse(localStorage.getItem(KEY));
      if (current && Array.isArray(current.saved) && Array.isArray(current.learned)) return current;
    } catch {}
    let legacy = {};
    try { legacy = JSON.parse(localStorage.getItem(OLD_KEY)) || {}; } catch {}
    return {
      saved: Array.isArray(legacy.bookmarks) ? legacy.bookmarks : [],
      learned: [...new Set((legacy.sessions || []).flatMap((session) => session.learned || []))],
      accent: legacy.accent || 'en-US',
      opened: [],
      streak: 1
    };
  }

  let store = loadStore();
  let ui = {page:'home', category:'all', query:'', selected:null, practiceIds:[], practiceIndex:0, reveal:false};
  function save() { localStorage.setItem(KEY, JSON.stringify(store)); }
  function isSaved(id) { return store.saved.includes(id); }
  function catById(id) { return categories.find((category) => category.id === id); }
  function categoryFor(phrase) { return categories.find((category) => category.days.includes(phrase.day)) || categories[1]; }
  function phrasesFor(categoryId) {
    if (!categoryId || categoryId === 'all') return PHRASES;
    const category = catById(categoryId);
    return PHRASES.filter((phrase) => category?.days.includes(phrase.day));
  }
  function dayNumber() { return Math.min(30, Math.floor(store.learned.length / 5) + 1); }
  function todayPhrases() {
    const day = dayNumber();
    return PHRASES.filter((phrase) => phrase.day === day).slice(0, 5);
  }
  function dailyPhrase() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const index = Math.floor((now - start) / 86400000) % PHRASES.length;
    return PHRASES[index] || {};
  }
  function currentDate() {
    return new Intl.DateTimeFormat('vi-VN', {weekday:'short', day:'2-digit', month:'2-digit'}).format(new Date());
  }
  function toast(message) {
    const element = $('#toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove('show'), 2600);
  }

  function navButton(page, iconName, label) {
    return `<button class="rail-btn ${ui.page === page ? 'active' : ''}" data-page="${page}" aria-label="${label}" aria-current="${ui.page === page ? 'page' : 'false'}">${icon(iconName)}<span>${label}</span></button>`;
  }
  function mobileNav() {
    const items = [['home','home','Trang chủ'],['library','book','Sổ tay'],['grammar','spark','Ngữ pháp'],['practice','play','Luyện tập'],['saved','bookmark','Đã lưu']];
    return `<nav class="mobile-nav" aria-label="Điều hướng di động">${items.map(([page,name,label]) => `<button class="${ui.page===page?'active':''}" data-page="${page}">${icon(name)}${label}</button>`).join('')}</nav>`;
  }
  function shell(content) {
    const phrase = dailyPhrase();
    return `
      <aside class="rail">
        <button class="brand-mark" data-page="home" aria-label="TomEng"><img src="logo-tomeng.png" alt=""></button>
        <nav class="rail-nav" aria-label="Điều hướng chính">
          ${navButton('home','home','Trang chủ')}${navButton('library','book','Sổ tay')}${navButton('grammar','spark','Mẹo nhanh')}${navButton('practice','play','Luyện tập')}${navButton('saved','bookmark','Đã lưu')}${navButton('progress','chart','Tiến độ')}
        </nav>
        <div class="rail-bottom"><div class="avatar">TE</div></div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="brand-word">TomEng</div>
          <label class="search">${icon('search')}<input id="global-search" type="search" value="${esc(ui.query)}" placeholder="Tìm cụm câu, tình huống, chủ đề..." aria-label="Tìm kiếm"></label>
          <div class="top-actions"><span class="date-label">${currentDate()}</span><button class="icon-btn" data-action="random" aria-label="Cụm ngẫu nhiên">${icon('shuffle')}</button></div>
        </header>
        <div class="content">${content}</div>
      </main>
      <aside class="right-panel">
        <div class="right-brand"><div><b>TomEng</b><small>phrase notebook</small></div><button class="icon-btn" data-page="saved" aria-label="Cụm đã lưu">${icon('bookmark')}</button></div>
        <section class="daily-card">
          <div class="eyebrow">Cụm câu hôm nay</div>
          <h2>${esc(phrase.en)}</h2>
          <div class="translation">${esc(phrase.vi)}</div>
          <p class="context">${esc(phrase.context)}</p>
          <div class="daily-actions"><button class="mini-action" data-action="speak" data-id="${phrase.id}" aria-label="Nghe phát âm">${icon('volume')}</button><button class="mini-action ${isSaved(phrase.id)?'on':''}" data-action="save" data-id="${phrase.id}" aria-label="Lưu cụm câu">${icon('bookmark')}</button><button class="btn btn-ghost" data-open="${phrase.id}">Xem ghi chú ${icon('arrow')}</button></div>
        </section>
        ${schedulePanel()}
        <section class="notes"><h3>Ghi chú bên lề</h3><div class="note-item"><div></div><div><b>Học theo tình huống</b><p>“Đừng dịch từng từ. Hãy nhớ lúc nào mình cần nói cả cụm.”</p><small>TomEng method · 2 phút đọc</small></div></div><div class="note-item"><div></div><div><b>Mục tiêu tuần này</b><p>Dùng ít nhất một cụm mới trong cuộc họp thật.</p><small>${store.learned.length} cụm đã nằm trong sổ</small></div></div></section>
      </aside>${mobileNav()}`;
  }

  function schedulePanel() {
    const now = new Date();
    const labels = ['CN','T2','T3','T4','T5','T6','T7'];
    const days = Array.from({length:7}, (_, i) => {
      const date = new Date(now); date.setDate(now.getDate() - now.getDay() + i);
      const isToday = date.toDateString() === now.toDateString();
      return `<div class="day ${isToday?'today active':''}"><b>${labels[i]}</b><span>${date.getDate()}</span></div>`;
    }).join('');
    return `<section class="schedule"><div class="schedule-title"><h3>Nhịp học tuần này</h3><span class="eyebrow">${store.streak || 1} ngày</span></div><div class="week">${days}</div></section>`;
  }

  function homePage() {
    const today = todayPhrases();
    const done = today.filter((phrase) => store.learned.includes(phrase.id)).length;
    return `
      <section class="hero">
        <div><div class="eyebrow">Sổ tay tiếng Anh của bạn</div><h1 class="display">Nói đúng câu,<br><em>đúng lúc.</em></h1><p class="subcopy">TomEng gom những cụm câu dùng thật trong công việc, cuộc họp và đời sống — để bạn mở sổ, học nhanh và dùng ngay.</p><div class="hero-actions"><button class="btn btn-dark" data-action="continue">Tiếp tục trang ${String(dayNumber()).padStart(2,'0')} ${icon('arrow')}</button><button class="btn" data-page="library">Mở sổ tay</button></div></div>
        <div class="notebook-stack" aria-hidden="true"><div class="book back"></div><div class="book mid"></div><div class="book front"><div class="edition">TomEng pocket notes</div><h3>Useful English<br>for real life.</h3><p>Meetings · Work · Everyday</p><div class="book-no">${String(dayNumber()).padStart(2,'0')}</div></div></div>
      </section>
      <div class="section-head"><div><h2>Chọn một chuyên mục</h2><p>Mỗi ngăn sổ là một bối cảnh giao tiếp khác nhau.</p></div><button class="text-btn" data-page="library">Xem toàn bộ →</button></div>
      <section class="category-grid">${categories.map(categoryCard).join('')}</section>
      <div class="section-head"><div><h2>Trang đang học</h2><p>${esc(today[0]?.topic || 'Bắt đầu cuốn sổ đầu tiên')}</p></div></div>
      <section class="today-strip"><div class="strip-index">${String(dayNumber()).padStart(2,'0')}</div><div class="strip-copy"><b>${esc(today[done]?.en || 'Bạn đã hoàn thành trang này!')}</b><span>${done}/5 cụm đã ghi nhớ · khoảng ${Math.max(1,5-done)*2} phút còn lại</span></div><div class="progress-track"><i style="width:${done/5*100}%"></i></div><button class="btn btn-coral" data-action="continue">${done === 5 ? 'Xem lại' : 'Học tiếp'} ${icon('arrow')}</button></section>`;
  }
  function categoryCard(category) {
    return `<button class="category-card ${category.className}" data-category="${category.id}"><div class="number">${category.number}</div><h3>${category.name}</h3><p>${category.desc}</p><span class="arrow">${icon('arrow')}</span></button>`;
  }

  function libraryPage() {
    const query = ui.query.trim().toLowerCase();
    let list = phrasesFor(ui.category);
    if (query) list = list.filter((phrase) => [phrase.en,phrase.vi,phrase.topic,phrase.context,phrase.follow].join(' ').toLowerCase().includes(query));
    const heading = query ? `Kết quả cho “${esc(ui.query.trim())}”` : (ui.category === 'all' ? 'Toàn bộ sổ tay' : catById(ui.category)?.name);
    return `<header class="page-head"><div class="eyebrow">${PHRASES.length} cụm câu · 30 trang</div><h1>${heading}</h1><p class="subcopy">Tìm theo tình huống, nghe cách đọc và đánh dấu những câu bạn muốn mang theo.</p></header><div class="filters"><button class="filter ${ui.category==='all'?'active':''}" data-filter="all">Tất cả</button>${categories.map((category) => `<button class="filter ${ui.category===category.id?'active':''}" data-filter="${category.id}">${category.name}</button>`).join('')}</div><section class="phrase-grid">${list.length ? list.map(phraseCard).join('') : '<div class="empty">Không tìm thấy cụm câu phù hợp. Thử một từ khóa khác nhé.</div>'}</section>`;
  }

  function grammarPage() {
    const groups = [...new Set(grammar.map((tip) => tip.group))];
    const query = ui.query.trim().toLowerCase();
    const items = grammar.filter((tip) => !query || Object.values(tip).join(' ').toLowerCase().includes(query));
    return `<header class="page-head"><div class="eyebrow">Mẹo bỏ túi · tra nhanh trong lúc làm việc</div><h1>Ngữ pháp dùng được ngay.</h1><p class="subcopy">Một câu hỏi nhanh để chọn đúng cấu trúc. Đây là ghi chú thực hành, không phải bài lý thuyết dài.</p></header>${groups.map((group) => { const visible = items.filter((tip) => tip.group === group); return visible.length ? `<section class="grammar-group"><div class="section-head"><div><h2>${group}</h2><p>${visible.length} mẹo ngắn</p></div></div><div class="grammar-grid">${visible.map((tip) => `<article class="grammar-card"><div class="eyebrow">${group}</div><h3>${tip.title}</h3><code>${tip.pattern}</code><p>${tip.tip}</p><small>Gợi ý nhận biết: ${tip.clue}</small></article>`).join('')}</div></section>` : ''; }).join('')}`;
  }
  function phraseCard(phrase) {
    const category = categoryFor(phrase);
    return `<article class="phrase-card" data-open="${phrase.id}" tabindex="0"><div class="meta">${esc(category.name)} · trang ${String(phrase.day).padStart(2,'0')}</div><button class="card-save ${isSaved(phrase.id)?'on':''}" data-action="save" data-id="${phrase.id}" aria-label="Lưu cụm câu">${icon('bookmark')}</button><h3>${esc(phrase.en)}</h3><p>${esc(phrase.vi)}</p></article>`;
  }

  function savedPage() {
    const list = store.saved.map((id) => byId.get(id)).filter(Boolean);
    return `<header class="page-head"><div class="eyebrow">Bộ sưu tập cá nhân</div><h1>Những câu đã đánh dấu</h1><p class="subcopy">Một góc riêng cho các cụm bạn muốn dùng thường xuyên.</p></header><section class="phrase-grid">${list.length ? list.map(phraseCard).join('') : '<div class="empty">Chưa có cụm nào được đánh dấu. Bấm biểu tượng dấu trang để lưu câu vào đây.</div>'}</section>`;
  }

  function practicePage() {
    if (!ui.practiceIds.length) startPractice(false);
    const phrase = byId.get(ui.practiceIds[ui.practiceIndex]) || PHRASES[0];
    return `<header class="page-head"><div class="eyebrow">Luyện phản xạ</div><h1>Nói trước khi lật trang.</h1><p class="subcopy">Đọc tình huống, thử nói câu tiếng Anh rồi mới xem đáp án.</p></header><div class="practice-wrap"><article class="flash-card"><div class="card-count">Thẻ ${ui.practiceIndex+1} / ${ui.practiceIds.length} · ${esc(categoryFor(phrase).name)}</div><h2>${ui.reveal ? esc(phrase.en) : esc(phrase.vi)}</h2><div class="vi">${ui.reveal ? esc(phrase.vi) : 'Hãy thử nói câu tiếng Anh tương ứng.'}</div><div class="situation"><b>Tình huống:</b> ${esc(phrase.context)}${ui.reveal && phrase.follow ? `<br><br><b>Nói tiếp:</b> ${esc(phrase.follow)}` : ''}</div></article><div class="practice-actions"><button class="btn" data-action="speak" data-id="${phrase.id}">${icon('volume')} Nghe</button><button class="btn btn-dark" data-action="reveal">${ui.reveal?'Ẩn đáp án':'Lật đáp án'}</button><button class="btn btn-coral" data-action="next-card">Thẻ tiếp theo ${icon('arrow')}</button></div></div>`;
  }

  function progressPage() {
    const learned = new Set(store.learned);
    const completedDays = new Set(store.learned.map((id) => byId.get(id)?.day).filter(Boolean)).size;
    return `<header class="page-head"><div class="eyebrow">Dấu vết học tập</div><h1>Cuốn sổ dày lên mỗi ngày.</h1><p class="subcopy">Tiến độ chỉ lưu trên thiết bị này — nhẹ, riêng tư và không cần tài khoản.</p></header><section class="progress-cards"><div class="stat"><b>${store.learned.length}</b><span>Cụm đã ghi nhớ</span></div><div class="stat"><b>${store.saved.length}</b><span>Cụm đã đánh dấu</span></div><div class="stat"><b>${completedDays}</b><span>Trang đã mở</span></div></section><section class="collection-list">${categories.map((category) => { const all = phrasesFor(category.id); const done = all.filter((phrase) => learned.has(phrase.id)).length; const pct = all.length ? Math.round(done/all.length*100) : 0; return `<div class="collection-row"><div class="n">${category.number}</div><div><b>${category.name}</b><small>${done} / ${all.length} cụm đã học</small></div><div class="bar"><i style="width:${pct}%"></i></div></div>`; }).join('')}</section>`;
  }

  function render() {
    const keepSearchFocus = document.activeElement?.id === 'global-search';
    let content = homePage();
    if (ui.page === 'library') content = libraryPage();
    if (ui.page === 'grammar') content = grammarPage();
    if (ui.page === 'practice') content = practicePage();
    if (ui.page === 'saved') content = savedPage();
    if (ui.page === 'progress') content = progressPage();
    $('#app').innerHTML = shell(content);
    renderModal();
    if (keepSearchFocus) {
      const search = $('#global-search');
      search?.focus();
      search?.setSelectionRange(search.value.length, search.value.length);
    }
  }
  function renderModal() {
    const root = $('#modal-root');
    if (!ui.selected) { root.innerHTML = ''; return; }
    const phrase = byId.get(ui.selected);
    if (!phrase) return;
    const learned = store.learned.includes(phrase.id);
    root.innerHTML = `<div class="modal-overlay" data-action="close-modal"><article class="modal" role="dialog" aria-modal="true" aria-labelledby="phrase-title"><button class="icon-btn modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button><div class="eyebrow">${esc(categoryFor(phrase).name)} · trang ${String(phrase.day).padStart(2,'0')}</div><h2 id="phrase-title">${esc(phrase.en)}</h2><div class="modal-vi">${esc(phrase.vi)}</div><div class="modal-context"><b>Dùng khi:</b><br>${esc(phrase.context)}</div><div class="modal-follow">${esc(phrase.follow)}</div><div class="hero-actions"><button class="btn" data-action="speak" data-id="${phrase.id}">${icon('volume')} Nghe phát âm</button><button class="btn ${isSaved(phrase.id)?'btn-coral':''}" data-action="save" data-id="${phrase.id}">${icon('bookmark')} ${isSaved(phrase.id)?'Đã lưu':'Lưu vào sổ'}</button><button class="btn btn-dark" data-action="learn" data-id="${phrase.id}">${icon('check')} ${learned?'Đã ghi nhớ':'Đánh dấu đã nhớ'}</button></div></article></div>`;
  }

  function startPractice(shouldRender = true) {
    const source = store.saved.length >= 5 ? store.saved.filter((id) => byId.has(id)) : PHRASES.map((phrase) => phrase.id);
    ui.practiceIds = [...source].sort(() => Math.random() - .5).slice(0, 5);
    ui.practiceIndex = 0;
    ui.reveal = false;
    if (shouldRender) render();
  }
  function speak(id) {
    const phrase = byId.get(id);
    if (!phrase || !('speechSynthesis' in window)) { toast('Thiết bị này chưa hỗ trợ phát âm.'); return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase.en);
    utterance.lang = store.accent || 'en-US';
    utterance.rate = .86;
    speechSynthesis.speak(utterance);
  }
  function toggleSave(id) {
    store.saved = isSaved(id) ? store.saved.filter((item) => item !== id) : [...store.saved, id];
    save();
    toast(isSaved(id) ? 'Đã lưu vào sổ tay.' : 'Đã bỏ khỏi sổ tay.');
    render();
  }
  function learn(id) {
    if (!store.learned.includes(id)) store.learned.push(id);
    save();
    toast('Đã ghi dấu vào tiến độ học.');
    render();
  }
  function continueToday() {
    const today = todayPhrases();
    const next = today.find((phrase) => !store.learned.includes(phrase.id)) || today[0];
    ui.selected = next?.id || PHRASES[0]?.id;
    renderModal();
  }
  function go(page) {
    ui.page = page;
    ui.selected = null;
    if (page === 'practice') startPractice(false);
    render();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-page],[data-action],[data-category],[data-filter],[data-open]');
    if (!target) return;
    if (target.dataset.action === 'save') event.stopPropagation();
    if (target.dataset.page) return go(target.dataset.page);
    if (target.dataset.category) { ui.category = target.dataset.category; return go('library'); }
    if (target.dataset.filter) { ui.category = target.dataset.filter; return render(); }
    if (target.dataset.open) { ui.selected = target.dataset.open; return renderModal(); }
    const action = target.dataset.action;
    if (action === 'random') { ui.selected = PHRASES[Math.floor(Math.random()*PHRASES.length)]?.id; renderModal(); }
    if (action === 'continue') continueToday();
    if (action === 'speak') speak(target.dataset.id);
    if (action === 'save') toggleSave(target.dataset.id);
    if (action === 'learn') learn(target.dataset.id);
    if (action === 'reveal') { ui.reveal = !ui.reveal; render(); }
    if (action === 'next-card') { ui.practiceIndex = (ui.practiceIndex + 1) % ui.practiceIds.length; ui.reveal = false; render(); }
    if (action === 'close-modal' && (target === event.target || target.tagName === 'BUTTON')) { ui.selected = null; renderModal(); }
  });
  document.addEventListener('input', (event) => {
    if (event.target.id !== 'global-search') return;
    ui.query = event.target.value;
    ui.page = 'library';
    ui.category = 'all';
    clearTimeout(ui.searchTimer);
    ui.searchTimer = setTimeout(render, 120);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && ui.selected) { ui.selected = null; renderModal(); }
    const card = event.target.closest?.('.phrase-card');
    if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); ui.selected = card.dataset.open; renderModal(); }
  });

  render();
})();
