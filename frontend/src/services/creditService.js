import { apiFetch } from "./api";

export const getSchoolCredits = () => {
  return apiFetch("/credits");
};

export const getUserCredits = (userSchoolId) => {
  return apiFetch(`/credits/${userSchoolId}`);
};

export const updateCredit = (userSchoolId, payload) => {
  return apiFetch(`/credits/${userSchoolId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const addCredit = (userSchoolId, payload) => {
  return apiFetch(`/credits/${userSchoolId}/add`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getMyCredits = () => {
  return apiFetch("/credits/my");
};