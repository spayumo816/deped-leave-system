import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@heroui/react";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  approveLeave,
  getPendingApprovals,
  rejectLeave,
} from "../services/leaveService";
import { useAuth } from "../app/AuthContext";

const formatLabel = (value) => {
  if (!value) return "";
  return value.replaceAll("_", " ");
};

const formatLeaveType = (leaveType) => {
  const labels = {
    vacation_leave: "Vacation Leave",
    sick_leave: "Sick Leave",
    vacation_service_credit: "Service Credits",
    special_privilege_leave: "Special Privilege Leave",
    force_leave: "Force Leave",
    maternity_leave: "Maternity Leave",
    paternity_leave: "Paternity Leave",
    solo_parent_leave: "Solo Parent Leave",
    study_leave: "Study Leave",
    rehabilitation_leave: "Rehabilitation Leave",
    special_leave_benefit_for_women: "Special Leave Benefit for Women",
    adoption_leave: "Adoption Leave",
    other: "Other",
  };

  return labels[leaveType] || formatLabel(leaveType);
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getRoleTitle = (role) => {
  if (role === "division_admin") return "Division Leave Approvals";
  if (role === "principal") return "School Leave Approvals";
  return "Pending Approvals";
};

export default function PendingApprovalsPage() {
  const { role, school, currentMembership } = useAuth();

  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [drawerError, setDrawerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadPendingApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMembership?._id]);

  const approvalStats = useMemo(() => {
    const total = leaves.length;
    const totalDays = leaves.reduce(
      (sum, leave) => sum + Number(leave.totalDays || 0),
      0
    );

    return {
      total,
      totalDays,
    };
  }, [leaves]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      setPageError("");
      setSuccessMessage("");

      const data = await getPendingApprovals();

      if (Array.isArray(data)) {
        setLeaves(data);
      } else {
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      setPageError(err.message || "Failed to load pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  const openActionDrawer = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setRemarks(type === "approve" ? "Approved." : "");
    setDrawerError("");
    setSuccessMessage("");
  };

  const closeActionDrawer = () => {
    setSelectedLeave(null);
    setActionType("");
    setRemarks("");
    setDrawerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLeave) return;

    if (actionType === "reject" && !remarks.trim()) {
      setDrawerError("Please provide remarks when rejecting a leave request.");
      return;
    }

    try {
      setSaving(true);
      setDrawerError("");
      setSuccessMessage("");

      if (actionType === "approve") {
        await approveLeave(selectedLeave._id, {
          remarks,
        });
      }

      if (actionType === "reject") {
        await rejectLeave(selectedLeave._id, {
          remarks,
        });
      }

      await loadPendingApprovals();
      closeActionDrawer();

      setSuccessMessage(
        actionType === "approve"
          ? "Leave request approved successfully."
          : "Leave request rejected successfully."
      );
    } catch (err) {
      setDrawerError(err.message || "Failed to process leave request.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-400 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">
              {school?.schoolName || "Leave Approval Queue"}
            </p>

            <h1 className="mt-2 text-3xl font-bold">{getRoleTitle(role)}</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
              Review pending leave applications assigned to your approval role.
              Approved leaves will deduct credits and create ledger
              transactions automatically.
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
            <p className="text-sky-50">Pending Requests</p>
            <p className="text-2xl font-bold">{approvalStats.total}</p>
          </div>
        </div>
      </section>

      {pageError && <ErrorBox message={pageError} />}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard
          label="Pending Applications"
          value={approvalStats.total}
          helper="Awaiting your action"
          icon={ClipboardDocumentCheckIcon}
          tone="amber"
        />

        <StatCard
          label="Total Leave Days"
          value={approvalStats.totalDays}
          helper="Across pending requests"
          icon={CalendarDaysIcon}
          tone="sky"
        />
      </section>

      {leaves.length === 0 ? (
        <Card className="border border-slate-200 bg-white shadow-sm">
          <Card.Content className="p-8">
            <EmptyState
              title="No pending approvals"
              description="You have no leave applications to review right now."
            />
          </Card.Content>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <Card
              key={leave._id}
              className="border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Card.Content className="p-5">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                        <UserIcon className="h-6 w-6" />
                      </div>

                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {leave.userSchool?.user?.name || "Employee"}
                        </h2>

                        <p className="text-sm text-slate-500">
                          {leave.userSchool?.employeeNumber || "-"} ·{" "}
                          {leave.userSchool?.position || "No position"}
                        </p>

                        {leave.userSchool?.school?.schoolName && (
                          <p className="mt-1 text-xs text-slate-400">
                            {leave.userSchool.school.schoolName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                      <InfoItem
                        label="Leave Type"
                        value={formatLeaveType(leave.leaveType)}
                      />

                      <InfoItem
                        label="Total Days"
                        value={`${leave.totalDays} day(s)`}
                      />

                      <InfoItem
                        label="Start Date"
                        value={formatDate(leave.startDate)}
                      />

                      <InfoItem
                        label="End Date"
                        value={formatDate(leave.endDate)}
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Reason
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {leave.reason || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <Button
                      color="success"
                      className="h-11 gap-2 font-semibold text-white"
                      onPress={() => openActionDrawer(leave, "approve")}
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Approve
                    </Button>

                    <Button
                      color="danger"
                      variant="flat"
                      className="h-11 gap-2 font-semibold"
                      onPress={() => openActionDrawer(leave, "reject")}
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      {selectedLeave && (
        <DrawerShell
          title={actionType === "approve" ? "Approve Leave" : "Reject Leave"}
          subtitle={selectedLeave.userSchool?.user?.name}
        >
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {drawerError && <ErrorBox message={drawerError} />}

            <div
              className={`rounded-2xl border p-4 ${
                actionType === "approve"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    actionType === "approve"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {actionType === "approve" ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <p
                    className={`text-sm font-bold ${
                      actionType === "approve"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {actionType === "approve"
                      ? "Confirm approval"
                      : "Confirm rejection"}
                  </p>

                  <p
                    className={`mt-1 text-sm ${
                      actionType === "approve"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {actionType === "approve"
                      ? "Approving this request will deduct applicable leave credits."
                      : "Rejecting this request will keep the leave application from being deducted."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {formatLeaveType(selectedLeave.leaveType)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {formatDate(selectedLeave.startDate)} to{" "}
                {formatDate(selectedLeave.endDate)}
              </p>

              <p className="text-sm text-slate-500">
                {selectedLeave.totalDays} day(s)
              </p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {selectedLeave.reason || "-"}
              </p>
            </div>

            {actionType === "reject" && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                <p>
                  Rejection remarks are required so the employee can understand
                  why the leave was not approved.
                </p>
              </div>
            )}

            <FormTextarea
              label={
                actionType === "approve"
                  ? "Approval Remarks"
                  : "Rejection Remarks"
              }
              value={remarks}
              onChange={setRemarks}
              placeholder={
                actionType === "approve"
                  ? "Example: Approved."
                  : "Enter reason for rejection"
              }
              required={actionType === "reject"}
            />

            <DrawerActions
              onCancel={closeActionDrawer}
              loading={saving}
              submitLabel={
                actionType === "approve" ? "Approve Leave" : "Reject Leave"
              }
              tone={actionType === "approve" ? "success" : "danger"}
            />
          </form>
        </DrawerShell>
      )}
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-100 text-sky-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <Card.Content className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{helper}</p>
          </div>

          {Icon && (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold capitalize text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <DocumentTextIcon className="mx-auto h-10 w-10 text-slate-400" />
      <p className="mt-3 font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function DrawerShell({ title, subtitle, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
}

function DrawerActions({ onCancel, loading, submitLabel, tone }) {
  const isDanger = tone === "danger";

  return (
    <div className="flex gap-3 pt-4">
      <Button type="button" variant="flat" className="w-full" onPress={onCancel}>
        Cancel
      </Button>

      <Button
        type="submit"
        color={isDanger ? "danger" : "success"}
        isLoading={loading}
        className="w-full font-semibold text-white"
      >
        {submitLabel}
      </Button>
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        required={required}
        className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        placeholder={placeholder}
      />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}