# ClientFlow CRM - Contact Lead & Pipeline Manager

**Live Demo:** [https://clientflow-0j32.onrender.com](https://clientflow-0j32.onrender.com)

ClientFlow is a sleek, premium, high-fidelity CRM system built with React, Node.js/Express, and Sequelize. It is designed to manage, log, and transition client leads generated automatically from external website contact forms.

---

## Key Features

1. **Analytical Dashboard Center**: Instant summaries of pipeline health (Active Pipeline Value, Conversion Close Ratios, and Acquisition Source statistics). Includes visual radial progress dials and responsive progress bars.
2. **Dynamic Sales Kanban Board**: High-fidelity drag-like status boards. Toggles and advances lead deals between stages (`New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`) with automated status-change logging.
3. **Robust Registry Directory**: Advanced searchable listings. Sorts, queries, and filters client folders based on dates, values, and status tags. Includes manual lead creation.
4. **Chronological Timeline & Notes**: Keeps detailed customer sheets with deep note logging. Tracks historical updates (e.g. status changes and budget values) alongside custom administrator reviews.
5. **Contact Form Webhook Simulator**: Renders a simulated contact browser portal to test live database submissions.
6. **Plug-and-Play Embed snippet**: Generates customized HTML/CSS form layouts with pre-configured ingestion scripts. You can copy-paste this block into any website on the internet to stream real client inquiries directly into this CRM.
7. **Bespoke Obsidian Design Token Palette**: Tailored geometric slates, smooth theme toggling, custom scrollbars, glassmorphic filters, and fluid CSS hover micro-animations.

---

## Technical Stack & Architecture

- **Frontend**: React.js SPA initialized using Vite (Port `5173`)
- **Styling**: Tailored, high-performance Vanilla CSS with design token variables (no heavy framework overrides)
- **Backend**: Node.js & Express API Server (Port `5000`)
- **Database ORM**: Sequelize ORM
- **Database Engine**: Supporting dual database models:
  - **SQLite** (Default): Stores records in a zero-configuration local file (`backend/database.sqlite`). Launches instantly without installing database systems.
  - **MySQL**: Supported by updating the `backend/.env` configuration.

---

## Quick Start Setup

Ensure you have **Node.js** (v18+) and **npm** installed on your system.

### 1. Install Dependencies
Run the master installer from the root directory to fetch packages for the root runner, Express backend, and React frontend simultaneously:
```bash
npm run install-all
```

### 2. Run in Development Mode
Start both the Express API server and the Vite React server concurrently with a single command:
```bash
npm run dev
```

The system orchestrator will print active links:
- **CRM Dashboard App**: [http://localhost:5173](http://localhost:5173)
- **Express Backend API**: [http://localhost:5000](http://localhost:5000)
- **Public Ingestion Webhook**: `http://localhost:5000/api/leads/webhook`

---

## Database Configuration (SQLite vs MySQL)

The server checks `backend/.env` for environment parameters. By default, it is configured for SQLite:
```env
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
```

### Switching to MySQL
To use an active MySQL database instead:
1. Ensure your local or remote MySQL service is running.
2. Edit `backend/.env` as follows:
   ```env
   DB_DIALECT=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=client_crm
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   ```
3. Boot the server (`npm run dev`). Sequelize will automatically create the database tables (`Leads` and `Notes`) upon startup.

---

## Core API Endpoints Reference

### Public Webhook (Form Ingestion)
- **Endpoint**: `POST /api/leads/webhook`
- **Access**: Permitted cross-origin (CORS `*`)
- **JSON Payload Format**:
  ```json
  {
    "name": "Bruce Wayne",
    "email": "bruce@waynecorp.com",
    "phone": "+1 (555) 900-8000",
    "company": "Wayne Enterprises",
    "message": "Interested in building a custom batcave security system dashboard.",
    "source": "Website Contact Page"
  }
  ```

### Internal CRM Operations
- `GET /api/dashboard/stats`: Aggregates active pipeline values, conversion scores, stage listings, and recent submissions.
- `GET /api/leads`: Fetches all leads (supports query strings `search`, `status`, `source`, `sortBy`, and `order`).
- `GET /api/leads/:id`: Returns full details and chronological note timelines for a single client folder.
- `POST /api/leads`: Manually registers a new lead in the registry directory.
- `PUT /api/leads/:id`: Updates lead attributes. Modifying `status` or `value` automatically appends a system log note.
- `DELETE /api/leads/:id`: Permanently archives/deletes a client lead (cascades and purges associated notes).
- `POST /api/leads/:id/notes`: Appends a detailed note or review onto a client timeline.
- `DELETE /api/notes/:id`: Purges a specific manual comment.
- `POST /api/leads/seed`: Triggers database seeder populating beautiful initial data (skipped if data already exists).

---

## Client Integration Instructions

To ingest website contact submissions instantly into this CRM:
1. Copy the customized form layout found inside the **Form Simulator** panel of the ClientFlow UI.
2. Place the block inside any webpage's `<body>`.
3. Keep the Express server running on port `5000`. 
4. The form will intercept submits, POST the payload directly to the webhook, display a success alert to the visitor, and immediately pop the lead into your CRM dashboard with zero page reloads!
