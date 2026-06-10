CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  pipeline_status TEXT NOT NULL DEFAULT 'prospect',
  vertical TEXT,
  channel TEXT,
  starred INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  first_contact TEXT,
  last_action TEXT,
  next_action TEXT,
  next_action_note TEXT,
  contact_name TEXT,
  contact_role TEXT,
  linkedin_url TEXT,
  app_user_axis TEXT,
  about TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  location TEXT,
  salary_range TEXT,
  job_url TEXT,
  source TEXT,
  starred INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  applied_date TEXT,
  last_action TEXT,
  next_action TEXT,
  next_action_note TEXT,
  contact_name TEXT,
  contact_role TEXT,
  about TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT NOT NULL,
  subject_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  template_used TEXT,
  generator TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
