                                                       

// All selectors refer to the static, application-owned HTML above.
const countInput = document.querySelector                  ('#count') ;
const startButton = document.querySelector                   ('#start') ;
const target = document.querySelector                   ('#target') ;
const title = document.querySelector             ('#target-title') ;
const hint = document.querySelector             ('#target-hint') ;
const symbol = document.querySelector             ('#symbol') ;
const statusText = document.querySelector             ('#status') ;
const round = document.querySelector             ('#round') ;
const progress = document.querySelector             ('#progress') ;
const last = document.querySelector             ('#last') ;
const average = document.querySelector             ('#average') ;
const scoreHistory = document.querySelector                  ('#history') ;

let phase        = 'idle';
let total = 5;
let scores           = [];
let sum = 0;
let readyAt = 0;
let timer                    ;
let frame                    ;
let generation = 0;

function cancelPending()       {
  generation += 1;
  window.clearTimeout(timer);
  if (frame !== undefined) window.cancelAnimationFrame(frame);
  timer = undefined;
  frame = undefined;
}

function setPhase(next       , heading        , detail        )       {
  phase = next;
  target.dataset.phase = next;
  title.textContent = heading;
  hint.textContent = detail;
  symbol.textContent = next === 'ready' ? '↗' : next === 'complete' ? '✓' : '⌁';
}

function updateMetrics()       {
  progress.innerHTML = `${scores.length} / ${total}<small>次</small>`;
  last.innerHTML = `${scores.length ? scores[scores.length - 1].toFixed(1) : '—'}<small>ms</small>`;
  average.innerHTML = `${scores.length ? (sum / scores.length).toFixed(1) : '—'}<small>ms</small>`;
}

function clearScores()       {
  scores = [];
  sum = 0;
  scoreHistory.replaceChildren();
  const empty = document.createElement('li');
  empty.className = 'empty';
  empty.textContent = '你的第一条记录，即将诞生。';
  scoreHistory.append(empty);
  updateMetrics();
}

function waitForGreen()       {
  cancelPending();
  const current = generation;
  setPhase('waiting', '等待变绿', '本次已开始 · 随机等待 3–7 秒');
  round.textContent = `第 ${scores.length + 1} / ${total} 次已开始，请等待变绿`;
  // The timeout is followed by a rendering frame so timing begins with the visual update.
  timer = window.setTimeout(() => {
    frame = window.requestAnimationFrame(() => {
      if (current !== generation || document.hidden) return;
      setPhase('ready', '现在点击！', '就是现在');
      readyAt = performance.now();
    });
  }, 3000 + Math.random() * 4000);
}

function validateCount()          {
  const value = countInput.valueAsNumber;
  const valid = Number.isInteger(value) && value >= 3 && value <= 100;
  countInput.setCustomValidity(valid ? '' : '请输入 3 到 100 之间的整数。');
  return valid;
}

function startSession()       {
  if (!validateCount()) {
    countInput.reportValidity();
    return;
  }
  total = countInput.valueAsNumber;
  countInput.disabled = true;
  startButton.textContent = '重新开始 ↻';
  clearScores();
  statusText.textContent = '红色时不要点击，变绿后再出手。';
  waitForGreen();
}

function handleAttempt()       {
  if (phase === 'waiting') {
    clearScores();
    statusText.textContent = '抢跑了！本轮成绩全部清空，已从第 1 次重新开始。';
    waitForGreen();
    return;
  }
  if (phase !== 'ready') return;
  const elapsed = performance.now() - readyAt;
  scores.push(elapsed);
  sum += elapsed;
  if (scores.length === 1) scoreHistory.replaceChildren();
  const item = document.createElement('li');
  const number = document.createElement('span');
  number.textContent = String(scores.length).padStart(2, '0');
  item.append(number, `${elapsed.toFixed(1)} ms`);
  scoreHistory.append(item);
  updateMetrics();
  if (scores.length === total) {
    cancelPending();
    setPhase('complete', '测试完成', '可以调整次数，再挑战一次');
    round.textContent = '本轮已完成';
    statusText.textContent = `完成 ${total} 次，平均反应时间 ${(sum / total).toFixed(1)} ms。`;
    countInput.disabled = false;
    startButton.textContent = '再测一次 ↗';
  } else {
    statusText.textContent = `上次 ${elapsed.toFixed(1)} ms。下一次已经开始，请等待变绿。`;
    waitForGreen();
  }
}

function invalidateSession()       {
  if (phase !== 'waiting' && phase !== 'ready') return;
  cancelPending();
  clearScores();
  setPhase('idle', '本轮已作废', '点击上方按钮重新开始');
  round.textContent = '请保持测试窗口在前台';
  statusText.textContent = '离开窗口会影响计时，本轮成绩已清空。';
  countInput.disabled = false;
  startButton.textContent = '重新开始 ↻';
}

startButton.addEventListener('click', startSession);
countInput.addEventListener('input', () => {
  if (validateCount() && phase === 'idle') {
    total = countInput.valueAsNumber;
    updateMetrics();
  }
});
target.addEventListener('pointerdown', (event              ) => {
  if (event.button !== 0) return;
  // Measure the press, not release; ignore the subsequent compatibility click.
  event.preventDefault();
  handleAttempt();
});
target.addEventListener('keydown', (event               ) => {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  event.preventDefault();
  if (!event.repeat) handleAttempt();
});
target.addEventListener('click', (event            ) => {
  // Assistive technologies may activate a button without pointer or key events.
  if (event.detail === 0) handleAttempt();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) invalidateSession();
});
window.addEventListener('blur', invalidateSession);
