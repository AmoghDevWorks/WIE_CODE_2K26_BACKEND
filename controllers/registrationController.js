import { submitRegistrationViaAppsScript } from "../services/appsScriptService.js";

/**
 * Validates registration data matching frontend rules
 */
function validateRegistration(team, members, file) {
    const errors = [];

    // Team checks
    if (!team || typeof team !== "object") {
        errors.push("Invalid team data.");
    } else {
        if (!team.name || team.name.trim().length < 2) errors.push("Team name must have at least 2 characters.");
        if (!team.college || team.college.trim().length < 3) errors.push("College name must have at least 3 characters.");
        if (!team.domain || team.domain.trim().length === 0) errors.push("Domain must be selected.");
        const sizeNum = Number(team.size);
        if (![2, 3, 4].includes(sizeNum)) errors.push("Team size must be 2, 3, or 4.");
    }

    // Members checks
    if (!Array.isArray(members) || members.length < 2 || members.length > 4) {
        errors.push("Members list must have between 2 and 4 participants.");
    } else {
        const teamSize = Number(team?.size) || members.length;
        if (members.length !== teamSize) {
            errors.push(`Team size is set to ${teamSize}, but ${members.length} members were provided.`);
        }

        // Leader check
        const leader = members[0];
        if (!leader || leader.gender !== "Female") {
            errors.push("The team leader (Participant 1) must be female.");
        }

        // Required female participants rule
        const femaleCount = members.filter((m) => m.gender === "Female").length;
        const requiredFemales = members.length === 3 ? 1 : 2;
        if (femaleCount < requiredFemales) {
            errors.push(`Your team requires at least ${requiredFemales} female participant(s). Found ${femaleCount}.`);
        }

        // Field checks & duplicate detection
        const usns = new Set();
        const emails = new Set();

        members.forEach((m, idx) => {
            const prefix = `Participant ${idx + 1}`;
            if (!m.name || m.name.trim().length < 2) errors.push(`${prefix}: Name must have at least 2 characters.`);
            if (!m.usn || !/^[A-Za-z0-9]{5,15}$/.test(m.usn.trim())) errors.push(`${prefix}: Enter a valid USN (5-15 characters).`);
            if (!m.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) errors.push(`${prefix}: Enter a valid email.`);
            if (!m.year) errors.push(`${prefix}: Select an academic year.`);
            if (!m.gender) errors.push(`${prefix}: Select gender.`);

            const usnLower = (m.usn || "").trim().toLowerCase();
            const emailLower = (m.email || "").trim().toLowerCase();

            if (usns.has(usnLower)) errors.push(`Duplicate USN detected in team: ${m.usn}`);
            if (emails.has(emailLower)) errors.push(`Duplicate email detected in team: ${m.email}`);

            if (usnLower) usns.add(usnLower);
            if (emailLower) emails.add(emailLower);
        });
    }

    // Abstract file check
    if (!file) {
        errors.push("Abstract file is required (PDF, up to 2 MB).");
    }

    return errors;
}

/**
 * Handles team registration via Google Apps Script (Drive folder + PDF upload + Sheet row)
 */
export async function registerTeamHandler(req, res) {
    try {
        let team = req.body?.team;
        let members = req.body?.members;

        if (typeof team === "string") {
            try {
                team = JSON.parse(team);
            } catch {
                return res.status(400).json({ success: false, error: "Malformed team JSON." });
            }
        }

        if (typeof members === "string") {
            try {
                members = JSON.parse(members);
            } catch {
                return res.status(400).json({ success: false, error: "Malformed members JSON." });
            }
        }

        const file = req.file;

        // Perform validation
        const validationErrors = validateRegistration(team, members, file);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: validationErrors,
                error: validationErrors[0]
            });
        }

        const cleanTeam = {
            name: team.name.trim(),
            college: team.college.trim(),
            domain: team.domain.trim(),
            size: Number(team.size)
        };

        const cleanMembers = members.map((m) => ({
            name: m.name.trim(),
            usn: m.usn.trim().toUpperCase(),
            email: m.email.trim().toLowerCase(),
            year: m.year,
            gender: m.gender
        }));

        // Submit to Google Apps Script (creates team folder, saves PDF in Drive, and appends to Sheet)
        const appsScriptResult = await submitRegistrationViaAppsScript({
            team: cleanTeam,
            members: cleanMembers,
            file
        });

        if (!appsScriptResult || !appsScriptResult.success) {
            throw new Error(appsScriptResult?.error || "Google Apps Script registration failed.");
        }

        return res.status(201).json({
            success: true,
            message: "Team successfully registered!",
            team: cleanTeam,
            members: cleanMembers,
            abstract: {
                fileName: `${cleanTeam.name}_Abstract.pdf`
            },
            rowNumber: appsScriptResult.rowNumber
        });
    } catch (error) {
        console.error("Critical error in registerTeamHandler:", error);
        return res.status(500).json({
            success: false,
            error: "An internal server error occurred while processing the registration.",
            details: error.message
        });
    }
}
