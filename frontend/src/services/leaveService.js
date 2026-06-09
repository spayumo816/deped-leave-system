import { apiFetch } from "./api";

export const getPendingApprovals = () => {
  return apiFetch("/leaves/pending-approvals");
};

export const approveLeave = (leaveId, payload) => {
  return apiFetch(`/leaves/${leaveId}/approve`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const rejectLeave = (leaveId, payload) => {
  return apiFetch(`/leaves/${leaveId}/reject`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const fileLeave = (payload) => {
  return apiFetch("/leaves", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getMyLeaves = () => {
  return apiFetch("/leaves/my");
};

export const getSchoolLeaves = () => {
  return apiFetch("/leaves");
};