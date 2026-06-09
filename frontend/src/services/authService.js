import { apiFetch } from "./api";

export const registerSchoolAdmin = (payload) => {
  return apiFetch("/auth/register-admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const registerDivisionAdmin = (payload) => {
  return apiFetch("/auth/register-division-admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const changeMyPassword = (payload) => {
  return apiFetch("/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};