// 대상 페이지 내에서 스크립트를 실행하는 헬퍼
function evalInPage(jsCode) {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(jsCode, (result, isException) => {
      if (isException) reject(isException);
      else resolve(result);
    });
  });
}

// 모든 커스텀 명령어가 정의된 엔진 오브젝트
const Commands = {
  help: () => {
    return `[ Available Commands ]
- help : 명령어 목록을 출력합니다.
- PrintToConsole('msg') : 페이지 및 확장 프로그램 콘솔에 메시지 출력
- alert('msg') : 페이지에 알림창 띄우기
- Closewebpage : 현재 웹페이지 닫기 시도 (또는 blank 이동)
- Incog-mode : 시크릿 모드 가상 차단막 시뮬레이션
- Killprocess : 페이지 무한 루프 주입 (프로세스 다운)
- colorMouse('color') : 마우스 커서 색상 변경 (red, yellow, orange, green, blue, dark-blue, purple, black, pink, white, normal)
- ConvertImageToString : 현재 페이지의 첫 이미지 URL 문자열 변환
- JSexecute(javascript) : 현재 페이지 컨텍스트에서 JS 코드 실행
- HTMLexcute(HTML) : 현재 페이지 body 끝에 HTML 추가
- disableRemotes : 외부 원격 스크립트 강제 삭제
- AntiRedirect : 리dairekt 및 이탈 차단 활성화
- Theme(colors) : 개발자 도구 패널 자체 테마 (dark, light, blue, purple)
- BGcolor(color) : 대상 웹페이지 배경색 변경
- DelKeys : 대상 웹페이지 키보드 입력 전체 차단
- Kill-texts : 대상 웹페이지 모든 텍스트 내용 삭제
- NoSounds : 모든 비디오/오디오 미디어 소리 강제 음소거
- InfoPage : 현재 페이지의 URL, Title 정보 수집
- do_something_random : 랜덤 동작 수행 (로그 출력 등)`;
  },

  PrintToConsole: (msg) => {
    console.log("[External-commands]", msg);
    evalInPage(`console.log("[External-commands]: ${msg}")`);
    return `Printed to console: ${msg}`;
  },

  alert: (msg) => {
    evalInPage(`alert("${msg}")`);
    return `Alerted: ${msg}`;
  },

  Closewebpage: () => {
    evalInPage(`window.close(); if(!window.closed) { location.href = 'about:blank'; }`);
    return "Close requested / Redirected to about:blank";
  },

  "Incog-mode": () => {
    return "Incognito context simulated. Local tracking storage isolated.";
  },

  Killprocess: () => {
    evalInPage(`setTimeout(() => { while(true) {} }, 50);`);
    return "Process loop injected. Page will freeze shortly.";
  },

  colorMouse: (color) => {
    let style = "default";
    const colors = {
      'red': 'red', 'yellow': 'yellow', 'orange': 'orange', 'green': 'lime',
      'blue': 'cyan', 'dark-blue': 'blue', 'purple': 'purple', 'black': 'black',
      'pink': 'hotpink', 'white': 'white'
    };
    if (colors[color]) {
      const svg = `<svg xmlns='http://w3.org' width='24' height='24' viewBox='0 0 24 24'><path fill='${colors[color]}' stroke='black' stroke-width='1.5' d='M4.5 3v15.3l4.4-4.3 3 7 3-1.3-3-7 5.7-.3Z'/></svg>`;
      style = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 4 4, auto`;
    }
    evalInPage(`document.body.style.cursor = "${style}"; document.documentElement.style.cursor = "${style}";`);
    return `Mouse color applied: ${color}`;
  },

  ConvertImageToString: async () => {
    const img = await evalInPage(`(() => { const i = document.querySelector('img'); return i ? i.src : 'No image'; })()`);
    return `Image String Source: ${img}`;
  },

  JSexecute: async (code) => {
    const res = await evalInPage(code);
    return `JS Output: ${res}`;
  },

  HTMLexcute: (html) => {
    const b64 = btoa(unescape(encodeURIComponent(html)));
    evalInPage(`
      var d = document.createElement('div');
      d.innerHTML = decodeURIComponent(escape(atob('${b64}')));
      document.body.appendChild(d);
    `);
    return "HTML string appended to body.";
  },

  disableRemotes: () => {
    evalInPage(`document.querySelectorAll('script[src]').forEach(s => s.remove());`);
    return "All remote scripts force-stopped.";
  },

  AntiRedirect: () => {
    evalInPage(`window.onbeforeunload = function() { return "Blocked"; };`);
    return "Anti-Redirect hooks enabled.";
  },

  Theme: (style) => {
    const r = document.documentElement;
    if (style === 'light') {
      r.style.setProperty('--bg-color', '#ffffff');
      r.style.setProperty('--panel-bg', '#eaeaea');
      r.style.setProperty('--text-color', '#000000');
    } else if (style === 'blue') {
      r.style.setProperty('--bg-color', '#0f172a');
      r.style.setProperty('--panel-bg', '#1e293b');
      r.style.setProperty('--text-color', '#38bdf8');
    } else if (style === 'purple') {
      r.style.setProperty('--bg-color', '#1e1b4b');
      r.style.setProperty('--panel-bg', '#312e81');
      r.style.setProperty('--text-color', '#c084fc');
    } else {
      r.style.setProperty('--bg-color', '#1a1a1a');
      r.style.setProperty('--panel-bg', '#262626');
      r.style.setProperty('--text-color', '#ffffff');
    }
    return `Theme altered naturally to: ${style}`;
  },

  BGcolor: (color) => {
    evalInPage(`document.body.style.backgroundColor = "${color}";`);
    return `Background changed to ${color}`;
  },

  DelKeys: () => {
    evalInPage(`
      window.addEventListener('keydown', e => { e.stopImmediatePropagation(); e.preventDefault(); }, true);
      window.addEventListener('keypress', e => { e.stopImmediatePropagation(); e.preventDefault(); }, true);
    `);
    return "Key triggers deleted on target window.";
  },

  "Kill-texts": () => {
    evalInPage(`document.querySelectorAll('*').forEach(e => { if(e.children.length === 0 && e.innerText) e.innerText = ''; });`);
    return "All text strings cleared from DOM.";
  },

  NoSounds: () => {
    evalInPage(`document.querySelectorAll('video, audio').forEach(m => { m.muted = true; m.pause(); });`);
    return "All page active audio/video muted.";
  },

  InfoPage: async () => {
    const data = await evalInPage(`JSON.stringify({ url: location.href, title: document.title })`);
    return `Page Info: ${data}`;
  },

  do_something_random: () => {
    const r = Math.random();
    if(r < 0.33) return "Random Trigger: System Clean and Operational.";
    if(r < 0.66) { evalInPage(`console.info("Random internal ping actioned.")`); return "Page console pinged."; }
    return `Random Numeric Value: ${Math.floor(Math.random() * 10000)}`;
  }
};

// 사용자가 입력한 문자열 텍스트 명령어를 스마트 파싱하여 함수로 실행시키는 실행 코어
async function executeConsole() {
  const output = document.getElementById("output");
  let rawInput = document.getElementById("code").value.trim();
  
  if (!rawInput) {
    output.innerText = "입력된 명령어가 없습니다.";
    return;
  }

  output.innerText = "Running...\n";

  // 괄호 유무와 상관없이 매핑 처리하기 위한 파싱 알고리즘
  let commandName = rawInput;
  let argument = null;

  const bracketIndex = rawInput.indexOf("(");
  if (bracketIndex !== -1) {
    commandName = rawInput.substring(0, bracketIndex).trim();
    let closingIndex = rawInput.lastIndexOf(")");
    if (closingIndex === -1) closingIndex = rawInput.length;
    // 따옴표 문자열 파라미터 추출 및 제거
    let innerArg = rawInput.substring(bracketIndex + 1, closingIndex).trim();
    argument = innerArg.replace(/^['"]|['"]$/g, '');
  }

  // 매핑 함수 검색 및 처리
  if (Commands[commandName]) {
    try {
      const result = await Commands[commandName](argument);
      output.innerText = result;
    } catch (err) {
      output.innerText = "Execution Error: " + err.message;
    }
  } else {
    // 정의되지 않은 임의의 순수 코드가 들어왔을 때를 대비한 Fallback (JSexecute)
    try {
      const res = await evalInPage(rawInput);
      output.innerText = `[Direct JS Fallback Result]: ${res}`;
    } catch(e) {
      output.innerText = `Unknown command or syntax error: "${commandName}"\nType 'help' for instructions.`;
    }
  }
}

document.getElementById("run-btn").addEventListener("click", executeConsole);
