import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { getSchoolLeaves } from "../services/leaveService";
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

const getStatusClass = (status) => {
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  if (status === "cancelled") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
};

const getStatusIcon = (status) => {
  if (status === "approved") return CheckCircleIcon;
  if (status === "rejected") return XCircleIcon;
  return ClockIcon;
};

const formatStatus = (status) => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function LeaveApplicationsPage() {
  const { role, school, currentMembership } = useAuth();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  useEffect(() => {
    loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMembership?._id]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getSchoolLeaves();
      setLeaves(data);
    } catch (err) {
      setError(err.message || "Failed to load leave applications.");
    } finally {
      setLoading(false);
    }
  };

  const leaveStats = useMemo(() => {
    return {
      total: leaves.length,
      pending: leaves.filter((leave) => leave.status === "pending").length,
      approved: leaves.filter((leave) => leave.status === "approved").length,
      rejected: leaves.filter((leave) => leave.status === "rejected").length,
    };
  }, [leaves]);

  const leaveTypeOptions = useMemo(() => {
    const types = new Set(leaves.map((leave) => leave.leaveType));
    return ["all", ...Array.from(types)];
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return leaves.filter((leave) => {
      const employeeName = leave.userSchool?.user?.name?.toLowerCase() || "";
      const employeeNumber =
        leave.userSchool?.employeeNumber?.toLowerCase() || "";
      const position = leave.userSchool?.position?.toLowerCase() || "";
      const schoolName =
        leave.userSchool?.school?.schoolName?.toLowerCase() || "";

      const matchesSearch =
        employeeName.includes(searchValue) ||
        employeeNumber.includes(searchValue) ||
        position.includes(searchValue) ||
        schoolName.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || leave.status === statusFilter;

      const matchesLeaveType =
        leaveTypeFilter === "all" || leave.leaveType === leaveTypeFilter;

      return matchesSearch && matchesStatus && matchesLeaveType;
    });
  }, [leaves, search, statusFilter, leaveTypeFilter]);

  const pageDescription =
    role === "division_admin"
      ? "Monitor leave applications submitted across the division."
      : "Monitor leave applications submitted in the active school.";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
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
              {school?.schoolName || "Leave Monitoring"}
            </p>

            <h1 className="mt-2 text-3xl font-bold">Employees' Leave Applications</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
              {pageDescription}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
            <p className="text-sky-50">Total Records</p>
            <p className="text-2xl font-bold">{leaveStats.total}</p>
          </div>
        </div>
      </section>

      {error && <ErrorBox message={error} />}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Total"
          value={leaveStats.total}
          helper="All applications"
          tone="slate"
          icon={ClipboardDocumentListIcon}
        />

        <StatCard
          label="Pending"
          value={leaveStats.pending}
          helper="Awaiting action"
          tone="amber"
          icon={ClockIcon}
        />

        <StatCard
          label="Approved"
          value={leaveStats.approved}
          helper="Approved leaves"
          tone="green"
          icon={CheckCircleIcon}
        />

        <StatCard
          label="Rejected"
          value={leaveStats.rejected}
          helper="Rejected leaves"
          tone="red"
          icon={XCircleIcon}
        />
      </section>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <Card.Content className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Filters</h2>
              <p className="text-sm text-slate-500">
                Search by employee name, employee number, position, or school.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormInput
              label="Search"
              value={search}
              onChange={setSearch}
              placeholder="Search name, employee no., position, school"
            />

            <FormSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All Status", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "Cancelled", value: "cancelled" },
              ]}
            />

            <FormSelect
              label="Leave Type"
              value={leaveTypeFilter}
              onChange={setLeaveTypeFilter}
              options={leaveTypeOptions.map((type) => ({
                label: type === "all" ? "All Leave Types" : formatLeaveType(type),
                value: type,
              }))}
            />
          </div>
        </Card.Content>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <Card.Content className="p-0">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <CalendarDaysIcon className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Application Records
                </h2>
                <p className="text-sm text-slate-500">
                  Showing {filteredLeaves.length} of {leaves.length} leave
                  application(s).
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              {filteredLeaves.length} result(s)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-262.5">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Employee</TableHeader>
                  <TableHeader>Leave Type</TableHeader>
                  <TableHeader>Dates</TableHeader>
                  <TableHeader>Days</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Action By</TableHeader>
                  <TableHeader>School</TableHeader>
                  <TableHeader>Remarks</TableHeader>
                </tr>
              </thead>

              <tbody>
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-10">
                      <EmptyState
                        title="No leave applications found"
                        description="Try changing your filters or search keywords."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => {
                    const actionBy =
                      leave.approvedBy?.user?.name ||
                      leave.rejectedBy?.user?.name ||
                      "-";

                    const StatusIcon = getStatusIcon(leave.status);

                    return (
                      <tr
                        key={leave._id}
                        className="border-t border-slate-200 transition hover:bg-slate-50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {leave.userSchool?.user?.name || "Employee"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {leave.userSchool?.employeeNumber || "-"} ·{" "}
                              {leave.userSchool?.position || "No position"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            {formatLeaveType(leave.leaveType)}
                          </span>
                        </TableCell>

                        <TableCell muted>
                          {formatDate(leave.startDate)} to{" "}
                          {formatDate(leave.endDate)}
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-slate-900">
                            {leave.totalDays}
                          </span>{" "}
                          <span className="text-slate-500">day(s)</span>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              leave.status
                            )}`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {formatStatus(leave.status)}
                          </span>
                        </TableCell>

                        <TableCell muted>{actionBy}</TableCell>

                        <TableCell muted>
                          {leave.userSchool?.school?.schoolName ||
                            school?.schoolName ||
                            "-"}
                        </TableCell>

                        <TableCell muted>{leave.remarks || "-"}</TableCell>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function StatCard({ label, value, helper, tone = "sky", icon: Icon }) {
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

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <DocumentTextIcon className="mx-auto h-10 w-10 text-slate-400" />
      <p className="mt-3 font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
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

function TableHeader({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children, muted = false }) {
  return (
    <td
      className={`px-4 py-3 text-sm ${
        muted ? "text-slate-500" : "text-slate-700"
      }`}
    >
      {children}
    </td>
  );
}

function FormInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}