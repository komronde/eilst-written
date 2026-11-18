const prompts = {
  2: [
    {
      type: "OPINION ESSAY",
      text: "Some people believe that university students should study whatever they like. Others think they should only study subjects that will be useful in the future, such as science and technology. Discuss both views and give your own opinion."
    },
    {
      type: "DISCUSSION ESSAY",
      text: "Some people think that living in a city offers more advantages, while others prefer life in the countryside. Discuss both views and give your own opinion."
    },
    {
      type: "PROBLEM & SOLUTION",
      text: "Many young people spend a large amount of their free time using smartphones. What problems can this cause, and what solutions can you suggest?"
    },
    {
      type: "ADVANTAGES & DISADVANTAGES",
      text: "More people are choosing to work from home rather than travel to an office every day. Do the advantages of this development outweigh the disadvantages?"
    }
  ],
  1: [
    {
      type: "LINE GRAPH",
      text: "The line graph shows the percentage of people who used three different methods of transport to travel to work in a city between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
    },
    {
      type: "BAR CHART",
      text: "The bar chart compares the amount of time spent on five leisure activities by adults in a particular country in 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
    },
    {
      type: "PROCESS DIAGRAM",
      text: "The diagram illustrates how recycled paper is produced. Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
    }
  ]
};

const essayInput = document.getElementById("essayInput");
const taskTabs = document.querySelectorAll(".task-tab");
const timerDisplay = document.getElementById("timerDisplay");
const timerToggle = document.getElementById("timerToggle");
const savedStatus = document.getElementById("savedStatus");
const toast = document.getElementById("toast");
const STORAGE_KEY = "writewise-ielts-writing-v1";

let activeTask = "2";
let promptIndex = { 1: 0, 2: 0 };
let remainingSeconds = 40 * 60;
let timerInterval = null;
let toastTimeout = null;

function getWordCount(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function getParagraphs(text) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function updateWritingStats() {
  const text = essayInput.value;
  const count = getWordCount(text);
  const paragraphs = getParagraphs(text).length;
  const minimum = activeTask === "2" ? 250 : 150;

  document.getElementById("wordCount").textContent = count;
  document.getElementById("paragraphCount").textContent = `${paragraphs} paragraf`;
  document.getElementById("wordGuidance").textContent = count >= minimum
    ? `Maqsad bajarildi (${minimum}+)`
    : `Kamida ${minimum} so‘z`;
  document.getElementById("wordGuidance").classList.toggle("goal-reached", count >= minimum);
}

function saveDraft() {
  const draft = { essay: essayInput.value, task: activeTask, promptIndex };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    savedStatus.innerHTML = '<span class="status-dot"></span> Avtomatik saqlandi';
  } catch (error) {
    savedStatus.innerHTML = '<span class="status-dot"></span> Saqlash imkonsiz';
  }
}

function restoreDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return;
    if (typeof saved.essay === "string") essayInput.value = saved.essay;
    if (saved.task === "1" || saved.task === "2") activeTask = saved.task;
    if (saved.promptIndex && typeof saved.promptIndex === "object") {
      [1, 2].forEach((task) => {
        const index = Number(saved.promptIndex[task]);
        if (Number.isInteger(index) && index >= 0 && index < prompts[task].length) {
          promptIndex[task] = index;
        }
      });
    }
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
  setActiveTask(activeTask, false);
  updateWritingStats();
}

function setActiveTask(task, resetTimer = true) {
  activeTask = task;
  taskTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.task === task));
  const prompt = prompts[task][promptIndex[task]];
  document.getElementById("promptType").textContent = prompt.type;
  document.getElementById("promptText").textContent = prompt.text;
  document.getElementById("recommendedTime").textContent = task === "2" ? "40 daqiqa" : "20 daqiqa";
  document.getElementById("wordGuidance").textContent = `Kamida ${task === "2" ? 250 : 150} so‘z`;
  if (resetTimer) {
    pauseTimer();
    remainingSeconds = (task === "2" ? 40 : 20) * 60;
    renderTimer();
  }
  updateWritingStats();
  saveDraft();
}

function renderTimer() {
  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerToggle.textContent = "▶";
  timerToggle.setAttribute("aria-label", "Taymerni boshlash");
}

function toggleTimer() {
  if (timerInterval) {
    pauseTimer();
    return;
  }
  if (remainingSeconds === 0) remainingSeconds = (activeTask === "2" ? 40 : 20) * 60;
  timerToggle.textContent = "Ⅱ";
  timerToggle.setAttribute("aria-label", "Taymerni pauza qilish");
  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    renderTimer();
    if (remainingSeconds <= 0) {
      pauseTimer();
      showToast("Vaqt tugadi. Javobingizni tekshirib chiqing!");
    }
  }, 1000);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3200);
}

function band(value) {
  return Math.max(1, Math.min(9, Math.round(value * 2) / 2));
}

function updateCriterion(name, value) {
  document.getElementById(`${name}Score`).textContent = value.toFixed(1);
  document.getElementById(`${name}Bar`).style.width = `${(value / 9) * 100}%`;
}

function addFeedback(listId, messages) {
  const list = document.getElementById(listId);
  list.replaceChildren();
  messages.forEach((message) => {
    const item = document.createElement("li");
    item.textContent = message;
    list.appendChild(item);
  });
}

function analyzeEssay() {
  const text = essayInput.value.trim();
  const words = getWordCount(text);
  if (words < 20) {
    showToast("Tahlil qilish uchun avval kamida 20 ta so‘z yozing.");
    essayInput.focus();
    return;
  }

  const paragraphs = getParagraphs(text);
  const sentences = text.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const transitions = [
    "however", "moreover", "furthermore", "therefore", "because", "although",
    "firstly", "secondly", "finally", "for example", "for instance", "in addition",
    "on the other hand", "in conclusion", "as a result", "whereas"
  ];
  const transitionCount = transitions.reduce((count, phrase) => {
    const matches = lower.match(new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"));
    return count + (matches ? matches.length : 0);
  }, 0);
  const uniqueWords = new Set(lower.match(/\b[a-z']+\b/g) || []);
  const englishWords = lower.match(/\b[a-z']+\b/g) || [];
  const lexicalRatio = englishWords.length ? uniqueWords.size / englishWords.length : 0;
  const hasConclusion = /\b(in conclusion|to conclude|overall|in summary)\b/i.test(text);
  const hasPosition = /\b(i (think|believe|agree|disagree)|in my opinion|i would argue|i strongly believe)\b/i.test(text);
  const hasExamples = /\b(for example|for instance|such as)\b/i.test(text);
  const averageSentenceLength = sentences.length ? words / sentences.length : words;
  const target = activeTask === "2" ? 250 : 150;
  const wordRatio = words / target;
  const taskScore = band(4 + Math.min(wordRatio, 1) * 2.2 + (paragraphs.length >= 3 ? 0.6 : 0) + (hasPosition ? 0.5 : 0) + (hasConclusion ? 0.4 : 0));
  const coherenceScore = band(4 + Math.min(paragraphs.length, 5) * 0.45 + Math.min(transitionCount, 5) * 0.25 + (hasConclusion ? 0.35 : 0));
  const vocabularyScore = band(4 + Math.max(0, Math.min(lexicalRatio - 0.25, 0.3)) * 8 + (hasExamples ? 0.3 : 0) + (words >= target ? 0.4 : 0));
  const grammarScore = band(4 + (sentences.length >= 4 ? 0.6 : 0) + (averageSentenceLength >= 8 && averageSentenceLength <= 28 ? 0.6 : 0) + (/[.!?]$/.test(text) ? 0.3 : 0) + (words >= target ? 0.4 : 0));
  const overall = band((taskScore + coherenceScore + vocabularyScore + grammarScore) / 4);

  document.getElementById("overallScore").textContent = overall.toFixed(1);
  document.getElementById("scoreCircle").style.background = `conic-gradient(var(--green) ${(overall / 9) * 360}deg, #e8edf2 0deg)`;
  document.getElementById("scoreSummary").textContent = overall >= 7 ? "Ajoyib natija!" : overall >= 5.5 ? "Yaxshi boshlanish!" : "Yaxshi mashq — davom eting!";
  document.getElementById("scoreDescription").textContent = `${words} so‘z tahlil qilindi. Har bir mezon bo‘yicha tavsiyalarni ko‘rib chiqing.`;
  updateCriterion("task", taskScore);
  updateCriterion("coherence", coherenceScore);
  updateCriterion("vocabulary", vocabularyScore);
  updateCriterion("grammar", grammarScore);

  const strengths = [];
  const improvements = [];
  if (paragraphs.length >= 3) strengths.push("Paragraflarga ajratilgani matn tuzilishini o‘qishni osonlashtiradi.");
  else improvements.push("Javobni alohida kirish, asosiy qism va xulosa paragraflariga ajrating.");
  if (transitionCount >= 2) strengths.push("Bog‘lovchi iboralar fikrlar orasidagi aloqani ko‘rsatmoqda.");
  else improvements.push("Fikrlar orasidagi aloqani ko‘rsatish uchun however, therefore yoki moreover kabi iboralarni ishlating.");
  if (words >= target) strengths.push(`So‘z soni ${target} so‘zlik minimal talabga yetdi.`);
  else improvements.push(`Javob ${target} so‘zdan kam. Fikrlarni dalil va izohlar bilan kengaytiring.`);
  if (hasPosition) strengths.push("Shaxsiy pozitsiyangiz aniq ifodalangan.");
  else if (activeTask === "2") improvements.push("Task 2 javobында байр сууриа тодорхой илэрхийлж, асуултын бүх хэсэгт хариулаарай.");
  if (hasConclusion) strengths.push("Дүгнэлт хийх хэсэг байна.");
  else improvements.push("Төгсгөлд гол санаагаа нэгтгэсэн товч дүгнэлт нэмээрэй.");
  if (sentences.length >= 4 && averageSentenceLength <= 28) strengths.push("Өгүүлбэрийн урт уншихад тохиромжтой байна.");
  else improvements.push("Өгүүлбэрийн бүтцээ төрөлжүүлж, нэг өгүүлбэрт хэт олон санаа оруулахаас зайлсхий.");
  if (strengths.length === 0) strengths.push("Та бичиж эхэлсэн нь хамгийн чухал эхний алхам.");
  if (improvements.length === 0) improvements.push("Дараагийн алхамд илүү нарийн жишээ, академик үг хэллэг туршиж үзээрэй.");
  addFeedback("strengthList", strengths.slice(0, 3));
  addFeedback("improvementList", improvements.slice(0, 3));
  showToast("Таҳлил тайёр! Natijalar yangilandi.");
}

taskTabs.forEach((tab) => tab.addEventListener("click", () => setActiveTask(tab.dataset.task)));
essayInput.addEventListener("input", () => {
  updateWritingStats();
  saveDraft();
});
document.getElementById("newPromptButton").addEventListener("click", () => {
  promptIndex[activeTask] = (promptIndex[activeTask] + 1) % prompts[activeTask].length;
  setActiveTask(activeTask, false);
  showToast("Yangi topshiriq tanlandi.");
});
document.getElementById("analyzeButton").addEventListener("click", analyzeEssay);
document.getElementById("clearButton").addEventListener("click", () => {
  if (!essayInput.value.trim()) {
    showToast("Muharrir allaqachon bo‘sh.");
    return;
  }
  essayInput.value = "";
  updateWritingStats();
  saveDraft();
  showToast("Javob tozalandi.");
});
timerToggle.addEventListener("click", toggleTimer);

restoreDraft();
renderTimer();