import dotenv from "dotenv";

dotenv.config();

/**
 * Sends team registration, member details, and abstract PDF buffer to Google Apps Script.
 * The script handles domain-separated folder creation, PDF upload, and writing to both
 * the Master Sheet and the Domain-Specific Sheet tab.
 */
export async function submitRegistrationViaAppsScript({ team, members, file }) {
    const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!webhookUrl) {
        return null;
    }

    const base64Data = file.buffer.toString("base64");

    const payload = {
        action: "submit",
        team,
        members,
        fileName: `${team.name}_Abstract.pdf`,
        mimeType: file.mimetype || "application/pdf",
        base64: base64Data,
        folderId: process.env.DRIVE_FOLDER_ID,
        spreadsheetId: process.env.SPREADSHEET_ID
    };

    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "follow",
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Google Apps Script responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Fetches registrations from Google Sheet via Google Apps Script.
 * Optionally filter by domain (e.g. ?domain=HealthCare)
 * Passes spreadsheetId and sheetId to Apps Script.
 */
export async function getRegistrationsViaAppsScript(domain = null, sheetId = null) {
    const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!webhookUrl) {
        return null;
    }

    const targetSheetId = sheetId || process.env.SPREADSHEET_ID;

    const queryParams = new URLSearchParams({ action: "getRegistrations" });
    if (targetSheetId) {
        queryParams.set("spreadsheetId", targetSheetId);
        queryParams.set("sheetId", targetSheetId);
    }
    if (domain) {
        queryParams.set("domain", domain);
    }

    const response = await fetch(`${webhookUrl}?${queryParams.toString()}`, {
        method: "GET",
        redirect: "follow"
    });

    if (!response.ok) {
        throw new Error(`Google Apps Script responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
}

