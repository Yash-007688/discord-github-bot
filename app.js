function getSavedUser() {
  try {
    const raw = localStorage.getItem("dashboardUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setUserBadge() {
  const badge = document.getElementById("userBadge");
  if (!badge) return;
  const user = getSavedUser();
  badge.textContent = user?.username ? `@${user.username}` : "Guest";
}

async function loadDashboardData() {
  const commandsList = document.getElementById("topCommands");
  const contributorList = document.getElementById("topContributors");
  if (!commandsList || !contributorList) return;

  try {
    const response = await fetch("/api/dashboard");
    if (!response.ok) {
      throw new Error("Dashboard API request failed");
    }
    const data = await response.json();
    const usage = data.commandUsage || [];
    const contributors = data.contributors || [];

    document.getElementById("totalCommands").textContent = String(data.totalCommands || 0);
    document.getElementById("totalUsage").textContent = String(data.totalUsage || 0);
    document.getElementById("totalContributors").textContent = String(data.totalContributors || 0);

    commandsList.innerHTML =
      usage.length > 0
        ? usage
            .map((item) => `<li><strong>/${item.name}</strong> - used ${item.count} times</li>`)
            .join("")
        : "<li>No command usage tracked yet.</li>";

    contributorList.innerHTML =
      contributors.length > 0
        ? contributors
            .map((item) => `<li><strong>${item.name}</strong> - ${item.commits} commits</li>`)
            .join("")
        : "<li>No contributors tracked yet.</li>";
  } catch (error) {
    commandsList.innerHTML = `<li>${error.message}</li>`;
    contributorList.innerHTML = "<li>Unable to load contributors right now.</li>";
  }
}

function bindAuthForms() {
  const form = document.getElementById("authForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!username || !email || !password) return;
    localStorage.setItem(
      "dashboardUser",
      JSON.stringify({
        username,
        email,
        signedInAt: new Date().toISOString(),
      })
    );
    window.location.href = "/";
  });
}

function bindSettings() {
  const form = document.getElementById("settingsForm");
  if (!form) return;
  const savedTheme = localStorage.getItem("dashboardTheme");
  const savedRefresh = localStorage.getItem("dashboardRefresh");
  if (savedTheme) document.getElementById("theme").value = savedTheme;
  if (savedRefresh) document.getElementById("refresh").value = savedRefresh;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const theme = document.getElementById("theme").value;
    const refresh = document.getElementById("refresh").value;
    localStorage.setItem("dashboardTheme", theme);
    localStorage.setItem("dashboardRefresh", refresh);
    const status = document.getElementById("settingsStatus");
    status.textContent = "Settings saved successfully.";
  });
}

setUserBadge();
loadDashboardData();
bindAuthForms();
bindSettings();
