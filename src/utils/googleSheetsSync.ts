/**
 * Google Apps Script Integration Utility
 * Sends data from Earsound Care application to user's Google Sheets via Web App URL.
 */

const GAS_URL_KEY = 'earsound_gas_webapp_url';

export const getGoogleSheetsUrl = (): string => {
  return localStorage.getItem(GAS_URL_KEY) || '';
};

export const saveGoogleSheetsUrl = (url: string): void => {
  localStorage.setItem(GAS_URL_KEY, url.trim());
};

export interface SyncPayload {
  targetSheet: string;
  headers: string[];
  rowValues: (string | number)[];
}

/**
 * Send a single row or dataset to Google Apps Script
 */
export const sendToGoogleSheet = async (payload: SyncPayload): Promise<{ success: boolean; message?: string }> => {
  const url = getGoogleSheetsUrl();
  if (!url) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  try {
    // Standard Google Apps Script POST with mode: 'no-cors'
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });

    return { success: true, message: 'Data berhasil dikirim ke Google Sheets!' };
  } catch (error: any) {
    console.error('Error syncing to Google Sheets:', error);
    return { success: false, message: error?.message || 'Gagal terhubung ke Google Apps Script.' };
  }
};

/**
 * Standard Google Apps Script Code template for user to copy-paste
 */
export const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheetName = data.targetSheet || "Aksesoris";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    // Buat Sheet jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Jika Sheet masih kosong, tambahkan header kolom otomatis
    if (sheet.getLastRow() === 0 && data.headers && data.headers.length > 0) {
      sheet.appendRow(data.headers);
      
      // Styling Header (Bold + Warna Teal)
      var headerRange = sheet.getRange(1, 1, 1, data.headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0F766E");
      headerRange.setFontColor("#FFFFFF");
    }

    // Anti-Duplikat: Cek berdasarkan nilai di Kolom 1 (No. Kwitansi / No. Invoice / ID Pelanggan)
    if (data.rowValues && data.rowValues.length > 0) {
      var uniqueKey = String(data.rowValues[0] || "").trim();
      var lastRow = sheet.getLastRow();
      var isDuplicate = false;

      if (uniqueKey !== "" && lastRow > 1) {
        var existingKeys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < existingKeys.length; i++) {
          if (String(existingKeys[i][0]).trim().toLowerCase() === uniqueKey.toLowerCase()) {
            isDuplicate = true;
            break;
          }
        }
      }

      // Jika data belum ada, tambahkan baris baru. Jika sudah ada, lewati.
      if (!isDuplicate) {
        sheet.appendRow(data.rowValues);
      } else {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "skipped", message: "Data sudah ada (Duplikat dilewati): " + uniqueKey })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Data berhasil disimpan" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
