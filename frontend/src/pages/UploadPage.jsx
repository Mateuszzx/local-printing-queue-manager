import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import UploadForm from '../components/UploadForm';
import QueueList from '../components/QueueList';
import './UploadPage.css';
import { loadAllConfigs } from '../utils/configLoader';

export default function UploadPage() {
  const [jobs, setJobs] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [config, setConfig] = useState({ printers: [], materials: [], infill: [], infill_type: [] });
  const [filters, setFilters] = useState({ printer: '', status: '', sortBy: 'date' });

  useEffect(() => { loadConfig(); }, []);
  useEffect(() => { loadJobs(); }, [filters]);

  const loadConfig = async () => {
    try {
      const { printers, materials, infill, infill_type, statuses } = await loadAllConfigs();
      setConfig({ printers, materials, infill, infill_type });
      setStatusOptions(statuses);
    } catch {
      toast.error("❌ Config fetch failed");
    }
  };

  const loadJobs = async () => {
    try {
      let data = await fetch('/api/queue').then(res => res.json());
      if (filters.printer) data = data.filter(j => j.printer === filters.printer);
      if (filters.status) data = data.filter(j => j.status === filters.status);
      data.sort((a, b) => filters.sortBy === 'date'
        ? new Date(b.created_at) - new Date(a.created_at)
        : a.printer.localeCompare(b.printer));
      setJobs(data);
    } catch {
      toast.error("❌ Queue fetch failed");
      setJobs([]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      form.reset();
      toast.success("✅ File uploaded");
      await loadJobs();
    } else {
      toast.error("❌ Upload error");
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/queue/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success("🗑️ Deleted");
      await loadJobs();
    } else {
      toast.error("❌ Delete error");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const res = await fetch(`/api/queue/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) await loadJobs();
  };

  return (
    <div className="upload-page">
      <aside className="upload-sidebar">
        <h1>📤 Upload</h1>
        <UploadForm config={config} onUpload={handleUpload} />
      </aside>
      <main className="queue-section">
        <h1>📋 Queue</h1>
        <QueueList
          jobs={jobs}
          filters={filters}
          setFilters={setFilters}
          config={config}
          statusOptions={statusOptions}
          onDelete={handleDelete}
          onUpdate={handleStatusUpdate}
        />
      </main>
    </div>
  );
}