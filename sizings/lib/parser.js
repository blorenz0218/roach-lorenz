'use strict';

/**
 * Server-side Export-tab parser for the Centennial sizing pipeline.
 *
 * This is a faithful port of the parser in publisher.html — same schema,
 * same value coercions, same notes-continuation logic, same prefix-match
 * fallback for Excel-for-Web (space-separated) pastes. Keep the two in sync:
 * a change here is a change to the publish contract with Brian's Export tab.
 */

const SCHEMA = {
  // DEAL IDENTITY
  'property name': { key: 'propertyName', fmt: 'text', required: true },
  'city': { key: 'city', fmt: 'text', required: true },
  'state': { key: 'state', fmt: 'state', required: true },
  'unit count': { key: 'units', fmt: 'int', required: true },
  'transaction type': { key: 'transactionType', fmt: 'enum', enum: ['Refinance', 'Acquisition'], required: true },

  // PROGRAM
  'hud program': { key: 'program', fmt: 'enum', enum: ['223(f)'], required: true },
  'deal type': { key: 'dealType', fmt: 'enum', enum: ['Market', 'Affordable'], required: true },
  'sizing date': { key: 'sizingDate', fmt: 'date', required: true },

  // NOI & VALUE
  'effective income - value noi': { key: 'effIncomeValue', fmt: 'currency', required: true },
  'effective income - debt svc noi': { key: 'effIncomeDS', fmt: 'currency', required: true },
  'operating expenses - value noi': { key: 'opExValue', fmt: 'currency', required: true },
  'operating expenses - debt svc noi': { key: 'opExDS', fmt: 'currency', required: true },
  'replacement reserves - value noi': { key: 'reservesValue', fmt: 'currency', required: true },
  'replacement reserves - debt svc noi': { key: 'reservesDS', fmt: 'currency', required: true },
  'cap rate': { key: 'capRate', fmt: 'pctHuman', required: true },

  // UNDERWRITING INPUTS
  'interest rate': { key: 'rate', fmt: 'pctHuman', required: true },
  'requested loan amount': { key: 'reqLoan', fmt: 'currencyOrBlank', required: false },
  'existing replacement reserve': { key: 'existingReserve', fmt: 'currency', required: true },
  'existing debt': { key: 'existingDebt', fmt: 'currency', required: true },
  'prepayment penalty': { key: 'prepay', fmt: 'currency', required: true },
  'repairs': { key: 'repairs', fmt: 'currency', required: true },
  'borrower legal': { key: 'bLegal', fmt: 'currency', required: true },
  'title & survey': { key: 'titleSurvey', fmt: 'currency', required: true },

  // STATUTORY
  'statutory limit': { key: 'statutoryLimit', fmt: 'currency', required: true },

  // SOURCES & USES + RATES
  'prepaid 3rd party reports': { key: 'prepaid3PR', fmt: 'currency', required: true },
  'initial deposit to reserves': { key: 'initialReserveDeposit', fmt: 'currency', required: true },
  'hud application fee rate': { key: 'appFeeRate', fmt: 'pctDecimal', required: true },
  'hud initial mip rate': { key: 'initialMIPRate', fmt: 'pctDecimal', required: true },
  'hud inspection fee': { key: 'inspectionFee', fmt: 'currency', required: true },
  'financing fee rate': { key: 'financingFeeRate', fmt: 'pctDecimal', required: true },
  'processing fee': { key: 'processingFee', fmt: 'currency', required: true },
  'centennial legal': { key: 'centennialLegal', fmt: 'currency', required: true },
  'borrower organizational': { key: 'borrowerOrg', fmt: 'currency', required: true },
  '3rd party reports (total)': { key: 'thirdPartyReports', fmt: 'currency', required: true },
  'repair completion assurance escrow': { key: 'repairAssurance', fmt: 'currency', required: true },
  'annual mip rate': { key: 'mipRate', fmt: 'pctDecimal', required: true }
};

function normalizeLabel(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[\u2013\u2014\u2212]/g, '-') // en/em dash, minus -> hyphen
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumberLoose(s) {
  if (s === '' || s === null || s === undefined) return null;
  let str = String(s).trim();
  if (str === '') return null;
  const negative = /^\(.*\)$/.test(str);
  str = str.replace(/[$,()\s]/g, '').replace(/%/g, '');
  if (str === '') return null;
  const n = Number(str);
  if (isNaN(n)) return null;
  return negative ? -n : n;
}

function parseValue(rawVal, fmt, enumValues) {
  if (rawVal === '' || rawVal === null || rawVal === undefined) {
    return { value: null, error: null };
  }
  const str = String(rawVal).trim();
  if (str === '') return { value: null, error: null };

  switch (fmt) {
    case 'text':
      return { value: str, error: null };
    case 'state': {
      const s = str.toUpperCase();
      if (!/^[A-Z]{2}$/.test(s)) return { value: null, error: 'Expected 2-letter state code, got "' + str + '"' };
      return { value: s, error: null };
    }
    case 'int': {
      const n = parseNumberLoose(str);
      if (n === null) return { value: null, error: 'Expected integer, got "' + str + '"' };
      if (!Number.isInteger(n)) return { value: Math.round(n), error: null };
      return { value: n, error: null };
    }
    case 'currency': {
      const n = parseNumberLoose(str);
      if (n === null) return { value: null, error: 'Expected number, got "' + str + '"' };
      return { value: n, error: null };
    }
    case 'currencyOrBlank': {
      const n = parseNumberLoose(str);
      if (n === null) return { value: null, error: null };
      if (n === 0) return { value: null, error: null };
      return { value: n, error: null };
    }
    case 'pctHuman': {
      const n = parseNumberLoose(str);
      if (n === null) return { value: null, error: 'Expected percent, got "' + str + '"' };
      return { value: n, error: null };
    }
    case 'pctDecimal': {
      const hasPercentSign = String(str).includes('%');
      const n = parseNumberLoose(str);
      if (n === null) return { value: null, error: 'Expected decimal percent, got "' + str + '"' };
      return { value: hasPercentSign ? n / 100 : n, error: null };
    }
    case 'enum': {
      const lower = str.toLowerCase();
      const found = enumValues.find(v => v.toLowerCase() === lower);
      if (!found) return { value: null, error: 'Expected one of ' + enumValues.join('/') + ', got "' + str + '"' };
      return { value: found, error: null };
    }
    case 'date': {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return { value: d.toISOString().slice(0, 10), error: null };
      return { value: null, error: 'Could not parse date "' + str + '"' };
    }
    default:
      return { value: str, error: null };
  }
}

const SCHEMA_LABELS_BY_LENGTH = Object.keys(SCHEMA)
  .sort((a, b) => b.length - a.length)
  .map(k => ({ norm: k, schema: SCHEMA[k] }));

function matchLabelPrefix(line) {
  const normalized = normalizeLabel(line);
  for (const entry of SCHEMA_LABELS_BY_LENGTH) {
    if (normalized === entry.norm) {
      return { matchedLabel: entry.norm, valueText: '', schema: entry.schema };
    }
    if (normalized.startsWith(entry.norm)) {
      let prefixLen = 0;
      for (let i = 1; i <= line.length; i++) {
        const np = normalizeLabel(line.slice(0, i));
        if (np === entry.norm) { prefixLen = i; break; }
        if (np.length > entry.norm.length) break;
      }
      if (prefixLen > 0) {
        return { matchedLabel: entry.norm, valueText: line.slice(prefixLen).trim(), schema: entry.schema };
      }
    }
  }
  return null;
}

function parseExportTab(text) {
  const lines = String(text).split(/\r?\n/);
  const results = {};
  const errors = [];
  const matchedLabels = new Set();
  const notes = [];
  let currentNote = null;

  const hasTabs = String(text).includes('\t');
  const parseMode = hasTabs ? 'tab' : 'prefix';

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    let colA, colB, colC;

    if (parseMode === 'tab') {
      const cols = line.split('\t');
      colA = (cols[0] || '').trim();
      colB = (cols[1] || '').trim();
      colC = (cols[2] || '').trim();
    } else {
      if (line.trim() === '') {
        colA = ''; colB = ''; colC = '';
      } else {
        const m = matchLabelPrefix(line.trim());
        if (m) {
          let originalLabel = '';
          const trimmed = line.trim();
          for (let i = 1; i <= trimmed.length; i++) {
            if (normalizeLabel(trimmed.slice(0, i)) === m.matchedLabel) { originalLabel = trimmed.slice(0, i); break; }
          }
          colA = originalLabel || m.matchedLabel;
          colB = m.valueText;
          colC = '';
        } else {
          colA = ''; colB = line.trim(); colC = '';
        }
      }
    }

    // Notes section: column A empty, B and/or C populated
    if (colA === '' && (colB !== '' || colC !== '')) {
      if (colB !== '' && colC === '') {
        currentNote = { text: colB, continuations: [] };
        notes.push(currentNote);
      } else if (colB === '' && colC !== '') {
        if (currentNote) {
          currentNote.continuations.push(colC);
        } else {
          errors.push({ label: 'Notes (line ' + (lineIdx + 1) + ')', msg: 'Continuation has no parent note above it', raw: colC, severity: 'warn' });
        }
      } else if (colB !== '' && colC !== '') {
        currentNote = { text: colB, continuations: [colC] };
        notes.push(currentNote);
      }
      continue;
    }

    if (colA === '' && colB === '' && colC === '') {
      currentNote = null;
      continue;
    }

    const normLabel = normalizeLabel(colA);
    const schemaEntry = SCHEMA[normLabel];
    if (!schemaEntry) {
      errors.push({ label: colA, msg: 'Unknown label (will be ignored)', raw: colB, severity: 'warn' });
      continue;
    }
    matchedLabels.add(normLabel);
    const parsed = parseValue(colB, schemaEntry.fmt, schemaEntry.enum);
    if (parsed.error) {
      errors.push({ label: colA, msg: parsed.error, raw: colB, severity: 'err' });
      continue;
    }
    if (parsed.value === null && schemaEntry.required) {
      errors.push({ label: colA, msg: 'Required field is empty', raw: '(blank)', severity: 'err' });
      continue;
    }
    results[schemaEntry.key] = { value: parsed.value, raw: colB, label: colA };
  }

  for (const [normLabel, entry] of Object.entries(SCHEMA)) {
    if (entry.required && !matchedLabels.has(normLabel)) {
      errors.push({ label: normLabel, msg: 'Required label not found in pasted content', raw: '', severity: 'err' });
    }
  }

  return { results, errors, notes, parseMode };
}

/** True when the parse has no error-severity entries. */
function isValid(parsed) {
  return !parsed.errors.some(e => e.severity === 'err');
}

/**
 * Slug from property name + city, e.g. "arc-apartment-homes-great-falls".
 * Conflict suffixing (-a, -b) is the storage layer's job; this is the base.
 */
function slugify() {
  const parts = Array.from(arguments).filter(Boolean).join(' ');
  return parts
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

module.exports = {
  SCHEMA,
  normalizeLabel,
  parseNumberLoose,
  parseValue,
  matchLabelPrefix,
  parseExportTab,
  isValid,
  slugify
};
