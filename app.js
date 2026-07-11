"use strict";

const SAVE_KEY = "stableStorySaveV1";
const app = document.getElementById("app");
let currentGame = null;
let actionLocked = false;

function randomValue(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function numberIsSafe(value) { return typeof value === "number" && Number.isFinite(value) && Number.isSafeInteger(value); }

function readSave() {
  const raw = window.localStorage.getItem(SAVE_KEY);
  if (raw === null) return { state: null, invalid: false };
  try {
    const data = JSON.parse(raw);
    if (!validSave(data)) return { state: null, invalid: true };
    applyRecordDefaults(data);
    return { state: data, invalid: false };
  } catch (error) { return { state: null, invalid: true }; }
}

function validSave(data) {
  if (!data || data.saveVersion !== 1 || typeof data.stableName !== "string" || typeof data.horseName !== "string" || typeof data.latestMessage !== "string") return false;
  const integerFields = ["age", "currentWeek", "trainingCount", "money", "wins", "races", "prizeMoney"];
  if (integerFields.some(function (field) { return !numberIsSafe(data[field]); })) return false;
  if (data.age < 1 || data.currentWeek < 1 || data.trainingCount < 0 || data.money < 0 || data.wins < 0 || data.races < 0 || data.prizeMoney < 0) return false;
  if (!["speed", "stamina", "power", "spirit", "condition"].every(function (field) { return numberIsSafe(data[field]) && data[field] >= 1 && data[field] <= 100; })) return false;
  if (!numberIsSafe(data.fatigue) || data.fatigue < 0 || data.fatigue > 100) return false;
  if (data.raceHistory !== undefined && (!Array.isArray(data.raceHistory) || data.raceHistory.some(function (entry) { return !entry || !numberIsSafe(entry.week) || entry.week < 1 || typeof entry.raceName !== "string" || !numberIsSafe(entry.finishPosition) || entry.finishPosition < 1 || entry.finishPosition > 8 || !numberIsSafe(entry.prize) || entry.prize < 0 || entry.entryFee !== 5000 || entry.fieldSize !== 8; }))) return false;
  if (data.bestFinish !== undefined && data.bestFinish !== null && (!numberIsSafe(data.bestFinish) || data.bestFinish < 1 || data.bestFinish > 8)) return false;
  if (data.totalFinishPositions !== undefined && (!numberIsSafe(data.totalFinishPositions) || data.totalFinishPositions < 0)) return false;
  return data.firstVictoryCelebrated === undefined || typeof data.firstVictoryCelebrated === "boolean";
}

function applyRecordDefaults(data) {
  if (!Array.isArray(data.raceHistory)) data.raceHistory = [];
  if (data.bestFinish === undefined) data.bestFinish = null;
  if (data.totalFinishPositions === undefined) data.totalFinishPositions = 0;
  if (data.firstVictoryCelebrated === undefined) data.firstVictoryCelebrated = false;
  data.raceHistory = data.raceHistory.slice(-20);
}

function saveGame(showStatus) {
  if (!currentGame) return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify({ saveVersion: 1, stableName: currentGame.stableName, horseName: currentGame.horseName, age: currentGame.age, currentWeek: currentGame.week, trainingCount: currentGame.trainingCount, money: currentGame.money, wins: currentGame.wins, races: currentGame.races, prizeMoney: currentGame.prizeMoney, speed: currentGame.speed, stamina: currentGame.stamina, power: currentGame.power, spirit: currentGame.spirit, condition: currentGame.condition, fatigue: currentGame.fatigue, latestMessage: currentGame.latestMessage, raceHistory: currentGame.raceHistory || [], bestFinish: currentGame.bestFinish ?? null, totalFinishPositions: currentGame.totalFinishPositions || 0, firstVictoryCelebrated: currentGame.firstVictoryCelebrated || false }));
  if (showStatus) currentGame.saveStatus = showStatus;
}

function showTitle(statusMessage) {
  const save = readSave();
  const hasSave = Boolean(save.state);
  const status = statusMessage || (save.invalid ? "Save data could not be loaded. Start a new game." : "");
  app.innerHTML = `<div class="horse-mark" aria-hidden="true">&#9822;</div><p class="eyebrow">A NEW RACING STORY</p><h1 id="game-title">Stable Story</h1><p class="version">Ver.0.1 Development Build</p><p class="subtitle">Begin with one horse. Build a lasting legacy.</p><div class="title-actions"><button id="new-game-button" class="primary-button" type="button">New Game</button><button id="continue-button" class="secondary-button" type="button" ${hasSave ? "" : "disabled"}>${hasSave ? "Continue" : "Continue - No Save Data"}</button>${hasSave ? '<button id="delete-save-button" class="quiet-button" type="button">Delete Save Data</button>' : ""}</div><p id="message" class="message" role="status" aria-live="polite">${escapeHtml(status)}</p>`;
  document.getElementById("new-game-button").addEventListener("click", function () { if (hasSave && !window.confirm("Start a new game? Existing saved progress will be replaced when the new game is saved.")) { showTitle(); return; } showSetup(); });
  if (hasSave) { document.getElementById("continue-button").addEventListener("click", function () { currentGame = save.state; currentGame.saveStatus = ""; showStable(currentGame.latestMessage); }); document.getElementById("delete-save-button").addEventListener("click", deleteSave); }
}

function deleteSave() {
  if (!window.confirm("Delete all Stable Story save data? This cannot be undone.")) return;
  window.localStorage.removeItem(SAVE_KEY);
  showTitle("Save data deleted.");
}

function showSetup() {
  app.innerHTML = `<p class="eyebrow">BEGIN YOUR STORY</p><h1 id="game-title">New Game</h1><p class="subtitle">Name your stable and your first horse.</p><form id="setup-form" class="setup-form"><label for="stable-name">Stable Name</label><input id="stable-name" name="stableName" type="text" maxlength="40" placeholder="Green Field Stable"><label for="horse-name">Horse Name</label><input id="horse-name" name="horseName" type="text" maxlength="30" placeholder="First Star"><button class="primary-button" type="submit">Start Game</button><button id="setup-back" class="secondary-button" type="button">Back to Title</button></form>`;
  document.getElementById("setup-form").addEventListener("submit", createHorse);
  document.getElementById("setup-back").addEventListener("click", showTitle);
}

function createHorse(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  currentGame = { stableName: String(form.get("stableName")).trim() || "Green Field Stable", horseName: String(form.get("horseName")).trim() || "First Star", age: 2, week: 1, trainingCount: 0, money: 100000, wins: 0, races: 0, prizeMoney: 0, speed: randomValue(35, 50), stamina: randomValue(35, 50), power: randomValue(30, 45), spirit: randomValue(30, 45), condition: randomValue(65, 85), fatigue: 0, latestMessage: "Your horse is ready.", raceHistory: [], bestFinish: null, totalFinishPositions: 0, firstVictoryCelebrated: false, saveStatus: "" };
  saveGame("Autosaved.");
  showStable(currentGame.latestMessage);
}

function getRaceState(game) {
  if (game.week < 4) return { ready: false, label: "Race - Unlocks Week 4", message: "Race unlocks at Week 4." };
  if (game.fatigue >= 90) return { ready: false, label: "Race - Too Tired", message: "Your horse is too tired to race. Let the horse rest." };
  if (game.money < 5000) return { ready: false, label: "Race - Need 5000", message: "At least 5000 is required for the entry fee." };
  return { ready: true, label: "Enter Race", message: "Greenfield Beginner Cup is available." };
}

function showStable(resultMessage) {
  const g = currentGame;
  applyRecordDefaults(g);
  const trainingLocked = g.fatigue >= 90;
  const winRate = g.races === 0 ? "0.0%" : `${((g.wins / g.races) * 100).toFixed(1)}%`;
  const averageFinish = g.races === 0 ? "-" : (g.totalFinishPositions / g.races).toFixed(1);
  const recentRaces = g.raceHistory.slice(-5).reverse();
  const historyHtml = recentRaces.length === 0 ? "<p class=\"empty-note\">No races completed yet.</p>" : recentRaces.map(function (race) { return `<div class="history-card"><strong>Week ${race.week}</strong><span>${escapeHtml(race.raceName)}</span><span>${ordinal(race.finishPosition)} Place</span><span>Prize: ${race.prize}</span></div>`; }).join("");
  const raceState = getRaceState(g);
  app.innerHTML = `<p class="eyebrow">YOUR STABLE</p><h1 id="game-title">Stable Story</h1><div class="stable-summary"><p><span>Stable</span><strong>${escapeHtml(g.stableName)}</strong></p><p><span>Horse</span><strong>${escapeHtml(g.horseName)}</strong></p><p><span>Age</span><strong>${g.age} years old</strong></p><p><span>Current Week</span><strong>${g.week}</strong></p><p><span>Money</span><strong>${g.money}</strong></p><p><span>Record</span><strong>${g.wins} Wins / ${g.races} Races</strong></p><p><span>Total Prize Money</span><strong>${g.prizeMoney}</strong></p></div><h2>Stable Records</h2><div class="abilities"><p><span>Races</span><strong>${g.races}</strong></p><p><span>Wins</span><strong>${g.wins}</strong></p><p><span>Win Rate</span><strong>${winRate}</strong></p><p><span>Total Prize Money</span><strong>${g.prizeMoney}</strong></p><p><span>Best Finish</span><strong>${g.bestFinish === null ? "-" : ordinal(g.bestFinish)}</strong></p><p><span>Average Finish</span><strong>${averageFinish}</strong></p></div><h2>Horse Abilities</h2><div class="abilities"><p><span>Speed</span><strong>${g.speed}</strong></p><p><span>Stamina</span><strong>${g.stamina}</strong></p><p><span>Power</span><strong>${g.power}</strong></p><p><span>Spirit</span><strong>${g.spirit}</strong></p><p><span>Condition</span><strong>${g.condition}</strong></p><p><span>Fatigue</span><strong>${g.fatigue}</strong></p></div><h2>Recent Races</h2><div class="race-history">${historyHtml}</div><h2>Training</h2><div class="title-actions training-actions"><button data-action="speed" class="primary-button" type="button" ${trainingLocked ? "disabled" : ""}>Speed Training</button><button data-action="stamina" class="primary-button" type="button" ${trainingLocked ? "disabled" : ""}>Stamina Training</button><button data-action="power" class="primary-button" type="button" ${trainingLocked ? "disabled" : ""}>Power Training</button><button data-action="rest" class="secondary-button" type="button">Rest</button></div><p class="message">${escapeHtml(resultMessage || g.latestMessage)}${g.saveStatus ? ` <small>${escapeHtml(g.saveStatus)}</small>` : ""}${trainingLocked ? " Your horse is too tired to train. Let the horse rest." : ""}</p><h2>Race</h2><p class="race-info">Greenfield Beginner Cup | Turf 1600m | Entry 5000</p><button id="race-button" class="primary-button" type="button" ${raceState.ready ? "" : "disabled"}>${raceState.label}</button><p class="message race-status">${escapeHtml(raceState.message)}</p><div class="title-actions"><button id="manual-save" class="secondary-button" type="button">Save</button><button id="stable-back" class="primary-button" type="button">Back to Title</button></div>`;
  document.querySelectorAll("[data-action]").forEach(function (button) { button.addEventListener("click", function () { performAction(button.dataset.action); }); });
  document.getElementById("manual-save").addEventListener("click", function () { saveGame("Game saved."); showStable(g.latestMessage); });
  document.getElementById("race-button").addEventListener("click", startRace);
  document.getElementById("stable-back").addEventListener("click", function () { if (window.confirm("Return to the title screen? Current progress has been saved.")) { saveGame(""); currentGame = null; showTitle(); } });
}

const opponentNames = ["Amber Comet", "Blue Meadow", "Cedar Flash", "Dawn Runner", "Golden Brook", "Misty Clover", "Silver Fern"];
const prizeTable = [30000, 15000, 8000, 4000, 2000, 0, 0, 0];

function startRace() {
  if (currentGame.week < 4 || currentGame.fatigue >= 90 || currentGame.money < 5000 || actionLocked) return;
  actionLocked = true;
  const horses = [{ name: currentGame.horseName, player: true, score: raceScore(currentGame) }];
  opponentNames.forEach(function (name) { horses.push({ name: name, player: false, score: randomValue(180, 330) }); });
  horses.sort(function (a, b) { return b.score - a.score; });
  showRace(horses);
  window.setTimeout(function () { finishRace(horses); }, 1700);
}

function raceScore(horse) {
  return horse.speed * 2 + horse.stamina + horse.power + horse.spirit + horse.condition - horse.fatigue * 2 + randomValue(-25, 25);
}

function showRace(horses) {
  app.innerHTML = `<p class="eyebrow">RACE PRESENTATION</p><h1 id="game-title">Greenfield Beginner Cup</h1><p class="race-info">Turf · 1600m · Field size: 8</p><div class="race-lanes">${horses.map(function (horse, index) { return `<div class="race-lane"><span>${index + 1}. ${escapeHtml(horse.name)}</span><i class="runner" style="--lane-order:${index}"></i></div>`; }).join("")}</div><p class="message">The race is underway...</p>`;
}

function finishRace(horses) {
  const g = currentGame;
  const position = horses.findIndex(function (horse) { return horse.player; }) + 1;
  const prize = prizeTable[position - 1];
  g.money -= 5000;
  g.money += prize;
  g.races += 1;
  if (position === 1) g.wins += 1;
  g.prizeMoney += prize;
  if (g.bestFinish === null || position < g.bestFinish) g.bestFinish = position;
  g.totalFinishPositions += position;
  g.raceHistory.push({ week: g.week, raceName: "Greenfield Beginner Cup", finishPosition: position, prize: prize, entryFee: 5000, fieldSize: 8 });
  g.raceHistory = g.raceHistory.slice(-20);
  g.fatigue = clamp(g.fatigue + randomValue(10, 20), 0, 100);
  g.week += 1;
  const firstVictory = position === 1 && !g.firstVictoryCelebrated;
  if (firstVictory) g.firstVictoryCelebrated = true;
  g.latestMessage = firstVictory ? `Congratulations! First Victory! ${g.horseName} won at Greenfield Beginner Cup and earned ${prize}.` : `You finished ${ordinal(position)} and earned ${prize}.`;
  saveGame("Autosaved.");
  actionLocked = false;
  app.innerHTML = `<p class="eyebrow">RACE RESULTS</p><h1 id="game-title">Greenfield Beginner Cup</h1><p class="message">${escapeHtml(g.latestMessage)} Week ${g.week} begins. Money: ${g.money}</p><ol class="results">${horses.map(function (horse, index) { return `<li class="${horse.player ? "player-result" : ""}"><span>${ordinal(index + 1)}</span><strong>${escapeHtml(horse.name)}</strong>${horse.player ? " <small>(You)</small>" : ""}</li>`; }).join("")}</ol><button id="results-back" class="primary-button" type="button">Return to Stable</button>`;
  document.getElementById("results-back").addEventListener("click", function () { showStable(g.latestMessage); });
}

function ordinal(number) {
  if (number === 1) return "1st";
  if (number === 2) return "2nd";
  if (number === 3) return "3rd";
  return `${number}th`;
}

function performAction(action) {
  if (actionLocked || !currentGame) return;
  if (action !== "rest" && currentGame.fatigue >= 90) { showStable("Your horse is too tired to train. Let the horse rest."); return; }
  actionLocked = true;
  const g = currentGame;
  let message;
  if (action === "speed") { const increase = randomValue(1, 3); g.speed += increase; g.fatigue += randomValue(8, 12); g.condition -= randomValue(0, 3); g.trainingCount += 1; message = `Speed training completed. Speed increased by ${increase}.`; }
  if (action === "stamina") { const increase = randomValue(1, 3); g.stamina += increase; g.fatigue += randomValue(7, 11); g.condition -= randomValue(0, 2); g.trainingCount += 1; message = `Stamina training completed. Stamina increased by ${increase}.`; }
  if (action === "power") { const increase = randomValue(1, 3); g.power += increase; g.fatigue += randomValue(10, 14); g.condition -= randomValue(1, 4); g.trainingCount += 1; message = `Power training completed. Power increased by ${increase}.`; }
  if (action === "rest") { g.fatigue -= randomValue(18, 28); g.condition += randomValue(8, 15); message = "Your horse rested and recovered."; }
  g.speed = clamp(g.speed, 1, 100); g.stamina = clamp(g.stamina, 1, 100); g.power = clamp(g.power, 1, 100); g.spirit = clamp(g.spirit, 1, 100); g.condition = clamp(g.condition, 1, 100); g.fatigue = clamp(g.fatigue, 0, 100); g.week += 1; g.latestMessage = `${message} Week ${g.week} begins. Fatigue: ${g.fatigue}.`; saveGame("Autosaved."); showStable(g.latestMessage); window.setTimeout(function () { actionLocked = false; }, 250);
}

function escapeHtml(value) { return value.replace(/[&<>'"]/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]; }); }

showTitle();
