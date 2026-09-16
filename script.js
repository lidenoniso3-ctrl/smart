/* ============================================================
   نصّي — أداة استخراج النص العربي وضغط الصور
   ============================================================ */

let selectedFile = null;
let selectedMode = null;
let compressedBlob = null;
let extractedTextContent = '';

/* ====== عناصر DOM ====== */
const $ = (id) => document.getElementById(id);

const dropZone = $('dropZone');
const fileInput = $('fileInput');
const previewContainer = $('previewContainer');
const imagePreview = $('imagePreview');
const removeBtn = $('removeBtn');
const processBtn = $('processBtn');
const resultsSection = $('resultsSection');
const ocrResult = $('ocrResult');
const compressResult = $('compressResult');
const extractedText = $('extractedText');
const copyBtn = $('copyBtn');
const downloadTxtBtn = $('downloadTxtBtn');
const downloadDocxBtn = $('downloadDocxBtn');
const downloadPdfBtn = $('downloadPdfBtn');
const downloadExcelBtn = $('downloadExcelBtn');
const downloadBtn = $('downloadBtn');
const downloadOriginalBtn = $('downloadOriginalBtn');
const progressBar = $('progressBar');
const progressFill = $('progressFill');
const progressText = $('progressText');
const progressPercent = $('progressPercent');
const originalSizeEl = $('originalSize');
const compressedSizeEl = $('compressedSize');
const originalPreview = $('originalPreview');
const compressedPreview = $('compressedPreview');
const ocrOptions = $('ocrOptions');
const compressOptions = $('compressOptions');
const targetSizeInput = $('targetSize');
const platformSelect = $('platformSelect');
const outputFormat = $('outputFormat');
const languageSelect = $('languageSelect');
const preserveLayout = $('preserveLayout');
const enhanceImage = $('enhanceImage');
const ocrMode = $('ocrMode');
const themeToggle = $('themeToggle');

/* ====== الوضع الليلي ====== */
const savedTheme = localStorage.getItem('nassi-theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
    localStorage.setItem('nassi-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
    localStorage.setItem('nassi-theme', 'dark');
  }
});

/* ====== 1. رفع الملف ====== */
dropZone.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover'].forEach(ev => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(ev => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
});

dropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('⚠️ يرجى اختيار صورة صالحة', 'error');
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    previewContainer.classList.remove('hidden');
    processBtn.disabled = false;
    resultsSection.classList.add('hidden');
    compressedBlob = null;
    showToast('✅ تم رفع الصورة بنجاح', 'success');
  };
  reader.readAsDataURL(file);
}

/* ====== زر الإزالة ====== */
removeBtn.addEventListener('click', () => {
  selectedFile = null;
  selectedMode = null;
  compressedBlob = null;
  extractedTextContent = '';
  fileInput.value = '';
  previewContainer.classList.add('hidden');
  resultsSection.classList.add('hidden');
  processBtn.disabled = true;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  ocrOptions.classList.add('hidden');
  compressOptions.classList.add('hidden');
});

/* ====== 2. اختيار الوضع ====== */
document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedMode = card.dataset.mode;
    compressOptions.classList.toggle('hidden', selectedMode !== 'compress');
    ocrOptions.classList.toggle('hidden', selectedMode !== 'ocr');

    // تمرير سلس للأسفل
    setTimeout(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });
});

platformSelect.addEventListener('change', () => {
  if (platformSelect.value !== 'custom') {
    targetSizeInput.value = platformSelect.value;
  }
});

/* ====== 3. زر المعالجة ====== */
processBtn.addEventListener('click', async () => {
  if (!selectedFile || !selectedMode) return;

  resultsSection.classList.remove('hidden');
  ocrResult.classList.add('hidden');
  compressResult.classList.add('hidden');
  progressBar.classList.remove('hidden');
  setProgress(0, 'جاري بدء المعالجة...');

  // تمرير إلى النتائج
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  try {
    if (selectedMode === 'ocr') {
      await runOCR();
    } else {
      await runCompression();
    }
  } catch (err) {
    console.error(err);
    setProgress(0, 'حدث خطأ: ' + err.message);
    showToast('❌ ' + err.message, 'error');
  }
});

/* ====== دالة تحديث التقدم ====== */
function setProgress(percent, text) {
  progressFill.style.width = percent + '%';
  progressPercent.textContent = Math.round(percent) + '%';
  if (text) progressText.textContent = text;
}

/* ====== 4. تحسين الصورة ====== */
async function preprocessImage(file) {
  if (!enhanceImage.checked) return file;

  setProgress(10, 'تحسين جودة الصورة...');

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let min = 255, max = 0;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
        if (gray < min) min = gray;
        if (gray > max) max = gray;
      }

      const range = max - min || 1;
      for (let i = 0; i < data.length; i += 4) {
        const stretched = ((data[i] - min) / range) * 255;
        data[i] = data[i + 1] = data[i + 2] = stretched > 128 ? 255 : 0;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(new File([blob], file.name, { type: 'image/png' }));
      }, 'image/png');
    };
    img.src = url;
  });
}

/* ====== 5. OCR ====== */
async function runOCR() {
  const lang = languageSelect.value;
  const keepLayout = preserveLayout.checked;

  let processedFile = selectedFile;
  try {
    processedFile = await preprocessImage(selectedFile);
  } catch (e) {
    console.warn('تعذر تحسين الصورة، سيتم المتابعة بالأصلية', e);
  }

  setProgress(20, 'تحميل نموذج اللغة العربية...');

  const worker = await Tesseract.createWorker(lang, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        setProgress(20 + m.progress * 70, `التعرف على النص... ${Math.round(m.progress * 100)}%`);
      } else if (m.status === 'loading language traineddata') {
        setProgress(25, 'تحميل بيانات اللغة العربية...');
      }
    }
  });

  const psmMap = { auto: 3, document: 6, sparse: 11 };
  const psm = psmMap[ocrMode.value] || 3;

  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: keepLayout ? '1' : '0',
    user_defined_dpi: '300'
  });

  setProgress(92, 'تحليل الصورة...');

  const { data: { text } } = await worker.recognize(processedFile);
  await worker.terminate();

  setProgress(100, 'اكتملت المعالجة!');

  extractedTextContent = keepLayout ? formatTableText(text) : text;

  setTimeout(() => {
    progressBar.classList.add('hidden');
    ocrResult.classList.remove('hidden');
    extractedText.value = extractedTextContent;
    showToast('✅ تم استخراج النص بنجاح', 'success');
  }, 500);
}

function formatTableText(text) {
  return text.split('\n').map(line => {
    const cols = line.split(/\s{2,}/).filter(Boolean);
    return cols.length > 1 ? '| ' + cols.join(' | ') + ' |' : line;
  }).join('\n');
}

/* ====== 6. ضغط الصورة ====== */
async function runCompression() {
  const targetKB = parseInt(targetSizeInput.value, 10) || 450;

  setProgress(30, 'جاري ضغط الصورة...');

  const originalSizeKB = (selectedFile.size / 1024).toFixed(1);

  const options = {
    maxSizeMB: targetKB / 1024,
    maxWidthOrHeight: 2480,
    useWebWorker: true,
    initialQuality: 0.9,
    fileType: outputFormat.value,
    exifOrientation: true,
    onProgress: (p) => {
      setProgress(30 + p * 0.6, `جاري الضغط... ${p}%`);
    }
  };

  try {
    const compressedFile = await imageCompression(selectedFile, options);
    compressedBlob = compressedFile;
    const compressedSizeKB = (compressedFile.size / 1024).toFixed(1);

    setProgress(100, 'اكتمل الضغط!');

    setTimeout(() => {
      progressBar.classList.add('hidden');
      compressResult.classList.remove('hidden');
      originalSizeEl.textContent = originalSizeKB + ' KB';
      compressedSizeEl.textContent = compressedSizeKB + ' KB';
      originalPreview.src = URL.createObjectURL(selectedFile);
      compressedPreview.src = URL.createObjectURL(compressedFile);
      showToast(`✅ تم الضغط من ${originalSizeKB}KB إلى ${compressedSizeKB}KB`, 'success');
    }, 500);
  } catch (err) {
    console.error('خطأ في الضغط:', err);
    progressText.textContent = 'تعذر ضغط الصورة. جرب حجمًا أكبر.';
    showToast('❌ تعذر ضغط الصورة', 'error');
  }
}

/* ====== 7. دوال التحميل ====== */
function downloadAsTxt() {
  if (!extractedTextContent.trim()) return showToast('⚠️ لا يوجد نص للتحميل', 'error');
  const blob = new Blob(['\uFEFF' + extractedTextContent], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `nassi-text-${Date.now()}.txt`);
  showToast('✅ تم تحميل ملف TXT', 'success');
}

function downloadAsDocx() {
  if (!extractedTextContent.trim()) return showToast('⚠️ لا يوجد نص للتحميل', 'error');

  const htmlContent = extractedTextContent.split('\n').map(line => {
    if (line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim());
      return `<tr>${cells.map(c => `<td>${escapeHtml(c.trim())}</td>`).join('')}</tr>`;
    }
    return `<p>${escapeHtml(line) || '&nbsp;'}</p>`;
  }).join('\n');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><title>النص المستخرج</title>
    <style>
      body { font-family:'Arial',sans-serif; direction:rtl; text-align:right; font-size:14pt; line-height:1.8; }
      table { border-collapse:collapse; width:100%; margin:1rem 0; }
      td, th { border:1px solid #999; padding:6px 10px; text-align:right; }
      p { margin:4px 0; }
    </style></head>
    <body>${htmlContent}</body></html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' });
  triggerDownload(blob, `nassi-text-${Date.now()}.doc`);
  showToast('✅ تم تحميل ملف Word', 'success');
}

function downloadAsPdf() {
  if (!extractedTextContent.trim()) return showToast('⚠️ لا يوجد نص للتحميل', 'error');

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>النص المستخرج — نصّي</title>
    <style>
      @page { margin: 2cm; size: A4; }
      body { font-family:'Arial',sans-serif; direction:rtl; text-align:right; font-size:13pt; line-height:1.9; padding:1rem; }
      pre { white-space:pre-wrap; word-wrap:break-word; font-family:inherit; background:#f8f9fa; padding:1.25rem; border-radius:10px; border:1px solid #e2e8f0; }
      h1 { color:#6366f1; font-size:20pt; margin-bottom:1rem; }
      @media print { .no-print { display:none; } }
    </style></head>
    <body>
      <h1>📄 النص المستخرج — نصّي</h1>
      <pre>${escapeHtml(extractedTextContent)}</pre>
      <button class="no-print" onclick="window.print()" style="padding:12px 24px;margin-top:1rem;background:#6366f1;color:white;border:none;border-radius:10px;cursor:pointer;font-size:14pt;font-family:inherit">🖨️ احفظ كـ PDF</button>
    </body></html>`);
  win.document.close();
  win.onload = () => setTimeout(() => win.print(), 400);
  showToast('📄 اختر "حفظ كـ PDF" من نافذة الطباعة', 'info');
}

function downloadAsExcel() {
  if (!extractedTextContent.trim()) return showToast('⚠️ لا يوجد نص للتحميل', 'error');

  const tableLines = extractedTextContent.split('\n').filter(line => line.trim().startsWith('|'));

  let ws, wb;

  if (tableLines.length === 0) {
    const rows = extractedTextContent.split('\n').map(line => [line]);
    ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 80 }];
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'النص المستخرج');
  } else {
    const data = tableLines.map(line =>
      line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
    );
    ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = data[0]?.map(() => ({ wch: 25 })) || [];
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الجدول المستخرج');
  }

  XLSX.writeFile(wb, `nassi-table-${Date.now()}.xlsx`);
  showToast('✅ تم تحميل ملف Excel', 'success');
}

function downloadCompressedImage() {
  if (!compressedBlob) return showToast('⚠️ لا توجد صورة مضغوطة', 'error');
  const targetKB = parseInt(targetSizeInput.value, 10) || 450;
  const ext = outputFormat.value === 'image/webp' ? 'webp' : 'jpg';
  triggerDownload(compressedBlob, `nassi-compressed-${targetKB}kb-${Date.now()}.${ext}`);
  showToast('✅ تم تحميل الصورة المضغوطة', 'success');
}

function downloadOriginalImage() {
  if (!selectedFile) return;
  const url = URL.createObjectURL(selectedFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nassi-original-${selectedFile.name}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('✅ تم تحميل الصورة الأصلية', 'success');
}

/* ====== 8. دوال مساعدة ====== */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  const colors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  };

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type] || colors.success};
    color: white;
    padding: 14px 26px;
    border-radius: 14px;
    z-index: 9999;
    font-family: 'Cairo', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    box-shadow: 0 12px 32px rgba(0,0,0,.25);
    animation: toastIn 0.35s ease;
    max-width: 90vw;
    text-align: center;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ====== 9. ربط الأزرار ====== */
copyBtn.addEventListener('click', async () => {
  if (!extractedTextContent.trim()) return showToast('⚠️ لا يوجد نص للنسخ', 'error');
  try {
    await navigator.clipboard.writeText(extractedTextContent);
    showToast('✅ تم نسخ النص', 'success');
  } catch {
    extractedText.select();
    document.execCommand('copy');
    showToast('✅ تم نسخ النص', 'success');
  }
  const originalHTML = copyBtn.innerHTML;
  copyBtn.innerHTML = '✓ تم';
  setTimeout(() => copyBtn.innerHTML = originalHTML, 1800);
});

downloadTxtBtn.addEventListener('click', downloadAsTxt);
downloadDocxBtn.addEventListener('click', downloadAsDocx);
downloadPdfBtn.addEventListener('click', downloadAsPdf);
downloadExcelBtn.addEventListener('click', downloadAsExcel);
downloadBtn.addEventListener('click', downloadCompressedImage);
downloadOriginalBtn.addEventListener('click', downloadOriginalImage);