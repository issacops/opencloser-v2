use log::info;
use rusqlite::Connection;
use std::fs;
use tauri::{AppHandle, Manager};

pub fn init(app_handle: &AppHandle) {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
    }

    let db_path = app_dir.join("opencloser.db");
    let conn = Connection::open(&db_path).expect("Failed to open SQLite database");

    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = 5000;
        ",
    )
    .expect("Failed to set pragmas");

    // Initialize Schema
    create_schema(&conn);

    // Run migrations for existing databases
    run_migrations(&conn);

    // Seed data if empty
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM leads", [], |row| row.get(0))
        .unwrap_or(0);

    if count == 0 {
        seed_data(&conn);
    } else {
        info!("Database already seeded with {} leads.", count);
    }
}

pub(crate) fn create_schema(conn: &Connection) {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS leads (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            company TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT DEFAULT '',
            title TEXT DEFAULT '',
            linkedin_url TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            industry TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Discovery',
            score INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS call_logs (
            id TEXT PRIMARY KEY,
            lead_id TEXT NOT NULL,
            provider TEXT DEFAULT 'gemini',
            duration_seconds INTEGER DEFAULT 0,
            transcript TEXT DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'pending',
            sentiment TEXT DEFAULT 'Neutral',
            objections_handled TEXT DEFAULT '[]',
            emotion_log TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS campaigns (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            query TEXT DEFAULT '',
            location TEXT DEFAULT '',
            target_criteria TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'active',
            leads_found INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lead_notes (
            id TEXT PRIMARY KEY,
            lead_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            lead_id TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT DEFAULT '',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            duration INTEGER DEFAULT 0,
            FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
        CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
        CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
        ",
    )
    .expect("Failed to create database schema");
}

fn run_migrations(conn: &Connection) {
    let safe_alter = |sql: &str| {
        let _ = conn.execute(sql, []);
    };

    // V1 → V2: Add enriched lead columns
    safe_alter("ALTER TABLE leads ADD COLUMN email TEXT DEFAULT ''");
    safe_alter("ALTER TABLE leads ADD COLUMN title TEXT DEFAULT ''");
    safe_alter("ALTER TABLE leads ADD COLUMN linkedin_url TEXT DEFAULT ''");
    safe_alter("ALTER TABLE leads ADD COLUMN notes TEXT DEFAULT ''");
    safe_alter("ALTER TABLE leads ADD COLUMN industry TEXT DEFAULT ''");

    // V2 → V3: Add call log enrichment columns
    safe_alter("ALTER TABLE call_logs ADD COLUMN provider TEXT DEFAULT 'gemini'");
    safe_alter("ALTER TABLE call_logs ADD COLUMN sentiment TEXT DEFAULT 'Neutral'");
    safe_alter("ALTER TABLE call_logs ADD COLUMN objections_handled TEXT DEFAULT '[]'");
    safe_alter("ALTER TABLE call_logs ADD COLUMN emotion_log TEXT DEFAULT '[]'");

    // V3 → V4: Add campaign enrichment columns
    safe_alter("ALTER TABLE campaigns ADD COLUMN query TEXT DEFAULT ''");
    safe_alter("ALTER TABLE campaigns ADD COLUMN location TEXT DEFAULT ''");
    safe_alter("ALTER TABLE campaigns ADD COLUMN leads_found INTEGER DEFAULT 0");

    info!("Database migrations completed successfully.");
}

fn seed_data(conn: &Connection) {
    info!("Seeding initial demo data...");

    // Seed 10 leads with realistic data
    #[allow(clippy::type_complexity)]
    const SEED_LEADS: &[(&str, &str, &str, &str, &str, &str, &str, &str, i32)] = &[
        (
            "lead_1",
            "Sarah Jenkins",
            "Acme Heavy Industries",
            "+1 (512) 555-0101",
            "sarah@acmeheavy.com",
            "VP of Operations",
            "Construction & Engineering",
            "Discovery",
            85,
        ),
        (
            "lead_2",
            "Marcus Chen",
            "TechBridge Infrastructure",
            "+1 (415) 555-0102",
            "m.chen@techbridge.io",
            "CTO",
            "Technology",
            "Discovery",
            92,
        ),
        (
            "lead_3",
            "Elena Rodriguez",
            "Global Logistics Partners",
            "+1 (713) 555-0103",
            "erodriguez@globalogistics.com",
            "Director of Procurement",
            "Logistics",
            "Outbound Call",
            78,
        ),
        (
            "lead_4",
            "David Kim",
            "Apex Financial Services",
            "+1 (212) 555-0104",
            "dkim@apexfin.com",
            "CEO",
            "Financial Services",
            "Audit Requested",
            95,
        ),
        (
            "lead_5",
            "Rachel Torres",
            "MetroBuild Contractors",
            "+1 (512) 555-0105",
            "rtorres@metrobuild.com",
            "Director of Risk Management",
            "Construction",
            "Discovery",
            88,
        ),
        (
            "lead_6",
            "James O'Brien",
            "Pacific Trade Group",
            "+1 (503) 555-0106",
            "jobrien@pacifictrade.com",
            "VP of Supply Chain",
            "Import/Export",
            "Outbound Call",
            82,
        ),
        (
            "lead_7",
            "Priya Sharma",
            "NovaTech Solutions",
            "+1 (650) 555-0107",
            "psharma@novatech.io",
            "Head of Engineering",
            "Technology",
            "Audit Requested",
            91,
        ),
        (
            "lead_8",
            "Michael Chang",
            "East-West Manufacturing",
            "+1 (626) 555-0108",
            "mchang@eastwestmfg.com",
            "COO",
            "Manufacturing",
            "Discovery",
            76,
        ),
        (
            "lead_9",
            "Alex Thompson",
            "Standard Industrial Corp",
            "+1 (312) 555-0109",
            "athompson@standardindustrial.com",
            "CEO",
            "Industrial",
            "Closed",
            98,
        ),
        (
            "lead_10",
            "Lisa Park",
            "Summit Risk Advisors",
            "+1 (720) 555-0110",
            "lpark@summitrisk.com",
            "VP of Business Development",
            "Insurance",
            "Outbound Call",
            84,
        ),
    ];

    for (id, name, company, phone, email, title, industry, status, score) in SEED_LEADS {
        conn.execute(
            "INSERT INTO leads (id, name, company, phone, email, title, industry, status, score) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![id, name, company, phone, email, title, industry, status, score],
        )
        .expect("Failed to seed lead");
    }

    // Seed 3 call logs with realistic demo transcripts
    let call_1_transcript = serde_json::to_string(&serde_json::json!([
        {"role": "model", "text": "Hi David! This is the OpenCloser AI calling. I noticed Apex Financial is expanding their wealth management division — how are things going on that front?"},
        {"role": "user", "text": "We're growing fast, actually. But our current lead qualification process is completely manual. Takes forever."},
        {"role": "model", "text": "That's exactly the kind of friction we eliminate. If I could show you how to automatically qualify and score leads using AI — without hiring more SDRs — would that be worth 15 minutes?"},
        {"role": "user", "text": "Honestly, if you can cut our qualification time in half, I'm interested. What's the catch?"},
        {"role": "model", "text": "No catch — just results. We typically see a 3x improvement in qualified meetings within 30 days. Can I send you a calendar invite for next Tuesday to walk through a demo?"},
        {"role": "user", "text": "Tuesday works. Send it over and I'll take a look."},
        {"role": "model", "text": "Perfect. I'll send that right now. Thanks for your time, David — really looking forward to showing you what we can do."}
    ])).unwrap();

    let call_2_transcript = serde_json::to_string(&serde_json::json!([
        {"role": "model", "text": "Hi, this is OpenCloser AI calling for Elena Rodriguez at Global Logistics Partners."},
        {"role": "model", "text": "I'll try reaching out again next week. Have a great day."}
    ])).unwrap();

    let call_3_transcript = serde_json::to_string(&serde_json::json!([
        {"role": "model", "text": "Hi Alex! Great to connect — our team mentioned you were interested in scaling your outbound without adding headcount."},
        {"role": "user", "text": "That's right. We've got a team of 12 SDRs and each one can only make about 40 calls a day. The math isn't working anymore."},
        {"role": "model", "text": "Forty calls per rep per day is tough. Most enterprise teams we work with were in the same spot — until we helped them flip the model. Our AI handles the first 1,000 dials, qualifies every lead, and only hands over the meetings your team actually wants."},
        {"role": "user", "text": "Wait — 1,000 dials? How many meetings does that actually produce?"},
        {"role": "model", "text": "Consistently 15-25 qualified meetings per week per AI agent. And we deploy as many agents as you need, all running 24/7. Your SDRs only talk to real buyers."},
        {"role": "user", "text": "What's the integration look like with Salesforce? We're heavy Salesforce users."},
        {"role": "model", "text": "Native two-way sync. Leads, call recordings, transcripts, and disposition codes all flow automatically. Zero manual data entry."},
        {"role": "user", "text": "Alright — I'm impressed. Let's run a 30-day pilot. Can you get us set up by next Monday?"},
        {"role": "model", "text": "Absolutely. I'll have our implementation team reach out within the hour. Welcome aboard, Alex — this is going to be a game-changer for Standard Industrial."},
        {"role": "user", "text": "Looking forward to it. Thanks for the call."}
    ])).unwrap();

    let seed_calls: &[(&str, &str, i32, &str, &str)] = &[
        ("call_1", "lead_4", 512, &call_1_transcript, "Success"),
        ("call_2", "lead_3", 22, &call_2_transcript, "Voicemail"),
        ("call_3", "lead_9", 735, &call_3_transcript, "Success"),
    ];

    for (id, lead_id, duration, transcript, status) in seed_calls {
        conn.execute(
            "INSERT INTO call_logs (id, lead_id, duration_seconds, transcript, status) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, lead_id, duration, transcript, status],
        )
        .expect("Failed to seed call log");
    }

    // Seed sample notes for David Kim (lead_4) — the one with a call history
    conn.execute(
        "INSERT INTO lead_notes (id, lead_id, content) VALUES (?1, ?2, ?3)",
        rusqlite::params![
            "note_1", "lead_4",
            "David expressed strong interest in AI-powered lead qualification. He mentioned their current process is entirely manual and they're scaling fast. Follow-up demo scheduled for next Tuesday."
        ],
    ).ok();

    info!("Demo seed data complete: 10 leads, 3 call logs, 1 lead note.");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn memory_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .expect("pragma");
        create_schema(&conn);
        conn
    }

    #[test]
    fn schema_creates_all_tables_and_indexes() {
        let conn = memory_conn();
        let mut stmt = conn
            .prepare(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN \
                 ('leads', 'call_logs', 'campaigns', 'lead_notes', 'activities')",
            )
            .unwrap();
        let tables: Vec<String> = stmt
            .query_map([], |r| r.get(0))
            .unwrap()
            .collect::<rusqlite::Result<_>>()
            .unwrap();
        assert_eq!(tables.len(), 5);

        let mut stmt = conn
            .prepare(
                "SELECT name FROM sqlite_master WHERE type = 'index' AND name IN \
                 ('idx_call_logs_lead_id', 'idx_call_logs_created_at', \
                  'idx_lead_notes_lead_id', 'idx_activities_lead_id')",
            )
            .unwrap();
        let indexes: Vec<String> = stmt
            .query_map([], |r| r.get(0))
            .unwrap()
            .collect::<rusqlite::Result<_>>()
            .unwrap();
        assert_eq!(indexes.len(), 4);
    }

    #[test]
    fn schema_and_migrations_are_idempotent() {
        let conn = memory_conn();
        run_migrations(&conn);
        run_migrations(&conn);
        create_schema(&conn);
    }

    #[test]
    fn seed_fills_an_empty_database() {
        let conn = memory_conn();
        seed_data(&conn);
        let leads: i32 = conn
            .query_row("SELECT COUNT(*) FROM leads", [], |r| r.get(0))
            .unwrap();
        let calls: i32 = conn
            .query_row("SELECT COUNT(*) FROM call_logs", [], |r| r.get(0))
            .unwrap();
        assert_eq!(leads, 10);
        assert_eq!(calls, 3);
    }
}
