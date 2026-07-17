let pyodideInstance = null;

// 1. Pyodide 초기화
async function initPyodide() {
  const outputElement = document.getElementById("output");
  const runButton = document.getElementById("run-btn");

  try {
    // pyodide.js가 정상 로드되었는지 확인 후 인스턴스 생성
    pyodideInstance = await loadPyodide();
    
    outputElement.innerText = "Python 런타임 준비 완료! 코드를 실행해보세요.";
    runButton.innerText = "Run Script";
    runButton.disabled = false;
  } catch (err) {
    outputElement.innerText = "Pyodide 로드 실패: " + err.message;
  }
}

// 2. Python 코드 실행
async function runPython() {
  const code = document.getElementById("code").value;
  const outputElement = document.getElementById("output");
  
  if (!pyodideInstance) return;

  outputElement.innerText = "실행 중...\n";

  try {
    // Python의 sys.stdout을 재정의하여 print() 출력을 자바스크립트로 캡처
    pyodideInstance.runPython(`
      import sys
      import io
      sys.stdout = io.StringIO()
    `);

    // 사용자 코드 실행
    await pyodideInstance.runPythonAsync(code);

    // 캡처된 출력 가져오기
    const stdout = pyodideInstance.runPython("sys.stdout.getvalue()");
    outputElement.innerText = stdout || "코드 실행 완료 (출력 없음)";
  } catch (err) {
    // 에러 발생 시 출력 창에 표시
    outputElement.innerText = "Error:\n" + err.message;
  }
}

// 이벤트 리스너 등록
document.getElementById("run-btn").addEventListener("click", runPython);

// 페이지 로드 시 초기화 시작
initPyodide();
