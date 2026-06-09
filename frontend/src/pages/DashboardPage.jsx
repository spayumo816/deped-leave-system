import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { getDashboard } from "../services/dashboardService";
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

const getStatusClass = (status) => {
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  if (status === "cancelled") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
};

const formatStatus = (status) => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getRoleTitle = (role) => {
  const labels = {
    admin_officer: "Administrative Officer Dashboard",
    principal: "Principal Dashboard",
    division_admin: "Division Admin Dashboard",
    teacher: "Teacher Dashboard",
  };

  return labels[role] || "Dashboard";
};

function StatCard({ label, value, icon: Icon, tone = "sky", helper }) {
  const tones = {
    sky: "bg-sky-100 text-sky-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Card.Content className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>

            {helper && (
              <p className="mt-1 text-xs text-slate-400">{helper}</p>
            )}
          </div>

          {Icon && (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <DocumentTextIcon className="mx-auto h-10 w-10 text-slate-400" />
      <p className="mt-3 font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { currentMembership, school } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentMembership?._id]);

  const role = dashboard?.role || currentMembership?.role;

  const schoolName =
    school?.schoolName || dashboard?.school?.schoolName || "Your school";

  const myStats = dashboard?.myStats || {
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
  };

  const schoolStats = dashboard?.schoolStats;

  const showSchoolStats = Boolean(schoolStats);

  const showMyStats =
    role === "teacher" ||
    role === "admin_officer" ||
    role === "principal" ||
    !showSchoolStats;

  const summaryText = useMemo(() => {
    if (role === "division_admin") {
      return "Monitor division-wide leave applications, approvals, and employee records.";
    }

    if (role === "admin_officer") {
      return "Manage school employees, leave ledger balances, and leave applications.";
    }

    if (role === "principal") {
      return "Review school leave applications and monitor leave activity.";
    }

    if (role === "teacher") {
      return "Track your leave applications, credits, and leave ledger history.";
    }

    return "Overview of leave applications, credits, and approvals.";
  }, [role]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-400 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">
              {schoolName}
            </p>

            <h1 className="mt-2 text-3xl font-bold">{getRoleTitle(role)}</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
              {summaryText}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
            <p className="text-sky-50">Signed in as</p>
            <p className="font-semibold capitalize">{formatLabel(role)}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showSchoolStats && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {role === "division_admin"
                  ? "Division Overview"
                  : "School Overview"}
              </h2>
              <p className="text-sm text-slate-500">
                Summary of employees and leave application activity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label="Total Employees"
              value={schoolStats.totalEmployees}
              icon={UserGroupIcon}
              tone="slate"
              helper="Active employee records"
            />

            <StatCard
              label="Pending Leaves"
              value={schoolStats.pendingLeaves}
              icon={ClockIcon}
              tone="amber"
              helper="Awaiting action"
            />

            <StatCard
              label="Approved Leaves"
              value={schoolStats.approvedLeaves}
              icon={CheckCircleIcon}
              tone="green"
              helper="Approved applications"
            />

            <StatCard
              label="Rejected Leaves"
              value={schoolStats.rejectedLeaves}
              icon={XCircleIcon}
              tone="red"
              helper="Rejected applications"
            />
          </div>
        </section>
      )}

      {showMyStats && (
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-bold text-slate-900">
              My Leave Summary
            </h2>
            <p className="text-sm text-slate-500">
              Your personal leave application status.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="My Pending Leaves"
              value={myStats.pendingLeaves}
              icon={ClockIcon}
              tone="amber"
            />

            <StatCard
              label="My Approved Leaves"
              value={myStats.approvedLeaves}
              icon={CheckCircleIcon}
              tone="green"
            />

            <StatCard
              label="My Rejected Leaves"
              value={myStats.rejectedLeaves}
              icon={XCircleIcon}
              tone="red"
            />
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <Card.Content className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My Leave Credits
                </h2>
                <p className="text-sm text-slate-500">
                  Your current leave balances.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {dashboard?.myCredits?.length > 0 ? (
                dashboard.myCredits.map((credit) => {
                  const earned = Number(credit.earned || 0);
                  const remaining = Number(credit.remaining || 0);
                  const progress =
                    earned > 0
                      ? Math.min(100, (remaining / earned) * 100)
                      : 0;

                  return (
                    <div
                      key={credit.leaveType}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatLeaveType(credit.leaveType)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Earned: {credit.earned} · Used: {credit.used}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-sky-700">
                            {credit.remaining}
                          </p>
                          <p className="text-xs text-slate-500">remaining</p>
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title="No leave credits found"
                  description="Your leave credit records will appear here once encoded."
                />
              )}
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <Card.Content className="p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Recent Leave Applications
              </h2>
              <p className="text-sm text-slate-500">
                Latest leave activity based on your access.
              </p>
            </div>

            <div className="space-y-3">
              {dashboard?.recentLeaves?.length > 0 ? (
                dashboard.recentLeaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {leave.userSchool?.user?.name || "Employee"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatLeaveType(leave.leaveType)} ·{" "}
                          {leave.totalDays} day(s)
                        </p>

                        {leave.userSchool?.school?.schoolName && (
                          <p className="mt-1 text-xs text-slate-400">
                            {leave.userSchool.school.schoolName}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          leave.status
                        )}`}
                      >
                        {formatStatus(leave.status)}
                      </span>
                    </div>

                    {leave.remarks && (
                      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        {leave.remarks}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No recent leave applications"
                  description="Recent leave applications will appear here."
                />
              )}
            </div>
          </Card.Content>
        </Card>
      </section>
    </div>
  );
}