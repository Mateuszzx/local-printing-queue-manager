import React from 'react';
import './JobCard.css';

export default function JobCard({ job, statusOptions, onDelete, onUpdate }) {
  const downloadUrl = `/storage/${job.filename}`;

  return (
    <div className="job-card">
      <div className="job-header">
        <h3>{job.name || job.filename}</h3>
        <span className={`status-badge status-${job.status}`}>{job.status}</span>
      </div>

      <div className="job-info">
        <p><strong>Description:</strong> {job.description || '—'}</p>
        <p><strong>Printer:</strong> {job.printer}</p>
        <p><strong>Material:</strong> {job.material}</p>
        <p><strong>Infill:</strong> {job.infill} ({job.infill_type})</p>
        <p><strong>Perimeters:</strong> {job.perimeters ?? '—'}</p>
        <p><strong>Supports:</strong> {job.supports ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Uploaded:</strong> {new Date(job.created_at).toLocaleString()}</p>
      </div>

      <div className="job-actions">
        <select
          value={job.status}
          onChange={(e) => onUpdate(job.id, e.target.value)}
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <div className="job-buttons">
          <a href={downloadUrl} download className="download-btn">⬇️ Download</a>
          <button onClick={() => onDelete(job.id)} className="delete-btn">🗑️ Delete</button>
        </div>
      </div>
    </div>
  );
}
