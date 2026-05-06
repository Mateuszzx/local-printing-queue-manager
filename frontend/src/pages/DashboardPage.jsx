import React, { useEffect, useState } from 'react';
import './DashboardPage.css';
import { Chart as ChartJS, BarElement, ArcElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(BarElement, ArcElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(() => console.error('Failed to fetch statistics'));
  }, []);

  if (!stats) return <div className="dashboard-page">Loading statistics...</div>;

  return (
    <div className="dashboard-page">
      <h1>📊 Dashboard</h1>
      <div className="top-stats">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <strong>{stats.total_jobs}</strong>
        </div>
        <div className="stat-card">
          <h3>Avg STL File Size</h3>
          <strong>{stats.average_file_size_mb} MB</strong>
        </div>
        <div className="stat-card">
          <h3>Latest Job</h3>
          <div>{stats.latest_job?.filename} <br /><small>{new Date(stats.latest_job?.created_at).toLocaleString()}</small></div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h4>Jobs by Printer</h4>
          <Pie data={stats.jobsByPrinter}
          />
        </div>
        <div className="chart-card">
          <h4>Jobs by Status</h4>
          <Pie data={stats.jobsByStatus}
          />
        </div>
        <div className="chart-card">
          <h4>Jobs by Material</h4>
          <Pie data={stats.jobsByMaterial}
          />
        </div>
      </div>

    </div>
  );
}
