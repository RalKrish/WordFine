const pdfjsLib = window.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "../node_modules/pdfjs-dist/build/pdf.worker.min.js";

const uploadBtn = document.getElementById("uploadBtn");
const pdfContainer = document.getElementById("pdfContainer");
const wordList = document.getElementById("wordList");

// Popup for word meaning
const wordPopup = document.createElement("div");
wordPopup.style.position = "absolute";
wordPopup.style.background = "rgba(255,255,200,0.95)";
wordPopup.style.border = "1px solid #333";
wordPopup.style.padding = "5px 10px";
wordPopup.style.borderRadius = "5px";
wordPopup.style.display = "none";
wordPopup.style.fontSize = "14px";
wordPopup.style.zIndex = 9999;
document.body.appendChild(wordPopup);

// Stop words to ignore
const stopWords = new Set([
  "a",
  "an",
  "the",
  "in",
  "on",
  "at",
  "of",
  "for",
  "to",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "with",
  "by",
  "from",
  "as",
]);

let wordsByPage = {}; // store words per page

uploadBtn.addEventListener("click", async () => {
  const fileBuffer = await window.electronAPI.openFile();
  if (!fileBuffer) return;

  pdfContainer.innerHTML = "";
  wordList.innerHTML = "";
  wordsByPage = {};

  const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
  const pdf = await loadingTask.promise;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    // Render PDF page
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    pdfContainer.appendChild(canvas);
    await page.render({ canvasContext: context, viewport }).promise;

    // Extract text and map to page
    const textContent = await page.getTextContent();
    textContent.items.forEach((item) => {
      const words = item.str
        .trim()
        .split(/\s+/)
        .map((w) => w.replace(/[.,!?;:()"'-]/g, "").toLowerCase())
        .filter((w) => w.length > 2 && !stopWords.has(w));

      if (!wordsByPage[pageNum]) wordsByPage[pageNum] = [];
      wordsByPage[pageNum].push(...words);
    });
  }
});

// Track last rendered page to avoid unnecessary re-render
let lastRenderedPage = 0;

pdfContainer.addEventListener("scroll", () => {
  const scrollTop = pdfContainer.scrollTop;
  const canvases = pdfContainer.querySelectorAll("canvas");

  canvases.forEach((canvas, index) => {
    const canvasTop = canvas.offsetTop;
    const canvasBottom = canvasTop + canvas.offsetHeight;

    if (scrollTop >= canvasTop && scrollTop < canvasBottom) {
      const currentPage = index + 1;
      if (currentPage !== lastRenderedPage) {
        lastRenderedPage = currentPage;
        renderWordsForPage(currentPage);
      }
    }
  });
});

function renderWordsForPage(pageNum) {
  wordList.innerHTML = ""; // clear previous words
  const words = wordsByPage[pageNum] || [];
  const uniqueWords = [...new Set(words)]; // remove duplicates

  // Sort alphabetically
  uniqueWords.sort();

  // Set CSS for columns
  wordList.style.columnCount = 5; // 3 columns
  wordList.style.columnGap = "0"; // spacing between columns

  uniqueWords.forEach((word) => {
    const wordDiv = document.createElement("div");
    wordDiv.textContent = word;
    wordDiv.style.cursor = "pointer";
    wordDiv.style.padding = "0 ";
    wordDiv.style.breakInside = "avoid"; // prevent breaking a word across columns

    wordDiv.addEventListener("click", async (e) => {
      const results = await window.electronAPI.lookup(word);
      if (results && results.length > 0) {
        const meanings = results
          .map((r, i) => `${i + 1}. ${r.definition}`)
          .join("<br>");
        wordPopup.innerHTML = `<b>${results[0].word} (${results[0].pos})</b>:<br>${meanings}`;
        wordPopup.style.left = e.pageX + -100 + "px";
        wordPopup.style.top = e.pageY + 10 + "px";
        wordPopup.style.display = "block";
      } else {
        wordPopup.innerHTML = `No definition found for "${word}"`;
        wordPopup.style.left = e.pageX + 10 + "px";
        wordPopup.style.top = e.pageY + 10 + "px";
        wordPopup.style.display = "block";
      }
    });

    wordList.appendChild(wordDiv);
  });
}

// Hide popup if clicking outside
document.addEventListener("click", (e) => {
  if (!wordList.contains(e.target)) {
    wordPopup.style.display = "none";
  }
});
