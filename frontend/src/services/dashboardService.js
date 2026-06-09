import { apiFetch } from "./api";

export const getDashboard = () => {
  return apiFetch("/dashboard");
};