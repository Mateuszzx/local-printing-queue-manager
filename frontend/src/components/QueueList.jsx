import React, { useMemo } from 'react';
import JobCard from './JobCard';

export default function QueueList({ jobs = [], filters = {}, setFilters, config, statusOptions = [], onDelete, onUpdate }) {
  const filteredJobs = useMemo(() => {
    return jobs
      .filter(j => !filters.printer || j.printer === filters.printer)
      .filter(j => !filters.status || j.status === filters.status)
      .sort((a, b) =>
        filters.sortBy === 'printer'
          ? a.printer.localeCompare(b.printer)
          : new Date(b.created_at) - new Date(a.created_at)
      );
  }, [jobs, filters]);

  return (
    <>
      <div className="filter-controls">
        <label>
          Printer:
          <select value={filters.printer || ""} onChange={(e) => setFilters({ ...filters, printer: e.target.value })}>
            <option value="">All</option>
            {config.printers?.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          Status:
          <select value={filters.status || ""} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Sort by:
          <select value={filters.sortBy || "date"} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
            <option value="date">Date</option>
            <option value="printer">Printer</option>
          </select>
        </label>
      </div>

      <div className="job-list">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              statusOptions={statusOptions}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))
        ) : (
          <p>No jobs match the current filter settings.</p>
        )}
      </div>
    </>
  );
}
