import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import './SettingsPage.css';

const CONFIG_FILES = [
  { key: 'printers', filename: 'config_printers.json', title: 'Printers' },
  { key: 'materials', filename: 'config_materials.json', title: 'Materials' },
  { key: 'infill', filename: 'config_infill.json', title: 'Infill' },
  { key: 'infill_type', filename: 'config_infill_type.json', title: 'Infill Type' },
  { key: 'statuses', filename: 'config_statuses.json', title: 'Statuses' }
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export default function SettingsPage() {
  const [raw, setRaw] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const byKey = useMemo(() => Object.fromEntries(CONFIG_FILES.map(c => [c.key, c])), []);

  useEffect(() => {
    (async () => {
      try {
        const entries = await Promise.all(
          CONFIG_FILES.map(async (c) => {
            const json = await fetchJson(`/config/${c.filename}`);
            return [c.key, JSON.stringify(json, null, 2)];
          })
        );
        setRaw(Object.fromEntries(entries));
      } catch (err) {
        console.error(err);
        toast.error('❌ Failed to load config');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveOne = async (key) => {
    const config = byKey[key];
    if (!config) return;

    let parsed;
    try {
      parsed = JSON.parse(raw[key] ?? 'null');
    } catch (err) {
      toast.error(`❌ Invalid JSON (${config.title})`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/config/${config.filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success(`✅ Saved ${config.title}`);
    } catch (err) {
      console.error(err);
      toast.error(`❌ Failed to save ${config.title}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="settings-page">Loading…</div>;

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p className="settings-hint">
        These configs are stored on the backend and apply immediately for new page loads.
      </p>

      <div className="settings-grid">
        {CONFIG_FILES.map((c) => (
          <section key={c.key} className="settings-card">
            <div className="settings-card-head">
              <h2>{c.title}</h2>
              <button
                className="settings-save"
                disabled={saving}
                onClick={() => saveOne(c.key)}
              >
                Save
              </button>
            </div>

            <textarea
              className="settings-textarea"
              value={raw[c.key] ?? ''}
              onChange={(e) => setRaw(prev => ({ ...prev, [c.key]: e.target.value }))}
              spellCheck={false}
            />
          </section>
        ))}
      </div>
    </div>
  );
}

