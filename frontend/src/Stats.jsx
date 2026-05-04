// dashboard/src/Stats.jsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Stats = ({ stats }) => {
  if (!stats) return <div className="stats-loading">Loading Analytics...</div>;

  // 1. Prepare Data for Line Chart (Timeline)
  const lineData = {
    labels: stats.timeline?.map(t => t.time) || [],
    datasets: [
      {
        label: 'Incoming Webhooks',
        data: stats.timeline?.map(t => t.count) || [],
        borderColor: '#58a6ff', // Neon Blue
        backgroundColor: 'rgba(88, 166, 255, 0.5)',
        tension: 0.4, // Curvy lines
      },
    ],
  };

  // 2. Prepare Data for Bar Chart (Methods)
  const barData = {
    labels: stats.methods?.map(m => m.method) || [],
    datasets: [
      {
        label: 'HTTP Methods',
        data: stats.methods?.map(m => m.count) || [],
        backgroundColor: ['#238636', '#da3633', '#f1e05a'], // Green, Red, Yellow
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#c9d1d9' } }, // Dark mode text
      title: { display: false },
    },
    scales: {
      y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } },
      x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } },
    }
  };

  return (
    <div className="stats-container" style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
      <div className="card" style={{ flex: 2, padding: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#c9d1d9' }}>Traffic Volume</h3>
        <Line data={lineData} options={options} />
      </div>
      <div className="card" style={{ flex: 1, padding: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#c9d1d9' }}>Method Distribution</h3>
        <Bar data={barData} options={options} />
      </div>
    </div>
  );
};

export default Stats;