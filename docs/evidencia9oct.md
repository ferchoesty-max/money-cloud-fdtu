# Evidencia: Sesiones 1, 2 e Inicio de Docker — MoneyCloud

**Nombre:** Fernando Daniel Tolentino Uribe  
**NUA:** 395108  
**Universidad:** Universidad de Guanajuato (DICIS, Campus Irapuato-Salamanca)  
**Carrera:** Ingeniería en Sistemas Computacionales  
**Materia:** Cómputo en la Nube  
**Fecha:** 9 de Octubre de 2026  

---

## 📁 `package.json`

```json
{
  "name": "moneycloud",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev:api": "npm run dev -w @moneycloud/api",
    "dev:web": "npm run dev -w @moneycloud/web",
    "test": "npm run test -w @moneycloud/api",
    "build": "npm run build -w @moneycloud/web"
  },
  "engines": {
    "node": ">=22"
  }
}
```

---

## 📁 `.gitignore`

```gitignore
node_modules/
**/node_modules/
.env
.env.*
!.env.example
**/.env
**/.env.*
!**/.env.example
dist/
**/dist/
coverage/
.DS_Store
*.log
firebase-service-account*.json
*firebase-adminsdk*.json
*-adminsdk-*.json
```

---

## 📁 `compose.yaml`

```yaml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      STORAGE_DRIVER: memory
      CORS_ORIGIN: http://localhost:5173
    restart: unless-stopped
```

---

## 📁 `.dockerignore`

```dockerignore
**/node_modules
**/.env
**/.env.*
!**/.env.example
.git
**/dist
**/coverage
**/*service-account*.json
```

---

## 📁 `apps/web/package.json`

```json
{
  "name": "@moneycloud/web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "tailwindcss": "^4.1.0",
    "@tailwindcss/vite": "^4.1.0",
    "vite": "^6.2.0"
  }
}
```

---

## 📁 `apps/web/index.html`

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MoneyCloud | Finanzas</title>
  </head>
  <body class="bg-slate-50 text-slate-900">
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

---

## 📁 `apps/web/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

---

## 📁 `apps/web/src/style.css`

```css
@import "tailwindcss";
```

---

## 📁 `apps/web/src/main.js`

```javascript
import './style.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const element = (id) => document.getElementById(id);
const money = (cents) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
}).format(cents / 100);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

element('app').innerHTML = `
  <main class="mx-auto max-w-5xl p-5 md:p-10">
    <header class="mb-8">
      <p class="font-semibold text-teal-700">MONEYCLOUD · LABORATORIO CLOUD</p>
      <h1 class="mt-2 text-3xl font-bold">Mis finanzas</h1>
      <p class="text-slate-500">Demo académica. No introduzcas datos financieros reales.</p>
    </header>

    <div id="error" role="alert" class="mb-5 hidden rounded bg-red-100 p-3 text-red-900"></div>

    <section class="mb-8 grid gap-4 md:grid-cols-3">
      <article class="rounded-xl bg-white p-5 shadow-sm">
        <p>Ingresos</p>
        <strong id="income" class="text-2xl text-teal-700">—</strong>
      </article>
      <article class="rounded-xl bg-white p-5 shadow-sm">
        <p>Egresos</p>
        <strong id="expense" class="text-2xl text-rose-700">—</strong>
      </article>
      <article class="rounded-xl bg-slate-900 p-5 text-white">
        <p>Balance</p>
        <strong id="balance" class="text-2xl">—</strong>
      </article>
    </section>

    <section class="grid gap-6 md:grid-cols-5">
      <form id="form" class="space-y-4 rounded-xl bg-white p-5 shadow-sm md:col-span-2">
        <h2 class="text-xl font-bold">Nuevo movimiento</h2>
        <label class="block">Tipo
          <select id="type" class="mt-1 block w-full rounded border p-2">
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
          </select>
        </label>
        <label class="block">Descripción
          <input id="description" required minlength="2" maxlength="100"
            class="mt-1 block w-full rounded border p-2" placeholder="Ej. Transporte" />
        </label>
        <label class="block">Categoría
          <input id="category" required minlength="2" maxlength="40"
            class="mt-1 block w-full rounded border p-2" placeholder="Ej. Escuela" />
        </label>
        <label class="block">Monto (MXN)
          <input id="amount" type="number" min="0.01" max="1000000" step="0.01" required
            class="mt-1 block w-full rounded border p-2" placeholder="150.00" />
        </label>
        <button class="w-full rounded bg-teal-700 px-5 py-3 text-white hover:bg-teal-800">
          Guardar movimiento
        </button>
      </form>

      <div class="rounded-xl bg-white p-5 shadow-sm md:col-span-3">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-xl font-bold">Movimientos</h2>
          <select id="filter" aria-label="Filtrar movimientos" class="rounded border p-2">
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Egresos</option>
          </select>
        </div>
        <div id="list" class="space-y-3">Cargando...</div>
      </div>
    </section>
  </main>
`;

let transactions = [];

function showError(message) {
  element('error').textContent = message;
  element('error').classList.remove('hidden');
}

function render() {
  const selected = element('filter').value;
  const items = transactions.filter((item) => selected === 'all' || item.type === selected);

  element('list').innerHTML = items.length
    ? items.map((item) => `
        <article class="flex items-center justify-between gap-2 border-b pb-3">
          <div>
            <p class="font-semibold">${escapeHtml(item.description)}</p>
            <p class="text-xs text-slate-500">
              ${escapeHtml(item.category)} · ${escapeHtml(item.createdAt.slice(0, 10))}
            </p>
          </div>
          <div class="text-right">
            <p class="font-bold ${item.type === 'income' ? 'text-teal-700' : 'text-rose-700'}">
              ${item.type === 'income' ? '+' : '−'}${money(item.amountCents)}
            </p>
            <button class="delete text-xs underline" data-id="${item.id}">Eliminar</button>
          </div>
        </article>
      `).join('')
    : '<p class="text-slate-500">Sin movimientos</p>';
}

async function refresh() {
  try {
    const [list, summary] = await Promise.all([
      request('/api/v1/transactions'),
      request('/api/v1/summary'),
    ]);
    transactions = list.data;
    element('income').textContent = money(summary.data.incomeCents);
    element('expense').textContent = money(summary.data.expenseCents);
    element('balance').textContent = money(summary.data.balanceCents);
    render();
    element('error').classList.add('hidden');
  } catch (error) {
    showError(`No se pudo conectar con la API: ${error.message}`);
  }
}

element('filter').addEventListener('change', render);

element('form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const amountCents = Math.round(Number(element('amount').value) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    showError('Monto inválido');
    return;
  }

  const button = event.target.querySelector('button');
  button.disabled = true;
  try {
    await request('/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: element('type').value,
        description: element('description').value,
        category: element('category').value,
        amountCents,
      }),
    });
    event.target.reset();
    await refresh();
  } catch (error) {
    showError(`No se pudo guardar: ${error.message}`);
  } finally {
    button.disabled = false;
  }
});

element('list').addEventListener('click', async (event) => {
  const button = event.target.closest('.delete');
  if (!button || !confirm('¿Eliminar este movimiento?')) return;

  try {
    await request(`/api/v1/transactions/${encodeURIComponent(button.dataset.id)}`, {
      method: 'DELETE',
    });
    await refresh();
  } catch (error) {
    showError(`No se pudo eliminar: ${error.message}`);
  }
});

refresh();
```

---

## 📁 `apps/web/.env.example`

```dotenv
VITE_API_URL=http://localhost:3001
```

---

## 📁 `apps/api/package.json`

```json
{
  "name": "@moneycloud/api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "firebase-admin": "^13.0.2",
    "helmet": "^8.0.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^3.0.0"
  },
  "engines": {
    "node": ">=22"
  }
}
```

---

## 📁 `apps/api/Dockerfile`

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY apps/api/src ./src
ENV NODE_ENV=production
EXPOSE 3001
USER node
CMD [ "node", "src/server.js" ]
```

---

## 📁 `apps/api/src/server.js`

```javascript
import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT || 3001);
app.listen(port, '0.0.0.0', () => {
  console.log(`MoneyCloud API en puerto ${port}`);
});
```

---

## 📁 `apps/api/src/app.js`

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { listTransactions, createTransaction, deleteTransaction } from './store.js';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(40),
  amountCents: z.number().int().positive().max(100000000),
}).strict();

export const app = express();
app.disable('x-powered-by');
app.use(helmet());

const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen CORS no permitido'));
  },
}));
app.use(express.json({ limit: '16kb' }));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'moneycloud-api' });
});

app.get('/api/v1/transactions', async (_request, response, next) => {
  try {
    response.json({ data: await listTransactions() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/transactions', async (request, response, next) => {
  try {
    const parsed = transactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.flatten(),
      });
    }
    return response.status(201).json({ data: await createTransaction(parsed.data) });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/v1/transactions/:id', async (request, response, next) => {
  try {
    const deleted = await deleteTransaction(request.params.id);
    if (!deleted) return response.status(404).json({ error: 'Movimiento no encontrado' });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.get('/api/v1/summary', async (_request, response, next) => {
  try {
    const transactions = await listTransactions();
    const incomeCents = transactions
      .filter((item) => item.type === 'income')
      .reduce((total, item) => total + item.amountCents, 0);
    const expenseCents = transactions
      .filter((item) => item.type === 'expense')
      .reduce((total, item) => total + item.amountCents, 0);

    response.json({
      data: {
        incomeCents,
        expenseCents,
        balanceCents: incomeCents - expenseCents,
        count: transactions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error('API error:', error.message);
  const status = error.message === 'Origen CORS no permitido' ? 403 : 500;
  response.status(status).json({ error: 'No fue posible completar la operación' });
});
```

---

## 📁 `apps/api/src/store.js`

```javascript
import { randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';

const memory = new Map();
const collectionName = 'moneycloud_demo_transactions';
const useFirestore = () => process.env.STORAGE_DRIVER === 'firestore';

function database() {
  if (!getApps().length) {
    const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    console.log('Initializing Firebase Admin SDK with credentials:', credentials ? 'provided' : 'default');
    initializeApp({
      credential: credentials ? cert(JSON.parse(credentials)) : applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

export async function listTransactions() {
  if (!useFirestore()) {
    return [...memory.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const snapshot = await database()
    .collection(collectionName)
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();
  return snapshot.docs.map((document) => document.data());
}

export async function createTransaction(data) {
  const item = {
    id: randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  if (useFirestore()) {
    await database().collection(collectionName).doc(item.id).set(item);
  } else {
    memory.set(item.id, item);
  }
  return item;
}

export async function deleteTransaction(id) {
  if (!useFirestore()) return memory.delete(id);

  const reference = database().collection(collectionName).doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) return false;

  await reference.delete();
  return true;
}

export function resetMemoryForTests() {
  memory.clear();
}
```

---

## 📁 `apps/api/tests/api.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetMemoryForTests } from '../src/store.js';

process.env.STORAGE_DRIVER = 'memory';
beforeEach(() => resetMemoryForTests());

describe('API MoneyCloud', () => {
  it('responde health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('crea, lista, resume y elimina movimientos', async () => {
    const created = await request(app)
      .post('/api/v1/transactions')
      .send({ type: 'income', description: 'Beca', category: 'Otros', amountCents: 12345 });
    expect(created.status).toBe(201);

    const id = created.body.data.id;
    const list = await request(app).get('/api/v1/transactions');
    expect(list.body.data).toHaveLength(1);

    const summary = await request(app).get('/api/v1/summary');
    expect(summary.body.data.balanceCents).toBe(12345);

    const deleted = await request(app).delete(`/api/v1/transactions/${id}`);
    expect(deleted.status).toBe(204);
  });

  it('rechaza monto inválido', async () => {
    const response = await request(app)
      .post('/api/v1/transactions')
      .send({ type: 'expense', description: 'Café', category: 'Comida', amountCents: -5 });
    expect(response.status).toBe(400);
  });
});
```

---

## 📁 `apps/api/.env.example`

```dotenv
PORT=3001
STORAGE_DRIVER=memory
CORS_ORIGIN=http://localhost:5173
# Para Render: STORAGE_DRIVER=firestore
# FIREBASE_PROJECT_ID=tu-proyecto
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

## 📸 Evidencias de Entrega

- **Imagen de los registros en Firebase:** `docs/evidencia_firebase_9oct.png`
- **Video mostrando la funcionalidad de la app (MP4):** `docs/evidencia_video_9oct.mp4`

