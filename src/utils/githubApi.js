import axios from "axios";
import { config } from "../config/index.js";

export const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(config.githubToken ? { Authorization: `Bearer ${config.githubToken}` } : {}),
  },
  timeout: 10000,
});

export function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}
