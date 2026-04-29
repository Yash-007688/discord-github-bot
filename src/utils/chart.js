export function quickChartRepoStats(repo) {
  const chartConfig = {
    type: "bar",
    data: {
      labels: ["Stars", "Forks", "Open Issues", "Watchers"],
      datasets: [
        {
          label: repo.full_name,
          data: [
            repo.stargazers_count || 0,
            repo.forks_count || 0,
            repo.open_issues_count || 0,
            repo.watchers_count || 0,
          ],
          backgroundColor: ["#f1c40f", "#3498db", "#e74c3c", "#2ecc71"],
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  };

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
}
