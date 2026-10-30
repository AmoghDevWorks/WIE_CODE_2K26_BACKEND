import { getRegistrationsViaAppsScript } from "../services/appsScriptService.js";

/**
 * Controller to fetch registrations from Google Sheet via Apps Script
 * Query params:
 *   ?domain=Open Innovation (optional)
 *   ?sheetId=... or ?spreadsheetId=... (optional, falls back to SPREADSHEET_ID from .env)
 */
export async function getRegistrationsHandler(req, res) {
    try {
        const domain = req.query.domain || null;
        const sheetId = req.query.sheetId || req.query.spreadsheetId || process.env.SPREADSHEET_ID;

        if (!sheetId) {
            return res.status(400).json({
                success: false,
                error: "Spreadsheet ID is missing. Please provide sheetId query param or configure SPREADSHEET_ID in .env."
            });
        }

        const appsScriptData = await getRegistrationsViaAppsScript(domain, sheetId);
        if (appsScriptData && appsScriptData.success) {
            // Strip out Google Drive and file links from registration objects
            const sanitizedRegistrations = Array.isArray(appsScriptData.registrations)
                ? appsScriptData.registrations.map((row) => {
                    const sanitized = { ...row };
                    Object.keys(sanitized).forEach((key) => {
                        if (/drive|folder.*link|file.*link|abstract.*link/i.test(key)) {
                            delete sanitized[key];
                        }
                    });
                    return sanitized;
                })
                : appsScriptData.registrations;

            return res.json({
                ...appsScriptData,
                registrations: sanitizedRegistrations
            });
        }

        return res.status(500).json({
            success: false,
            error: appsScriptData?.error || "Failed to retrieve registrations from Google Sheet via Apps Script."
        });
    } catch (error) {
        console.error("Error in getRegistrationsHandler:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

