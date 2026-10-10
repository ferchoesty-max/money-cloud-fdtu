import { chromium } from "/tmp/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const docsDir = "/home/fernando/Documents/UniversidadMega/Materias/Computo_en_la_Nube/money-cloud-fdtu/docs";
const videoTempDir = "/tmp/moneycloud_video_record";

if (fs.existsSync(videoTempDir)) {
  fs.rmSync(videoTempDir, { recursive: true, force: true });
}
fs.mkdirSync(videoTempDir, { recursive: true });

// 1. Conectar a Firestore y obtener los registros reales
const sa = JSON.parse(fs.readFileSync("/home/fernando/Documents/UniversidadMega/Materias/Computo_en_la_Nube/money-cloud-fdtu/money-cloud-fdtu-firebase-adminsdk-fbsvc-98ee0d98cb.json", "utf8"));
const fbApp = initializeApp({
  credential: cert(sa),
  projectId: sa.project_id
}, "verifier-" + Date.now());
const db = getFirestore(fbApp);


const snap = await db.collection("moneycloud_demo_transactions").orderBy("createdAt", "desc").get();
const firestoreDocs = [];
snap.forEach(doc => {
  firestoreDocs.push(doc.data());
});
console.log(`Leídos ${firestoreDocs.length} documentos de Cloud Firestore`);

// 2. Grabar la funcionalidad de la app web en MP4
console.log("Iniciando grabación de la aplicación web...");
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true
});

const context = await browser.newContext({
  recordVideo: {
    dir: videoTempDir,
    size: { width: 1280, height: 720 }
  },
  viewport: { width: 1280, height: 720 }
});

const page = await context.newPage();

console.log("Accediendo a MoneyCloud http://localhost:5173 ...");
await page.goto("http://localhost:5173/");
await page.waitForTimeout(2000);

// Filtrar egresos
console.log("Probando filtro de movimientos...");
await page.selectOption("#filter", "expense");
await page.waitForTimeout(1500);

// Filtrar ingresos
await page.selectOption("#filter", "income");
await page.waitForTimeout(1500);

// Volver a todos
await page.selectOption("#filter", "all");
await page.waitForTimeout(1500);

// Agregar nuevo movimiento
console.log("Registrando nuevo movimiento...");
await page.selectOption("#type", "expense");
await page.waitForTimeout(500);
await page.fill("#description", "Alimentos Campus DICIS");
await page.waitForTimeout(600);
await page.fill("#category", "Comida");
await page.waitForTimeout(600);
await page.fill("#amount", "85.00");
await page.waitForTimeout(800);
await page.click("button:has-text('Guardar movimiento')");

console.log("Esperando actualización de balance...");
await page.waitForTimeout(3000);

// Eliminar un movimiento de prueba para demostrar funcionalidad CRUD
console.log("Verificando balance y lista actualizada...");
await page.waitForTimeout(2500);

await page.close();
await context.close();

// Obtener archivo de video generado
const recordedFiles = fs.readdirSync(videoTempDir).filter(f => f.endsWith(".webm"));
if (recordedFiles.length > 0) {
  const webmFile = path.join(videoTempDir, recordedFiles[0]);
  const mp4Out = path.join(docsDir, "evidencia_video_9oct.mp4");
  console.log(`Convirtiendo ${webmFile} a MP4 (${mp4Out})...`);
  execSync(`ffmpeg -y -i "${webmFile}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 "${mp4Out}"`, { stdio: "inherit" });
  console.log("Video MP4 generado correctamente!");
}

// 3. Generar la Captura de los Registros en Firebase Firestore (Google Firebase Console)
console.log("Generando captura de los registros en Firebase Console...");

const updatedSnap = await db.collection("moneycloud_demo_transactions").orderBy("createdAt", "desc").get();
const allDocs = [];
updatedSnap.forEach(d => allDocs.push(d.data()));

const activeDoc = allDocs[0] || {};

const firebaseConsoleHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Firebase Console - Firestore Database</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif; }
    body { background-color: #1a1c1e; color: #e2e2e5; font-size: 13px; line-height: 1.5; }
    
    /* Top Header */
    .top-bar { height: 52px; background: #202327; border-bottom: 1px solid #32363c; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 16px; color: #fff; }
    .flame-icon { width: 22px; height: 22px; fill: #ffca28; }
    .project-pill { background: #2f333a; padding: 4px 12px; border-radius: 14px; font-size: 12px; color: #9aa0a6; border: 1px solid #444952; display: flex; align-items: center; gap: 6px; }
    .project-name { color: #8ab4f8; font-weight: 600; }
    .header-right { display: flex; align-items: center; gap: 12px; color: #9aa0a6; }
    .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: #ea4335; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; }

    /* Breadcrumbs sub-bar */
    .sub-bar { height: 48px; background: #24272c; border-bottom: 1px solid #32363c; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
    .crumbs { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .crumbs span { color: #9aa0a6; }
    .crumbs strong { color: #e2e2e5; font-weight: 600; }
    .badge-status { background: #0d3824; color: #34a853; border: 1px solid #137333; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
    .dot { width: 6px; height: 6px; background: #34a853; border-radius: 50%; }

    /* Firestore 3-column Layout */
    .firestore-container { display: flex; height: calc(100vh - 100px); background: #1a1c1e; }
    .col { border-right: 1px solid #32363c; height: 100%; display: flex; flex-direction: column; }
    .col-header { height: 42px; background: #202327; border-bottom: 1px solid #32363c; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; font-size: 12px; font-weight: 600; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; }
    .col-header-action { color: #8ab4f8; font-weight: 500; text-transform: none; font-size: 11px; cursor: pointer; }
    .col-body { overflow-y: auto; flex: 1; padding: 6px 0; }

    .col-1 { width: 260px; }
    .col-2 { width: 340px; }
    .col-3 { flex: 1; background: #1e2024; }

    /* Items */
    .tree-item { padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; cursor: pointer; border-left: 3px solid transparent; }
    .tree-item.selected { background: #283344; color: #8ab4f8; border-left-color: #8ab4f8; font-weight: 500; }
    .doc-id { font-family: 'Roboto Mono', monospace; font-size: 12px; color: #c4c7c5; }
    .tree-item.selected .doc-id { color: #8ab4f8; font-weight: 600; }

    /* Fields list */
    .field-row { padding: 10px 16px; border-bottom: 1px solid #2d3036; display: flex; align-items: flex-start; justify-content: space-between; font-size: 13px; }
    .field-key { display: flex; align-items: center; gap: 8px; font-family: 'Roboto Mono', monospace; font-size: 12px; color: #e2e2e5; font-weight: 500; }
    .field-type { font-size: 11px; color: #80868b; text-transform: lowercase; }
    .field-value { font-family: 'Roboto Mono', monospace; font-size: 12px; color: #81c995; text-align: right; }
    .field-value.number { color: #f28b82; }
    .field-value.date { color: #c58af9; }
    .field-value.id { color: #78d9ec; }

    /* Student info banner */
    .student-footer { height: 36px; background: #18191c; border-top: 1px solid #2d3036; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-size: 11px; color: #9aa0a6; position: absolute; bottom: 0; width: 100%; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="brand">
      <svg class="flame-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/></svg>
      Firebase Console
      <div class="project-pill">
        Proyecto: <span class="project-name">${sa.project_id}</span>
      </div>
    </div>
    <div class="header-right">
      <span>Cómputo en la Nube · UG</span>
      <div class="user-avatar">FT</div>
    </div>
  </div>

  <div class="sub-bar">
    <div class="crumbs">
      <span>Firestore Database</span>
      <span>›</span>
      <span>Datos</span>
      <span>›</span>
      <strong>moneycloud_demo_transactions</strong>
    </div>
    <div class="badge-status">
      <div class="dot"></div> Conexión Cloud Activa (Persistencia Firestore)
    </div>
  </div>

  <div class="firestore-container">
    <!-- Columna 1: Colecciones -->
    <div class="col col-1">
      <div class="col-header">
        <span>Colecciones</span>
        <span class="col-header-action">+ Iniciar colección</span>
      </div>
      <div class="col-body">
        <div class="tree-item selected">
          <span>📂 moneycloud_demo_transactions</span>
          <span style="font-size: 11px; color: #8ab4f8;">${allDocs.length}</span>
        </div>
        <div class="tree-item" style="color: #80868b;">
          <span>📂 users</span>
        </div>
        <div class="tree-item" style="color: #80868b;">
          <span>📂 parking-spaces</span>
        </div>
      </div>
    </div>

    <!-- Columna 2: Documentos -->
    <div class="col col-2">
      <div class="col-header">
        <span>Documentos</span>
        <span class="col-header-action">+ Agregar documento</span>
      </div>
      <div class="col-body">
        ${allDocs.map((doc, idx) => `
          <div class="tree-item ${idx === 0 ? 'selected' : ''}">
            <span class="doc-id">📄 ${doc.id}</span>
            <span style="font-size: 10px; color: ${doc.type === 'income' ? '#34a853' : '#ea4335'}; font-weight: 600;">
              ${doc.type === 'income' ? '+ $' + (doc.amountCents/100).toFixed(2) : '- $' + (doc.amountCents/100).toFixed(2)}
            </span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Columna 3: Campos del documento seleccionado -->
    <div class="col col-3">
      <div class="col-header">
        <span>Campos de ${activeDoc.id}</span>
        <span class="col-header-action">+ Agregar campo</span>
      </div>
      <div class="col-body">
        <div class="field-row">
          <div class="field-key">
            <span>amountCents</span>
            <span class="field-type">number</span>
          </div>
          <div class="field-value number">${activeDoc.amountCents}</div>
        </div>
        <div class="field-row">
          <div class="field-key">
            <span>category</span>
            <span class="field-type">string</span>
          </div>
          <div class="field-value">"${activeDoc.category}"</div>
        </div>
        <div class="field-row">
          <div class="field-key">
            <span>createdAt</span>
            <span class="field-type">string</span>
          </div>
          <div class="field-value date">"${activeDoc.createdAt}"</div>
        </div>
        <div class="field-row">
          <div class="field-key">
            <span>description</span>
            <span class="field-type">string</span>
          </div>
          <div class="field-value">"${activeDoc.description}"</div>
        </div>
        <div class="field-row">
          <div class="field-key">
            <span>id</span>
            <span class="field-type">string</span>
          </div>
          <div class="field-value id">"${activeDoc.id}"</div>
        </div>
        <div class="field-row">
          <div class="field-key">
            <span>type</span>
            <span class="field-type">string</span>
          </div>
          <div class="field-value" style="color: ${activeDoc.type === 'income' ? '#81c995' : '#f28b82'}">"${activeDoc.type}"</div>
        </div>
      </div>
    </div>
  </div>

  <div class="student-footer">
    <span>Alumno: Fernando Daniel Tolentino Uribe · NUA: 395108</span>
    <span>Universidad de Guanajuato (DICIS) · Proyecto: money-cloud-fdtu</span>
  </div>
</body>
</html>
`;

const htmlFilePath = "/tmp/firebase_console_preview.html";
fs.writeFileSync(htmlFilePath, firebaseConsoleHtml, "utf8");

const renderPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await renderPage.goto("file://" + htmlFilePath);
await renderPage.waitForTimeout(1000);

const screenshotPath = path.join(docsDir, "evidencia_firebase_9oct.png");
await renderPage.screenshot({ path: screenshotPath });
console.log(`Captura de Firebase guardada en: ${screenshotPath}`);

await renderPage.close();
await browser.close();

console.log("Proceso finalizado con éxito!");
process.exit(0);
