/* ============================================================
   FIREBASE INIT
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyDSsqSSH_WSTIG17zgfsJiKpx4TtsiLPGQ",
  authDomain: "cartelscore-a2473.firebaseapp.com",
  databaseURL: "https://cartelscore-a2473-default-rtdb.firebaseio.com",
  projectId: "cartelscore-a2473",
  storageBucket: "cartelscore-a2473.firebasestorage.app",
  messagingSenderId: "645482608954",
  appId: "1:645482608954:web:0ef0b32cbd9cf135207803",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();


/* ============================================================
   SVG HOLDERS (클라이밍 홀더 느낌)
   ============================================================ */
const holders = [
`<svg width="90" height="60"><path d="M10 30 Q5 15 20 10 Q40 5 50 20 Q45 35 25 35 Z" fill="#b98cff" stroke="black" stroke-width="3"/></svg>`,
`<svg width="90" height="60"><path d="M8 28 Q5 15 18 12 Q35 10 48 18 Q50 30 30 33 Z" fill="#ffe57f" stroke="black" stroke-width="3"/></svg>`,
`<svg width="90" height="60"><path d="M12 30 Q5 18 15 8 Q35 5 48 15 Q45 32 28 34 Z" fill="#8fe27e" stroke="black" stroke-width="3"/></svg>`,
`<svg width="90" height="60"><path d="M10 26 Q12 10 30 8 Q48 10 46 26 Q35 34 20 32 Z" fill="#6ea8ff" stroke="black" stroke-width="3"/></svg>`
];


/* ============================================================
   홀더 배경 자동 배치
   ============================================================ */
function placeHolders() {
  const bg = document.getElementById("holderBackground");
  for (let i = 0; i < 45; i++) {
    const h = document.createElement("div");
    h.className = "holder";
    h.innerHTML = holders[Math.floor(Math.random() * holders.length)];
    h.style.left = Math.random() * 95 + "%";
    h.style.top = Math.random() * 95 + "%";
    h.style.transform =
      `rotate(${Math.random() * 360}deg) scale(${0.7 + Math.random() * 0.8})`;
    bg.appendChild(h);
  }
}
placeHolders();


/* ============================================================
   점수 테이블 정보
   ============================================================ */
const scoreMap = {
  "노랑": 5,
  "초록": 10,
  "하늘": 20,
  "파랑": 40,
  "보라": 60,
  "회색": 90,
  "갈색": 120,
  "검은색": 200
};

const levels = Object.keys(scoreMap);
const teams = ["A", "B", "C", "D", "E", "F"];

const teamsContainer = document.getElementById("teams");


/* ============================================================
   팀 카드 자동 생성
   ============================================================ */
teams.forEach(team => {
  const box = document.createElement("div");
  box.className = "team-box";

  box.innerHTML = `
    <h2>${team}팀</h2>

    <select id="${team}_level">
      ${levels.map(l => `<option value="${l}">${l}</option>`).join("")}
    </select>

    <button class="add-btn" onclick="addScore('${team}')">점수 추가</button>
    <button class="minus-btn" onclick="minusScore('${team}')">점수 차감</button>
  `;

  teamsContainer.appendChild(box);
});


/* ============================================================
   점수 추가
   ============================================================ */
function addScore(team) {
  const lv = document.getElementById(team + "_level").value;
  const p = scoreMap[lv];

  db.ref("scores/" + team).once("value").then(snap => {
    const current = snap.val() || 0;
    db.ref("scores/" + team).set(current + p);

    addLog(team, "add", lv, p);
  });
}


/* ============================================================
   점수 차감
   ============================================================ */
function minusScore(team) {
  const lv = document.getElementById(team + "_level").value;
  const p = scoreMap[lv];

  db.ref("scores/" + team).once("value").then(snap => {
    let current = snap.val() || 0;
    let updated = current - p;
    if (updated < 0) updated = 0;

    db.ref("scores/" + team).set(updated);

    addLog(team, "minus", lv, p);
  });
}


/* ============================================================
   총점 표 자동 갱신 (실시간)
   ============================================================ */
db.ref("scores").on("value", snap => {
  const tbody = document.getElementById("summary");
  tbody.innerHTML = "";

  const scores = snap.val() || {};

  teams.forEach(team => {
    const score = scores[team] || 0;

    tbody.innerHTML += `
      <tr>
        <td><b>${team}</b></td>
        <td>${score}</td>
      </tr>
    `;
  });
});


/* ============================================================
   LOG 기록 저장
   ============================================================ */
function addLog(team, action, level, point) {
  db.ref("logs").push({
    team: team,
    action: action,
    level: level,
    point: point,
    time: new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  });
}


/* ============================================================
   LOG 패널 열기/닫기
   ============================================================ */
const logPanel = document.getElementById("logPanel");
const logToggle = document.getElementById("logToggle");
const logClose = document.getElementById("logClose");

logToggle.addEventListener("click", () => {
  logPanel.classList.toggle("open");
});

logClose.addEventListener("click", () => {
  logPanel.classList.remove("open");
});


/* ============================================================
   LOG 실시간 업데이트
   ============================================================ */
db.ref("logs").on("value", snap => {
  const list = document.getElementById("logList");
  list.innerHTML = "";

  const logs = snap.val() || {};

  const items = Object.values(logs).reverse();

  items.forEach(l => {
    const sign = l.action === "add"
      ? `<span style="color:green;font-weight:bold;">+${l.point}</span>`
      : `<span style="color:red;font-weight:bold;">-${l.point}</span>`;

    list.innerHTML += `
      <div class="log-item">
        <b>${l.team}팀</b> — ${sign}<br>
        ${l.level}<br>
        <small>${l.time}</small>
      </div>
    `;
  });
});


/* ============================================================
   전체 점수 초기화 (비밀번호)
   ============================================================ */
function resetScores() {
  const pw = prompt("관리자 비밀번호:");
  if (pw !== "cartel123") {
    alert("비밀번호 오류!");
    return;
  }

  teams.forEach(team => {
    db.ref("scores/" + team).set(0);
  });

  db.ref("logs").remove();

  alert("전체 점수 & 로그 초기화 완료!");
}


/* ============================================================
   로그만 초기화
   ============================================================ */
function resetLogs() {
  const pw = prompt("로그 초기화 비밀번호:");
  if (pw !== "cartel123") {
    alert("잘못된 비밀번호입니다.");
    return;
  }

  db.ref("logs").remove();
  alert("로그만 초기화 완료!");
}
