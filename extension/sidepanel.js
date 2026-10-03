import {
  SERVERS,
  SignedOut,
  callTool,
  getServer,
  setServer,
  signIn,
  signOut,
  signedIn,
} from "./client.js";

const $ = (id) => document.getElementById(id);
let topic = "";
let busy = false;
/** This conversation so far, so Bee can follow on. Cleared when the topic changes. */
let history = [];

/** Bee writes light markdown; the panel shows it as calm plain text. */
const plain = (text) => text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

async function render() {
  const inside = await signedIn();
  $("welcome").hidden = inside;
  $("main").hidden = !inside;
  $("signout").hidden = !inside;
  if (inside) {
    loadToday();
    await takePendingAsk();
  }
}

function handle(err, target) {
  if (err instanceof SignedOut) return render();
  if (target) target.textContent = err.message || "Something went wrong.";
}

async function loadToday() {
  const box = $("today");
  box.textContent = "Loading your day…";
  try {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { text } = await callTool("get_today", { date });
    box.classList.remove("muted");
    box.textContent = text;
  } catch (err) {
    handle(err, box);
  }
}

async function loadLooks() {
  const list = $("looks");
  list.replaceChildren(el("div", "card muted", "Loading looks…"));
  try {
    const { data, text } = await callTool("list_looks", {
      saved_only: $("saved-only").checked,
      limit: 20,
    });
    const looks = data?.looks ?? [];
    if (!looks.length) return list.replaceChildren(el("div", "card muted", text));
    list.replaceChildren(
      ...looks.map((l) => {
        const card = el("div", "card");
        card.append(el("h3", null, l.title));
        if (l.occasion) card.append(el("div", "meta", l.occasion + (l.saved ? " · saved" : "")));
        if (l.formula.length) card.append(el("div", null, `\n${l.formula.join("\n")}`));
        if (l.palette.length) card.append(el("div", "meta", `\n${l.palette.join(" · ")}`));
        return card;
      }),
    );
  } catch (err) {
    handle(err, list.firstChild);
  }
}

function showTab(name) {
  for (const b of document.querySelectorAll(".segmented button")) {
    b.setAttribute("aria-selected", String(b.dataset.tab === name));
  }
  for (const t of ["today", "bee", "looks"]) $(`tab-${t}`).hidden = t !== name;
  if (name === "looks") loadLooks();
  if (name === "bee") $("message").focus();
}

async function ask(message) {
  if (busy || !message.trim()) return;
  busy = true;
  const thread = $("thread");
  thread.append(el("div", "bubble me", message));
  const wait = el("div", "bubble bee wait", "Bee is thinking…");
  thread.append(wait);
  wait.scrollIntoView({ block: "end" });
  try {
    const args = { message, history: history.slice(-12) };
    if (topic) args.topic = topic;
    const { text } = await callTool("ask_bee", args);
    wait.classList.remove("wait");
    wait.textContent = plain(text);
    history.push(
      { role: "user", content: message },
      { role: "assistant", content: text.slice(0, 2000) },
    );
  } catch (err) {
    wait.classList.remove("wait");
    handle(err, wait);
  } finally {
    busy = false;
    wait.scrollIntoView({ block: "end" });
  }
}

/** A question sent from the right-click menu on a shop or calendar page. */
async function takePendingAsk() {
  const { pendingAsk } = await chrome.storage.session.get("pendingAsk");
  if (!pendingAsk || Date.now() - pendingAsk.at > 5 * 60_000) return;
  await chrome.storage.session.remove("pendingAsk");
  let host = "";
  try {
    host = new URL(pendingAsk.pageUrl).hostname.replace(/^www\./, "");
  } catch {}
  const message =
    pendingAsk.kind === "occasion"
      ? `What should I wear to this? "${pendingAsk.text}"`
      : `I'm looking at ${pendingAsk.text ? `"${pendingAsk.text}"` : `"${pendingAsk.title}"`}${host ? ` on ${host}` : ""}. Would this work for me, and what would I wear it with?`;
  topic = "";
  history = [];
  syncTopics();
  showTab("bee");
  await ask(message);
}

function syncTopics() {
  for (const b of document.querySelectorAll("#topics button")) {
    b.setAttribute("aria-pressed", String(b.dataset.topic === topic));
  }
  $("message").placeholder = topic ? "Talk it through with Bee…" : "Ask Bee what to wear…";
}

// Wiring
$("signin").addEventListener("click", async () => {
  $("signin").disabled = true;
  $("signin-note").textContent = "";
  try {
    await signIn();
    await render();
  } catch (err) {
    const msg = String(err?.message ?? "");
    $("signin-note").textContent =
      msg === "access_denied" || /did not approve|canceled|closed/i.test(msg)
        ? "Sign-in was cancelled."
        : "We couldn't sign you in. Try again.";
  } finally {
    $("signin").disabled = false;
  }
});
$("signout").addEventListener("click", async () => {
  await signOut();
  $("thread").replaceChildren();
  history = [];
  render();
});
for (const b of document.querySelectorAll(".segmented button")) {
  b.addEventListener("click", () => showTab(b.dataset.tab));
}
for (const b of document.querySelectorAll("#topics button")) {
  b.addEventListener("click", () => {
    if (topic !== b.dataset.topic) history = [];
    topic = b.dataset.topic;
    syncTopics();
  });
}
$("ask").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = $("message").value.trim();
  $("message").value = "";
  ask(message);
});
$("message").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("ask").requestSubmit();
  }
});
$("saved-only").addEventListener("change", loadLooks);
chrome.storage.session.onChanged.addListener((changes) => {
  if (changes.pendingAsk?.newValue) takePendingAsk();
});

(async () => {
  const select = $("server");
  const current = await getServer();
  for (const [value, label] of Object.entries(SERVERS)) {
    const opt = el("option", null, label);
    opt.value = value;
    opt.selected = value === current;
    select.append(opt);
  }
  select.addEventListener("change", () => setServer(select.value).then(render));
  syncTopics();
  render();
})();
