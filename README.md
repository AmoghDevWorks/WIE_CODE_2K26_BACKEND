# WIE CODE 2K26 - Backend API

A high-performance Node.js & Express REST API for **WIE CODE 2K26** hackathon team registrations. The backend processes team registration submissions, enforces diversity and eligibility rules, receives PDF project abstracts in memory without local disk overhead, and integrates directly with Google Drive and Google Sheets through Google Apps Script.

---

## 🌟 Key Features

- **Google Workspace Cloud Integration**:
  - Automatically creates domain-specific folders and uploads team abstract PDFs to Google Drive.
  - Appends submission details simultaneously to both the Master Google Sheet and dedicated domain tabs.
- **In-Memory File Processing**:
  - Abstracts are handled entirely in RAM via Multer (`memoryStorage`), keeping the server lightweight, stateless, and cloud-ready with zero local file cleanup required.
  - Strict file-type filtering (PDF only) and 2 MB file-size limits.
- **Hackathon Diversity & Eligibility Validation**:
  - **Leader Requirement**: Participant 1 (Team Leader) **must** be female.
  - **Diversity Quota**: Teams of 3 require at least 1 female; teams of 2 or 4 require at least 2 females.
  - **Team Constraints**: 2 to 4 members per team.
  - **Data Hygiene**: Sanitization, USN format validation (`^[A-Za-z0-9]{5,15}$`), email format verification, and intra-team duplicate detection for USNs and email addresses.
- **Registrations Retrieval**:
  - Query endpoint to fetch submissions from Google Sheets with optional domain filtering (`?domain=...`).
- **Developer-Friendly**:
  - Native ES Modules (`"type": "module"`).
  - CORS pre-configured for modern single-page frontend applications (e.g., Vite/React).
  - Centralized error handling and structured JSON responses.

---

## 📂 Project Structure

```text
WIE_CODE_2K26_BACKEND/
├── controllers/
│   ├── registrationController.js  # Team registration & validation logic
│   └── sheetsController.js        # Sheets read/query logic
├── middlewares/
│   └── uploadMiddleware.js        # Multer in-memory PDF upload validator
├── routes/
│   ├── registrationRoutes.js      # /api/register route definition
│   └── sheetsRoutes.js            # /api/sheets route definition
├── services/
│   └── appsScriptService.js       # Webhook communication with Google Apps Script
├── .env                           # Local environment variables (git-ignored)
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies and npm scripts
├── server.js                      # Application entry point
└── README.md                      # Documentation
```

---

## 📋 Prerequisites

- **Node.js**: `v18.x` or higher (compatible with Node 20+ / 22+)
- **npm**: `v9.x` or higher
- **Google Account**:
  - A Google Spreadsheet for storing registration entries.
  - A Google Drive folder to store uploaded team abstract PDFs.
  - A deployed Google Apps Script Web App acting as the integration webhook.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AmoghDevWorks/WIE_CODE_2K26_BACKEND.git
cd WIE_CODE_2K26_BACKEND
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Duplicate the `.env.example` file to create `.env`:

```bash
cp .env.example .env
```

Update the values in `.env`:

```ini
PORT=3000
SPREADSHEET_ID=your_google_spreadsheet_id_here
DRIVE_FOLDER_ID=your_google_drive_folder_id_here
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your_deployment_id/exec
```

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `PORT` | Local port for Express server | `3000` (defaults to 3000 if omitted) |
| `SPREADSHEET_ID` | Google Sheet ID from sheet URL | `1DlkrY0mpj9i_m1ot...` |
| `DRIVE_FOLDER_ID` | Parent Google Drive Folder ID | `1DfDjP_9wcmk8...` |
| `GOOGLE_APPS_SCRIPT_URL` | Deployed Apps Script Web App URL | Must end with `/exec` |

> [!NOTE]
> Make sure your Google Apps Script deployment is configured with:
> - **Execute as**: *Me*
> - **Who has access**: *Anyone*

### 4. Run the Application

#### Development Mode (with hot-reload via nodemon):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The server will be running at `http://localhost:3000`.

---

## 🛡️ Hackathon Validation Rules

Every registration payload is validated before forwarding to Google Apps Script:

| Entity | Field | Rule / Constraint |
| :--- | :--- | :--- |
| **Team** | `name` | Required, string, minimum 2 characters |
| | `college` | Required, string, minimum 3 characters |
| | `domain` | Required, non-empty string |
| | `size` | Required, integer: `2`, `3`, or `4` |
| **Members** | Count | Must equal `team.size` (2, 3, or 4 members) |
| | **Leader** (Participant 1) | **Must be Female** (`gender: "Female"`) |
| | **Female Ratio** | Team size 3: minimum **1** female<br>Team size 2 or 4: minimum **2** females |
| | `name` | Required, minimum 2 characters |
| | `usn` | Required, alphanumeric, 5–15 characters (`^[A-Za-z0-9]{5,15}$`) |
| | `email` | Required, valid email format |
| | `year` | Required academic year |
| | `gender` | Required ("Female" / "Male" / etc.) |
| | Uniqueness | No duplicate USNs or email addresses allowed within the team |
| **Abstract** | `abstract` | Required file, MIME type `application/pdf`, max size **2 MB** |

---

## 📡 API Reference

### 1. Health Check
Returns API status and available endpoints.

- **Method**: `GET`
- **URL**: `/`
- **Response**:
```json
{
  "status": "online",
  "service": "WIE CODE 2K26 Backend API",
  "version": "2.0.0 (Google Apps Script Powered)",
  "endpoints": {
    "register": "POST /api/register",
    "sheets": "GET /api/sheets"
  }
}
```

---

### 2. Team Registration
Submits team registration details along with the project abstract PDF.

- **Method**: `POST`
- **URL**: `/api/register`
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `team` *(text / JSON string)*: Object containing team metadata.
  - `members` *(text / JSON string)*: Array of participant objects.
  - `abstract` *(file)*: The PDF abstract document (max 2 MB).

#### Example cURL Request:
```bash
curl -X POST http://localhost:3000/api/register \
  -F 'team={"name":"ByteBuilders","college":"BMSCE","domain":"Open Innovation","size":3}' \
  -F 'members=[
    {"name":"Alice Sharma","usn":"1BM21CS001","email":"alice@example.com","year":"3rd Year","gender":"Female"},
    {"name":"Bob Kumar","usn":"1BM21CS002","email":"bob@example.com","year":"3rd Year","gender":"Male"},
    {"name":"Charlie Roy","usn":"1BM21CS003","email":"charlie@example.com","year":"3rd Year","gender":"Male"}
  ]' \
  -F 'abstract=@/path/to/abstract.pdf'
```

#### Success Response (`201 Created`):
```json
{
  "success": true,
  "message": "Team successfully registered!",
  "team": {
    "name": "ByteBuilders",
    "college": "BMSCE",
    "domain": "Open Innovation",
    "size": 3
  },
  "members": [
    {
      "name": "Alice Sharma",
      "usn": "1BM21CS001",
      "email": "alice@example.com",
      "year": "3rd Year",
      "gender": "Female"
    },
    {
      "name": "Bob Kumar",
      "usn": "1BM21CS002",
      "email": "bob@example.com",
      "year": "3rd Year",
      "gender": "Male"
    },
    {
      "name": "Charlie Roy",
      "usn": "1BM21CS003",
      "email": "charlie@example.com",
      "year": "3rd Year",
      "gender": "Male"
    }
  ],
  "abstract": {
    "fileName": "ByteBuilders_Abstract.pdf"
  },
  "rowNumber": 12
}
```

#### Validation Error Response (`400 Bad Request`):
```json
{
  "success": false,
  "errors": [
    "The team leader (Participant 1) must be female.",
    "Your team requires at least 2 female participant(s). Found 1."
  ],
  "error": "The team leader (Participant 1) must be female."
}
```

---

### 3. Fetch Registrations
Retrieves all team registrations from the Google Sheet via Google Apps Script (Drive and abstract links are omitted for privacy).

- **Method**: `GET`
- **URL**: `/api/sheets`
- **Query Parameters**:
  - `domain` *(optional, string)*: Filter submissions by track/domain (e.g., `?domain=Open Innovation`).
  - `sheetId` or `spreadsheetId` *(optional, string)*: Target Google Spreadsheet ID (defaults to `SPREADSHEET_ID` from `.env`).

#### Example Request:
```bash
curl "http://localhost:3000/api/sheets?domain=Open%20Innovation"
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "count": 5,
  "registrations": [
    {
      "teamName": "ByteBuilders",
      "college": "BMSCE",
      "domain": "Open Innovation",
      "leaderName": "Alice Sharma",
      "leaderEmail": "alice@example.com",
      "leaderUsn": "1BM21CS001",
      "abstractFileName": "ByteBuilders_Abstract.pdf"
    }
  ]
}
```

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/) (v5)
- **File Uploads**: [Multer](https://github.com/expressjs/multer) (In-memory storage)
- **CORS Support**: [cors](https://github.com/expressjs/cors)
- **Environment Management**: [dotenv](https://github.com/motdotla/dotenv)
- **Cloud Database & Storage**: Google Drive API & Google Sheets via Google Apps Script

---

## 📄 License

This project is licensed under the ISC License. See [package.json](package.json) for details.
