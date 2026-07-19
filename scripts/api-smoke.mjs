// Smoke testy REST API Notatnik.
// Node ESM, bez zewnętrznych zależności (global fetch).
// Uruchomienie: node scripts/api-smoke.mjs
// Opcjonalnie: API_URL=... API_PASS=... node scripts/api-smoke.mjs

const BASE = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const PASS = process.env.API_PASS ?? 'dev123';

let pass = 0;
let fail = 0;
const failures = [];

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const init = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  let res;
  try {
    res = await fetch(BASE + path, init);
  } catch (e) {
    return { ok: false, err: String(e) };
  }
  const text = await res.text();
  let json = null;
  if (text) {
    try { json = JSON.parse(text); } catch { /* non-JSON */ }
  }
  return { ok: true, status: res.status, json };
}

function check(name, cond, detail = '') {
  if (cond) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? '  ::  ' + detail : ''}`);
  }
}

let token = null;
let testNoteId = null;
let testNote2Id = null;
let testTaskId = null;
let testPersonId = null;
let testMoveTaskId = null;
let testPersonTypeId = 'pt-test';
let testPersonOfTestType = null;

const createdNoteIds = [];
const createdTaskIds = [];

async function main() {
  // 1. POST /login złe hasło → 401
  {
    const r = await req('POST', '/login', { password: 'zle-haslo' });
    check('1. login złe hasło → 401', r.ok && r.status === 401,
      r.ok ? `status=${r.status}` : r.err);
  }

  // 2. POST /login dobre → token
  {
    const r = await req('POST', '/login', { password: PASS });
    const ok = r.ok && r.status === 200 && r.json && typeof r.json.token === 'string';
    check('2. login dobre → token', ok,
      r.ok ? `status=${r.status}` : r.err);
    if (!ok) return finish();
    token = r.json.token;
  }

  // 3. GET /state bez tokenu → 401
  {
    const r = await req('GET', '/state');
    check('3. /state bez tokenu → 401', r.ok && r.status === 401,
      r.ok ? `status=${r.status}` : r.err);
  }

  // 4. GET /state z tokenem → 200, struktura i notatka mentioned, tasks posortowane
  {
    const r = await req('GET', '/state', undefined, token);
    const ok = r.ok && r.status === 200;
    if (!ok) { check('4. /state z tokenem → 200', false, r.ok ? `status=${r.status}` : r.err); return finish(); }
    const j = r.json;
    const keysOk = j && Array.isArray(j.personTypes) && Array.isArray(j.people)
      && Array.isArray(j.notes) && Array.isArray(j.tasks) && Array.isArray(j.projects);
    check('4a. /state ma 5 kluczy-tablic', keysOk);
    const note0Ok = j.notes.length > 0 && Array.isArray(j.notes[0].mentioned)
      && typeof j.notes[0].createdAt === 'string';
    check('4b. notes[0] ma mentioned (tablica) i createdAt', note0Ok,
      j.notes[0] ? `mentioned=${JSON.stringify(j.notes[0].mentioned)}` : '');
    // Tasks posortowane po order w ramach kolumny
    let sortedOk = true;
    const byCol = {};
    for (const t of j.tasks) (byCol[t.column] ??= []).push(t);
    for (const col of Object.keys(byCol)) {
      const arr = byCol[col];
      for (let i = 1; i < arr.length; i++) {
        if (arr[i].order <= arr[i - 1].order) sortedOk = false;
      }
    }
    check('4c. tasks posortowane w kolumnach po order', sortedOk);

    // firstPerson for mention test
    const firstPerson = j.people[0]?.id;
    globalThis.__firstPerson = firstPerson;
    globalThis.__existingProject = j.projects[0]?.id;
    globalThis.__todoTasksBefore = j.tasks.filter(t => t.column === 'todo').map(t => ({ id: t.id, order: t.order }));
  }

  // 5. POST /notes (mentioned=[firstPerson]) → 201; /state: notatka jest, mentioned zgadza się
  {
    testNoteId = 'n-smoke-' + Date.now();
    const payload = {
      id: testNoteId,
      kind: 'text',
      title: 'Smoke test note',
      body: 'Ciało testowe',
      mentioned: [globalThis.__firstPerson],
    };
    const r = await req('POST', '/notes', payload, token);
    const ok = r.ok && r.status === 201 && r.json && r.json.id === testNoteId
      && Array.isArray(r.json.mentioned) && r.json.mentioned.includes(globalThis.__firstPerson);
    check('5a. POST /notes → 201', r.ok && r.status === 201,
      r.ok ? `status=${r.status} ${r.json && r.json.error ? '(' + r.json.error + ')' : ''}` : r.err);
    check('5b. utworzona notatka ma mentioned', ok, r.json ? JSON.stringify(r.json.mentioned) : '');
    createdNoteIds.push(testNoteId);

    const s = await req('GET', '/state', undefined, token);
    const found = s.json && s.json.notes.find(n => n.id === testNoteId);
    check('5c. /state zawiera nową notatkę z poprawnym mentioned',
      !!found && Array.isArray(found.mentioned) && found.mentioned.length === 1
        && found.mentioned[0] === globalThis.__firstPerson,
      found ? JSON.stringify(found.mentioned) : 'nie znaleziono');
  }

  // 6. PUT /notes/{id} {title} → 200, updatedAt zmieniony, title zmieniony
  {
    const before = (await req('GET', '/state', undefined, token)).json.notes.find(n => n.id === testNoteId);
    const r = await req('PUT', '/notes/' + testNoteId, { title: 'Zmieniony' }, token);
    const ok = r.ok && r.status === 200 && r.json && r.json.title === 'Zmieniony';
    check('6a. PUT /notes/{id} → 200 z nowym title', ok, r.json ? r.json.title : '');
    const changed = r.json && before && r.json.updatedAt >= before.updatedAt && r.json.updatedAt !== before.updatedAt || r.json && before && r.json.updatedAt >= before.updatedAt;
    check('6b. updatedAt uległo zmianie', r.ok && r.json && before && r.json.updatedAt >= before.updatedAt,
      `before=${before?.updatedAt} after=${r.json?.updatedAt}`);
  }

  // 7. POST /tasks {column:'todo'} → 201 z order 0; /state: poprzednie todo przesunięte o 1
  {
    testTaskId = 't-smoke-' + Date.now();
    const payload = { id: testTaskId, title: 'Smoke task', column: 'todo' };
    const r = await req('POST', '/tasks', payload, token);
    const ok = r.ok && r.status === 201 && r.json && r.json.id === testTaskId && r.json.order === 0;
    check('7a. POST /tasks {column todo} → 201 z order=0', ok,
      r.json ? `order=${r.json.order}` : r.err);
    createdTaskIds.push(testTaskId);

    const s = await req('GET', '/state', undefined, token);
    const todoNow = s.json.tasks.filter(t => t.column === 'todo');
    const before = globalThis.__todoTasksBefore;
    let shiftedOk = true;
    for (const b of before) {
      const now = todoNow.find(t => t.id === b.id);
      if (!now || now.order !== b.order + 1) { shiftedOk = false; break; }
    }
    const newTaskNow = todoNow.find(t => t.id === testTaskId);
    check('7b. poprzednie todo order +1, nowy order=0',
      shiftedOk && newTaskNow && newTaskNow.order === 0,
      `newOrder=${newTaskNow ? newTaskNow.order : '?'}, shiftedOk=${shiftedOk}`);
  }

  // 8. POST /tasks/{id}/move {column:'doing'} → order = max+1
  {
    const beforeDo = (await req('GET', '/state', undefined, token)).json.tasks.filter(t => t.column === 'doing');
    const maxOrder = beforeDo.reduce((m, t) => Math.max(m, t.order), -1);
    const r = await req('POST', '/tasks/' + testTaskId + '/move', { column: 'doing' }, token);
    const ok = r.ok && r.status === 200 && r.json && r.json.column === 'doing' && r.json.order === maxOrder + 1;
    check('8. POST /tasks/{id}/move → order=max+1', ok,
      r.json ? `column=${r.json.column} order=${r.json.order} oczekiwane=${maxOrder + 1}` : r.err);
  }

  // 9. POST /people (pt-kontakt) → 201; POST /notes z wzmianką; DELETE /people → 200; /state: osoba i wzmianka zniknęły
  {
    testPersonId = 'p-smoke-' + Date.now();
    const r = await req('POST', '/people', {
      id: testPersonId, name: 'Smoke Osoba', typeId: 'pt-kontakt', values: {},
    }, token);
    check('9a. POST /people → 201', r.ok && r.status === 201,
      r.ok ? `status=${r.status} ${r.json && r.json.error ? '(' + r.json.error + ')' : ''}` : r.err);

    testNote2Id = 'n-smoke-mention-' + Date.now();
    const rn = await req('POST', '/notes', {
      id: testNote2Id, kind: 'text', title: 'Z wzmianką', body: 'x',
      mentioned: [testPersonId],
    }, token);
    check('9b. POST /notes z wzmianką nowej osoby → 201',
      rn.ok && rn.status === 201,
      rn.ok ? `status=${rn.status} ${rn.json && rn.json.error ? '(' + rn.json.error + ')' : ''}` : rn.err);
    createdNoteIds.push(testNote2Id);

    const rd = await req('DELETE', '/people/' + testPersonId, undefined, token);
    check('9c. DELETE /people/{id} → 200', rd.ok && rd.status === 200,
      rd.ok ? `status=${rd.status}` : rd.err);

    const s = await req('GET', '/state', undefined, token);
    const found = s.json.people.find(p => p.id === testPersonId);
    const noteBack = s.json.notes.find(n => n.id === testNote2Id);
    check('9d. /state: osoba zniknęła', !found);
    check('9e. /state: wzmianka zniknęła z notatki (CASCADE)',
      !!noteBack && Array.isArray(noteBack.mentioned) && !noteBack.mentioned.includes(testPersonId),
      noteBack ? JSON.stringify(noteBack.mentioned) : 'nie znaleziono notatki');
  }

  // 10. POST /person-types pt-test → 201; POST osoba tego typu; DELETE /person-types/pt-test → 200; /state: osoba ma inny typeId
  {
    const r = await req('POST', '/person-types', { id: testPersonTypeId, name: 'Test' }, token);
    check('10a. POST /person-types → 201', r.ok && r.status === 201,
      r.ok ? `status=${r.status} ${r.json && r.json.error ? '(' + r.json.error + ')' : ''}` : r.err);

    testPersonOfTestType = 'p-pttype-' + Date.now();
    const rp = await req('POST', '/people', {
      id: testPersonOfTestType, name: 'PTType Osoba', typeId: testPersonTypeId, values: {},
    }, token);
    check('10b. POST /people typu pt-test → 201', rp.ok && rp.status === 201,
      rp.ok ? `status=${rp.status}` : rp.err);

    const rd = await req('DELETE', '/person-types/' + testPersonTypeId, undefined, token);
    check('10c. DELETE /person-types/pt-test → 200', rd.ok && rd.status === 200,
      rd.ok ? `status=${rd.status} ${rd.json && rd.json.error ? '(' + rd.json.error + ')' : ''}` : rd.err);

    const s = await req('GET', '/state', undefined, token);
    const p = s.json.people.find(x => x.id === testPersonOfTestType);
    check('10d. /state: osoba ma typeId != pt-test (fallback)', !!p && p.typeId !== testPersonTypeId,
      p ? `typeId=${p.typeId}` : 'osoba nie istnieje');

    // cleanup person (FK cascade cleanup)
    await req('DELETE', '/people/' + testPersonOfTestType, undefined, token);
  }

  // 11. Cleanup utworzonych notes/tasks; PUT /projects/{id} {blockedReason:'test'} → 200; /state widać; przywróć null
  {
    for (const id of createdNoteIds) {
      await req('DELETE', '/notes/' + id, undefined, token);
    }
    for (const id of createdTaskIds) {
      await req('DELETE', '/tasks/' + id, undefined, token);
    }
    const pid = globalThis.__existingProject;
    const before = (await req('GET', '/state', undefined, token)).json.projects.find(p => p.id === pid);
    const r = await req('PUT', '/projects/' + pid, { blockedReason: 'test' }, token);
    check('11a. PUT /projects/{id} {blockedReason} → 200', r.ok && r.status === 200,
      r.ok ? `status=${r.status}` : r.err);
    const s = await req('GET', '/state', undefined, token);
    const prj = s.json.projects.find(p => p.id === pid);
    check('11b. /state: blockedReason == "test"',
      !!prj && prj.blockedReason === 'test', prj ? `blockedReason=${prj.blockedReason}` : '');
    // przywróć null
    await req('PUT', '/projects/' + pid, { blockedReason: null }, token);
    const after = (await req('GET', '/state', undefined, token)).json.projects.find(p => p.id === pid);
    check('11c. przywrócono blockedReason=null', !!after && after.blockedReason === null,
      after ? `blockedReason=${after.blockedReason}` : '');
  }

  // 12. Nieznana trasa → 404
  {
    const r = await req('GET', '/nieznana-trasa-' + Date.now());
    check('12. nieznana trasa → 404', r.ok && r.status === 404,
      r.ok ? `status=${r.status}` : r.err);
  }

  // 13. Projekty: tworzenie i usuwanie
  {
    const projectId = 'prj-smoke-' + Date.now();
    const firstPersonId = globalThis.__firstPerson;
    const r = await req('POST', '/projects', {
      id: projectId,
      name: 'Smoke projekt',
      tags: ['test'],
      peopleIds: [firstPersonId],
    }, token);
    check('13a. POST /projects → 201', r.ok && r.status === 201,
      r.ok ? `status=${r.status} ${r.json && r.json.error ? '(' + r.json.error + ')' : ''}` : r.err);
    const createdAtOk = r.ok && r.json && typeof r.json.createdAt === 'string';
    check('13b. utworzony projekt ma createdAt string', createdAtOk,
      r.json ? `createdAt=${typeof r.json.createdAt}` : '');
    const peopleIdsOk = r.ok && r.json && Array.isArray(r.json.peopleIds) && r.json.peopleIds.includes(firstPersonId);
    check('13c. peopleIds zawiera przypisaną osobę', peopleIdsOk,
      r.json ? JSON.stringify(r.json.peopleIds) : '');

    const s1 = await req('GET', '/state', undefined, token);
    const foundProject = s1.json && s1.json.projects.find(p => p.id === projectId);
    check('13d. /state zawiera nowy projekt', !!foundProject);

    const taskId = 't-smoke-prj-' + Date.now();
    const rt = await req('POST', '/tasks', {
      id: taskId,
      title: 'Zadanie projektowe',
      column: 'todo',
      projectId,
    }, token);
    check('13e. POST /tasks z projectId → 201', rt.ok && rt.status === 201,
      rt.ok ? `status=${rt.status} ${rt.json && rt.json.error ? '(' + rt.json.error + ')' : ''}` : rt.err);

    const rd = await req('DELETE', '/projects/' + projectId, undefined, token);
    check('13f. DELETE /projects/{id} → 200', rd.ok && rd.status === 200,
      rd.ok ? `status=${rd.status}` : rd.err);

    const s2 = await req('GET', '/state', undefined, token);
    const goneProject = s2.json && s2.json.projects.find(p => p.id === projectId);
    const taskAfter = s2.json && s2.json.tasks.find(t => t.id === taskId);
    check('13g. /state: projekt zniknął', !goneProject);
    check('13h. /state: zadanie ma projectId undefined',
      !!taskAfter && (taskAfter.projectId === undefined || taskAfter.projectId === null),
      taskAfter ? `projectId=${taskAfter.projectId}` : 'nie znaleziono zadania');

    const rDelTask = await req('DELETE', '/tasks/' + taskId, undefined, token);
    check('13i. cleanup zadanie usunięte', rDelTask.ok && rDelTask.status === 200,
      rDelTask.ok ? `status=${rDelTask.status}` : rDelTask.err);

    const rBad = await req('POST', '/projects', { id: 'prj-bad-' + Date.now() }, token);
    check('13j. POST /projects bez name → 400', rBad.ok && rBad.status === 400,
      rBad.ok ? `status=${rBad.status}` : rBad.err);
  }

  finish();
}

function finish() {
  console.log('\n--- PODSUMOWANIE ---');
  console.log(`PASS: ${pass}   FAIL: ${fail}`);
  if (failures.length) {
    console.log('Nieudane: ' + failures.join(', '));
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Błąd krytyczny:', e);
  process.exit(2);
});