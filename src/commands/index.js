import { command as githubActivity } from "./githubActivity.js";
import { command as githubChart } from "./githubChart.js";
import { command as githubCompare } from "./githubCompare.js";
import { command as githubLanguages } from "./githubLanguages.js";
import { command as githubLeaderboard } from "./githubLeaderboard.js";
import { command as githubMe } from "./githubMe.js";
import { command as githubReadme } from "./githubReadme.js";
import { command as githubRepo } from "./githubRepo.js";
import { command as githubStreak } from "./githubStreak.js";
import { command as githubSummary } from "./githubSummary.js";
import { command as githubTopRepos } from "./githubTopRepos.js";
import { command as githubTrending } from "./githubTrending.js";

export const commandMap = new Map([
  [githubActivity.data.name, githubActivity],
  [githubChart.data.name, githubChart],
  [githubCompare.data.name, githubCompare],
  [githubLanguages.data.name, githubLanguages],
  [githubLeaderboard.data.name, githubLeaderboard],
  [githubMe.data.name, githubMe],
  [githubReadme.data.name, githubReadme],
  [githubRepo.data.name, githubRepo],
  [githubStreak.data.name, githubStreak],
  [githubSummary.data.name, githubSummary],
  [githubTopRepos.data.name, githubTopRepos],
  [githubTrending.data.name, githubTrending],
]);
