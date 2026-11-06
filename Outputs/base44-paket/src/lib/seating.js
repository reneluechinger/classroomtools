export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const students = [];
  // Kopfzeile überspringen, falls vorhanden
  const first = (lines[0] || '').toLowerCase();
  const startIndex = first.includes('vorname') || first.includes('nachname') ? 1 : 0;
  for (const line of lines.slice(startIndex)) {
    const parts = line.split(/[;,\t]/).map(p => p.trim());
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastName = parts[1];
      const g = parts[2]?.toLowerCase()?.charAt(0);
      const gender = g === 'w' ? 'w' : g === 'd' ? 'd' : 'm';
      if (firstName && lastName) {
        students.push({ id: generateId(), firstName, lastName, gender });
      }
    }
  }
  return students;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isBlacklisted(idA, idB, blacklist) {
  return blacklist.some(
    b => (b.studentA === idA && b.studentB === idB) ||
         (b.studentA === idB && b.studentB === idA)
  );
}

function isMustTogether(idA, idB, mustRules) {
  return mustRules.some(
    r => (r.studentA === idA && r.studentB === idB) ||
         (r.studentA === idB && r.studentB === idA)
  );
}

function getFreeSeats(tableId, occupiedSeats) {
  return [0, 1].filter(i => !occupiedSeats.has(`${tableId}-${i}`));
}

// Returns all table IDs that belong to the same group as the given table
// (or just the table itself if it's not part of any group).
function getGroupTableIds(tableId, tableGroups) {
  const group = tableGroups.find(g => g.tableIds.includes(tableId));
  return group ? group.tableIds : [tableId];
}

// All student IDs already placed at any table in the same group as `tableId`.
function getGroupOccupants(tableId, assignments, tableGroups) {
  const groupTableIds = getGroupTableIds(tableId, tableGroups);
  return assignments
    .filter(a => groupTableIds.includes(a.tableId))
    .map(a => a.studentId);
}

/**
 * Main seating generator.
 *
 * Priority order (hard → soft):
 * 1. Fixed seats — always placed first, never overridden
 * 2. Must-sit-together — guaranteed same table (retries if impossible)
 * 3. Blacklist — never at same table (hard constraint)
 * 4. Gender mix — boy–girl pairs preferred when genderMix=true
 * 5. Group fill strategy — 3 per group first, then 4th seat
 */
export function generateSeating(students, tables, options = {}) {
  const { genderMix = false, blacklist = [], mustSitTogether: mustRules = [], tableGroups = [] } = options;

  for (let attempt = 0; attempt < 3000; attempt++) {
    const result = tryGenerate(students, tables, { genderMix, blacklist, mustRules, tableGroups });
    if (result) return result;
  }

  // Fallback: ignore gender mix, keep hard constraints
  for (let attempt = 0; attempt < 3000; attempt++) {
    const result = tryGenerate(students, tables, { genderMix: false, blacklist, mustRules, tableGroups });
    if (result) return result;
  }

  // Last resort: sequential fill
  const seats = [];
  tables.forEach(t => {
    seats.push({ tableId: t.id, seatIndex: 0 });
    seats.push({ tableId: t.id, seatIndex: 1 });
  });
  const s = shuffle(students);
  return seats.slice(0, s.length).map((seat, i) => ({ ...seat, studentId: s[i].id }));
}

function tryGenerate(students, tables, { genderMix, blacklist, mustRules, tableGroups }) {
  const assignments = [];
  const occupiedSeats = new Set();
  const placedStudentIds = new Set();

  // ── Step 1: Place fixed seats ──────────────────────────────────────────────
  for (const student of students) {
    if (student.fixedTableId && tables.find(t => t.id === student.fixedTableId)) {
      const seatIndex = student.fixedSeatIndex ?? 0;
      const key = `${student.fixedTableId}-${seatIndex}`;
      if (!occupiedSeats.has(key)) {
        assignments.push({ tableId: student.fixedTableId, seatIndex, studentId: student.id });
        placedStudentIds.add(student.id);
        occupiedSeats.add(key);
      }
    }
  }

  // ── Step 2: Must-sit-together pairs ────────────────────────────────────────
  const flexStudents = shuffle(students.filter(s => !placedStudentIds.has(s.id)));
  const pairedIds = new Set();
  const pairedGroups = [];

  for (const rule of mustRules) {
    const a = flexStudents.find(s => s.id === rule.studentA && !pairedIds.has(s.id));
    const b = flexStudents.find(s => s.id === rule.studentB && !pairedIds.has(s.id));
    if (a && b) {
      pairedGroups.push([a.id, b.id]);
      pairedIds.add(a.id);
      pairedIds.add(b.id);
    }
  }

  const shuffledTables = shuffle(tables);
  for (const [idA, idB] of pairedGroups) {
    let placed = false;
    for (const table of shuffledTables) {
      const free = getFreeSeats(table.id, occupiedSeats);
      if (free.length < 2) continue;

      const groupOccupants = getGroupOccupants(table.id, assignments, tableGroups);
      const violates = groupOccupants.some(occ =>
        isBlacklisted(occ, idA, blacklist) || isBlacklisted(occ, idB, blacklist)
      );
      if (violates) continue;

      assignments.push({ tableId: table.id, seatIndex: free[0], studentId: idA });
      assignments.push({ tableId: table.id, seatIndex: free[1], studentId: idB });
      occupiedSeats.add(`${table.id}-${free[0]}`);
      occupiedSeats.add(`${table.id}-${free[1]}`);
      placedStudentIds.add(idA);
      placedStudentIds.add(idB);
      placed = true;
      break;
    }
    if (!placed) return null; // can't satisfy → retry
  }

  // ── Step 3: Build ordered seat slots (3-first group strategy) ──────────────
  const groupedTableIds = new Set(tableGroups.flatMap(g => g.tableIds));
  const seatSlots = [];

  for (const group of tableGroups) {
    const groupTables = group.tableIds.map(id => tables.find(t => t.id === id)).filter(Boolean);
    // First seat of each table in the group → fills group to 3 before going to 4
    for (const t of groupTables) {
      if (!occupiedSeats.has(`${t.id}-0`)) seatSlots.push({ tableId: t.id, seatIndex: 0 });
    }
    for (const t of groupTables) {
      if (!occupiedSeats.has(`${t.id}-1`)) seatSlots.push({ tableId: t.id, seatIndex: 1 });
    }
  }

  for (const t of tables.filter(t => !groupedTableIds.has(t.id))) {
    if (!occupiedSeats.has(`${t.id}-0`)) seatSlots.push({ tableId: t.id, seatIndex: 0 });
    if (!occupiedSeats.has(`${t.id}-1`)) seatSlots.push({ tableId: t.id, seatIndex: 1 });
  }

  // ── Step 4: Greedily assign remaining students ──────────────────────────────
  const remaining = new Set(flexStudents.filter(s => !placedStudentIds.has(s.id)).map(s => s.id));
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  for (const slot of seatSlots) {
    if (remaining.size === 0) break;
    if (occupiedSeats.has(`${slot.tableId}-${slot.seatIndex}`)) continue;

    const tableOccupants = assignments.filter(a => a.tableId === slot.tableId).map(a => a.studentId);
    const groupOccupants = getGroupOccupants(slot.tableId, assignments, tableGroups);

    let bestId = null;
    let bestScore = -Infinity;

    for (const candidateId of remaining) {
      // Hard: blacklist — not at same table nor at a table in the same group (gegenüber)
      if (groupOccupants.some(occ => isBlacklisted(occ, candidateId, blacklist))) continue;

      let score = 0;

      // Bonus: must-sit-together (edge case — already handled above, but safety)
      if (tableOccupants.some(occ => isMustTogether(occ, candidateId, mustRules))) score += 1000;

      // Bonus: gender mix (boy next to girl)
      if (genderMix && tableOccupants.length > 0) {
        const candidate = studentMap[candidateId];
        for (const occ of tableOccupants) {
          const occStudent = studentMap[occ];
          if (candidate && occStudent
              && candidate.gender !== 'd' && occStudent.gender !== 'd'
              && candidate.gender !== occStudent.gender) {
            score += 10;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestId = candidateId;
      }
    }

    if (bestId === null) continue;

    assignments.push({ tableId: slot.tableId, seatIndex: slot.seatIndex, studentId: bestId });
    occupiedSeats.add(`${slot.tableId}-${slot.seatIndex}`);
    remaining.delete(bestId);
  }

  // Not all students could be placed without violating constraints → retry
  if (remaining.size > 0) return null;

  // Verify all must-sit-together are satisfied
  for (const rule of mustRules) {
    const aA = assignments.find(a => a.studentId === rule.studentA);
    const aB = assignments.find(a => a.studentId === rule.studentB);
    if (aA && aB && aA.tableId !== aB.tableId) return null;
  }

  return assignments;
}