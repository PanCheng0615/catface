const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EXCEL_PATH = path.resolve(__dirname, '../../歷屆領養情況.xlsx');
const SOURCE_NAME = '歷屆領養情況.xlsx';

function isBlankRow(row) {
  return row.every((cell) => String(cell || '').trim() === '');
}

function parseAgeMonths(rawAge) {
  const value = String(rawAge || '').trim();
  if (!value || value === 'N/A') {
    return null;
  }

  const yearsMatch = value.match(/(\d+)歲/);
  const monthsMatch = value.match(/(\d+)個月/);
  const weeksMatch = value.match(/(\d+)周/);

  if (yearsMatch || monthsMatch) {
    const years = yearsMatch ? Number(yearsMatch[1]) : 0;
    const months = monthsMatch ? Number(monthsMatch[1]) : 0;
    return years * 12 + months;
  }

  if (weeksMatch) {
    return Math.max(1, Math.round(Number(weeksMatch[1]) / 4));
  }

  return null;
}

function parseAdoptionStatus(rawStatus) {
  const normalized = String(rawStatus ?? '').trim();

  if (normalized === '1' || normalized === '1.0') {
    return {
      is_available: false,
      label: 'adopted'
    };
  }

  if (normalized === '0' || normalized === '0.0') {
    return {
      is_available: true,
      label: 'not_adopted'
    };
  }

  if (normalized === '0*') {
    return {
      is_available: true,
      label: 'special_case'
    };
  }

  if (normalized === '-') {
    return {
      is_available: true,
      label: 'unknown'
    };
  }

  return {
    is_available: true,
    label: normalized || 'unknown'
  };
}

function parseEventDate(rawTime) {
  const value = String(rawTime || '').trim();
  if (!value) {
    return null;
  }

  const rangeMatch = value.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (rangeMatch) {
    const year = Number(rangeMatch[1]);
    const month = Number(rangeMatch[2]) - 1;
    const day = Number(rangeMatch[3]);
    return new Date(Date.UTC(year, month, day));
  }

  const monthMatch = value.match(/(\d{4})\.(\d{1,2})$/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]) - 1;
    return new Date(Date.UTC(year, month, 1));
  }

  return null;
}

function buildTags(row) {
  const tags = new Set();
  const personality = String(row.personality || '').trim();
  const remark = String(row.remark || '').trim();
  const deworming = String(row.deworming || '').trim();
  const vaccine = String(row.vaccine || '').trim();
  const neutered = String(row.neutered || '').trim();

  if (personality) {
    personality
      .split(/[，、,]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => tags.add(tag));
  }

  if (remark && remark !== personality) {
    tags.add(remark);
  }

  if (deworming && deworming !== 'N/A') {
    tags.add(`驅蟲:${deworming}`);
  }

  if (vaccine && vaccine !== 'N/A') {
    tags.add(`疫苗:${vaccine}`);
  }

  if (neutered && neutered !== 'N/A') {
    tags.add(`絕育:${neutered}`);
  }

  return Array.from(tags).slice(0, 10);
}

function buildDescription(row, marker, adoptionLabel) {
  const lines = [
    marker,
    `來源: ${SOURCE_NAME}`,
    row.session ? `屆別: ${row.session}` : '',
    row.event_time ? `活動時間: ${row.event_time}` : '',
    `領養情況原值: ${row.adoption_raw}`,
    `領養狀態標記: ${adoptionLabel}`,
    row.deworming ? `驅蟲: ${row.deworming}` : '',
    row.vaccine ? `疫苗: ${row.vaccine}` : '',
    row.neutered ? `絕育: ${row.neutered}` : '',
    row.personality ? `性格: ${row.personality}` : '',
    row.remark ? `備註: ${row.remark}` : ''
  ].filter(Boolean);

  return lines.join('\n');
}

function normalizeRows(rows) {
  const normalized = [];
  let currentSession = '';
  let currentTime = '';

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];

    if (!Array.isArray(row) || isBlankRow(row)) {
      continue;
    }

    if (String(row[0] || '').trim() === '領養數') {
      break;
    }

    if (String(row[0] || '').trim()) {
      currentSession = String(row[0]).trim();
    }

    if (String(row[1] || '').trim()) {
      currentTime = String(row[1]).trim();
    }

    const name = String(row[2] || '').trim();
    if (!name) {
      continue;
    }

    normalized.push({
      row_number: index + 1,
      session: currentSession,
      event_time: currentTime,
      name,
      adoption_raw: String(row[3] ?? '').trim(),
      gender: String(row[4] || '').trim() || null,
      age_raw: String(row[5] || '').trim(),
      breed_raw: String(row[6] || '').trim(),
      deworming: String(row[7] || '').trim(),
      vaccine: String(row[8] || '').trim(),
      neutered: String(row[9] || '').trim(),
      personality: String(row[10] || '').trim(),
      remark: String(row[11] || '').trim()
    });
  }

  return normalized;
}

async function importRows() {
  const workbook = xlsx.readFile(EXCEL_PATH);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: ''
  });

  const normalizedRows = normalizeRows(rows);
  let createdCount = 0;
  let skippedCount = 0;

  for (const row of normalizedRows) {
    const marker = `[import:${SOURCE_NAME}:row-${row.row_number}]`;
    const existing = await prisma.cat.findFirst({
      where: {
        description: {
          contains: marker
        }
      },
      select: { id: true }
    });

    if (existing) {
      skippedCount += 1;
      continue;
    }

    const adoptionStatus = parseAdoptionStatus(row.adoption_raw);
    const tagValues = buildTags(row);
    const createdAt = parseEventDate(row.event_time);

    await prisma.cat.create({
      data: {
        name: row.name,
        breed: row.breed_raw || null,
        age_months: parseAgeMonths(row.age_raw),
        gender: row.gender === 'N/A' ? null : row.gender,
        color: row.breed_raw || null,
        description: buildDescription(row, marker, adoptionStatus.label),
        is_available: adoptionStatus.is_available,
        created_at: createdAt || undefined,
        tags: tagValues.length
          ? {
              create: tagValues.map((tag) => ({ tag }))
            }
          : undefined
      }
    });

    createdCount += 1;
  }

  return {
    total: normalizedRows.length,
    created: createdCount,
    skipped: skippedCount
  };
}

async function main() {
  try {
    const summary = await importRows();
    console.log(`Imported ${summary.created} cats, skipped ${summary.skipped}, total parsed ${summary.total}.`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
