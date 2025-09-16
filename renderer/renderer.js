const pdfjsLib = window.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = '../node_modules/pdfjs-dist/build/pdf.worker.min.js';

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

uploadBtn.addEventListener("click", async () => {
  const fileBuffer = await window.electronAPI.openFile();
  if (!fileBuffer) return;

  pdfContainer.innerHTML = "";
  wordList.innerHTML = "";

  const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
  const pdf = await loadingTask.promise;

  const allWords = new Set(); // store unique words

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    // Render page on canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    pdfContainer.appendChild(canvas);
    await page.render({ canvasContext: context, viewport }).promise;

    // Extract text
    const textContent = await page.getTextContent();
    textContent.items.forEach(item => {
      const word = item.str.trim();
      if (word && !allWords.has(word)) {
        allWords.add(word);

        // Add to the word list panel
        const wordDiv = document.createElement("div");
        wordDiv.textContent = word;
        wordDiv.style.cursor = "pointer";
        wordDiv.style.padding = "2px 4px";

        // Click → show popup
        wordDiv.addEventListener("click", async (e) => {
          const results = await window.electronAPI.lookup(word.toLowerCase());
          if (results.length > 0) {
            wordPopup.innerHTML = `<b>${results[0].word} (${results[0].pos})</b>: ${results[0].definition}`;
            wordPopup.style.left = e.pageX + 10 + "px";
            wordPopup.style.top = e.pageY + 10 + "px";
            wordPopup.style.display = "block";
          }
        });

        wordList.appendChild(wordDiv);
      }
    });
  }
});

// Hide popup if click outside
document.addEventListener("click", (e) => {
  if (!wordList.contains(e.target)) {
    wordPopup.style.display = "none";
  }
});
