/**
 * FS Business Forum — Ticket Notify List
 * Google Apps Script Web App: receives the tickets.html form and
 * appends each signup to the bound Google Sheet.
 *
 * Deployment: see SETUP-NOTIFY-FORM.md (5 minutes).
 */

var SHEET_NAME = 'Notify List';
var HEADERS = ['Timestamp', 'First Name', 'Last Name', 'Email', 'Consent', 'Source'];
var MAX_LEN = { firstName: 60, lastName: 60, email: 120 };
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // Honeypot: bots that POST directly still fill "company"
    if (p.company) return jsonOut({ ok: true });

    var firstName = clean(p.firstName, MAX_LEN.firstName);
    var lastName = clean(p.lastName, MAX_LEN.lastName);
    var email = clean(p.email, MAX_LEN.email).toLowerCase();
    var consent = p.consent === 'yes';
    var source = clean(p.source, 40) || 'unknown';

    if (!firstName || !lastName || !email || !consent) {
      return jsonOut({ ok: false, error: 'missing_fields' });
    }
    if (!EMAIL_RE.test(email)) {
      return jsonOut({ ok: false, error: 'invalid_email' });
    }

    // Rate limit: max 1 submission per email per 10 minutes (abuse protection)
    var cache = CacheService.getScriptCache();
    var cacheKey = 'nf_' + email;
    if (cache.get(cacheKey)) {
      return jsonOut({ ok: true, note: 'rate_limited' });
    }
    cache.put(cacheKey, '1', 600);

    // Serialize concurrent writes
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = getSheet();

      // Dedupe by email (column D)
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var emails = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
        for (var i = 0; i < emails.length; i++) {
          if (String(emails[i][0]).toLowerCase() === email) {
            return jsonOut({ ok: true, note: 'already_subscribed' });
          }
        }
      }

      sheet.appendRow([new Date(), firstName, lastName, email, 'yes', source]);
    } finally {
      lock.releaseLock();
    }

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: 'server_error' });
  }
}

/** Health check: open the Web App URL in a browser to verify deployment. */
function doGet() {
  return jsonOut({ ok: true, service: 'FSBF Ticket Notify List', time: new Date().toISOString() });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function clean(value, maxLen) {
  if (!value) return '';
  return String(value).replace(/[\r\n\t]/g, ' ').trim().slice(0, maxLen);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * OPTIONAL: send the launch email to everyone on the list.
 * Run manually from the Apps Script editor when tickets go live.
 * Note Gmail quotas: ~100 recipients/day (free accounts),
 * ~1500/day (Google Workspace). For larger lists export the sheet
 * as CSV and use a proper email tool (e.g. Brevo/Mailchimp).
 */
function sendLaunchEmails() {
  var SUBJECT = 'FS Business Forum 2026 — Ticket sales are open!';
  var BODY_TEMPLATE = 'Hi {firstName},\n\n' +
    'Ticket sales for the FS Business Forum on 13 & 14 November 2026 just opened.\n' +
    'Secure your seat here: https://fs-businessforum.com/tickets.html\n\n' +
    'See you in Frankfurt!\nFS Business Forum Team';

  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var quota = MailApp.getRemainingDailyQuota();
  var sent = 0;

  for (var i = 0; i < rows.length && sent < quota; i++) {
    var firstName = rows[i][1];
    var email = rows[i][3];
    if (!email) continue;
    MailApp.sendEmail(email, SUBJECT, BODY_TEMPLATE.replace('{firstName}', firstName));
    sent++;
  }
  Logger.log('Sent ' + sent + ' emails.');
}
