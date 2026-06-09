import { apiFetch } from "./api";

export const addManagedSchool = (payload) => {
  return apiFetch("/schools/my-managed-schools", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getMyManagedSchools = () => {
  return apiFetch("/schools/my-managed-schools");
};