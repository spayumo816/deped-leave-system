import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@heroui/react";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { fileLeave } from "../services/leaveService";
import { getMyCredits } from "../services/creditService";
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

const getTodayInputValue = () => {
  return new Date().toISOString().split("T")[0];
};

const getInclusiveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return "";

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  if (end < start) return "";

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / millisecondsPerDay) + 1;
};

export default function FileLeavePage() {
  const { role, school, currentMembership } = useAuth();

  const [credits, setCredits] = useState([]);
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    totalDays: 1,
    reason: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMembership?._id]);

  const loadCredits = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await getMyCredits();
      const userCredits = data.credits || [];

      setCredits(userCredits);

      setForm((current) => ({
        ...current,
        leaveType: userCredits[0]?.leaveType || "",
      }));
    } catch (err) {
      setError(err.message || "Failed to load leave credits.");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((current) => {
      const updated = {
        ...current,
        [field]: value,
      };

      if (field === "startDate" || field === "endDate") {
        const start = field === "startDate" ? value : current.startDate;
        const end = field === "endDate" ? value : current.endDate;
        const computedDays = getInclusiveDays(start, end);

        if (computedDays) {
          updated.totalDays = computedDays;
        }
      }

      return updated;
    });
  };

  const selectedCredit = credits.find(
    (credit) => credit.leaveType === form.leaveType
  );

  const remainingBalance = Number(selectedCredit?.remaining || 0);
  const requestedDays = Number(form.totalDays || 0);

  const hasEnoughBalance = useMemo(() => {
    if (!selectedCredit) return false;
    return remainingBalance >= requestedDays;
  }, [selectedCredit, remainingBalance, requestedDays]);

  const projectedBalance = selectedCredit
    ? remainingBalance - requestedDays
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.leaveType) {
      setError("Please select a leave type.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Please select both start date and end date.");
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (!Number(form.totalDays) || Number(form.totalDays) <= 0) {
      setError("Total days must be greater than zero.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please enter your reason for leave.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await fileLeave({
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        totalDays: Number(form.totalDays),
        reason: form.reason,
      });

      setSuccess("Leave application filed successfully.");

      setForm((current) => ({
        ...current,
        startDate: "",
        endDate: "",
        totalDays: 1,
        reason: "",
      }));

      await loadCredits();
    } catch (err) {
      setError(err.message || "Failed to file leave.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">
              {school?.schoolName || "Leave Request"}
            </p>

            <h1 className="mt-2 text-3xl font-bold">File Leave</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
              Submit a leave application for approval. Your request will be
              routed based on your current role and active school.
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
            <p className="text-sky-50">Signed in as</p>
            <p className="font-semibold capitalize">{formatLabel(role)}</p>
          </div>
        </div>
      </section>

      {error && <ErrorBox message={error} />}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {credits.length === 0 ? (
        <Card className="border border-slate-200 bg-white shadow-sm">
          <Card.Content className="p-8">
            <EmptyState
              title="No leave credits found"
              description="You cannot file a leave yet because no leave credit record is available for your profile."
            />
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <Card.Content className="p-0">
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <PencilSquareIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Leave Application Form
                    </h2>
                    <p className="text-sm text-slate-500">
                      Complete the required details before submitting.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <FormSelect
                  label="Leave Type"
                  value={form.leaveType}
                  onChange={(value) => updateForm("leaveType", value)}
                  options={credits.map((credit) => ({
                    label: formatLeaveType(credit.leaveType),
                    value: credit.leaveType,
                  }))}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormInput
                    label="Start Date"
                    type="date"
                    value={form.startDate}
                    onChange={(value) => updateForm("startDate", value)}
                    required
                  />

                  <FormInput
                    label="End Date"
                    type="date"
                    value={form.endDate}
                    onChange={(value) => updateForm("endDate", value)}
                    required
                  />
                </div>

                <FormInput
                  label="Total Days"
                  type="number"
                  value={form.totalDays}
                  onChange={(value) => updateForm("totalDays", value)}
                  required
                  step="0.5"
                  helper="You may edit this for half-day or special leave arrangements."
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Reason
                  </label>

                  <textarea
                    value={form.reason}
                    onChange={(e) => updateForm("reason", e.target.value)}
                    required
                    rows={5}
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter reason for leave"
                  />
                </div>

                {!hasEnoughBalance && selectedCredit && requestedDays > 0 && (
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                    <p>
                      Requested days are greater than your current remaining
                      balance. The system may reject this request depending on
                      your backend leave credit rules.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  color="primary"
                  isLoading={saving}
                  className="h-11 w-full bg-sky-600 font-semibold text-white"
                >
                  Submit Leave Application
                </Button>
              </form>
            </Card.Content>
          </Card>

          <div className="space-y-6">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <Card.Content className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <ClipboardDocumentListIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Selected Credit
                    </h2>
                    <p className="text-sm text-slate-500">
                      Balance for selected leave type.
                    </p>
                  </div>
                </div>

                {selectedCredit ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatLeaveType(selectedCredit.leaveType)}
                    </p>

                    <p className="mt-3 text-4xl font-bold text-sky-700">
                      {selectedCredit.remaining}
                    </p>

                    <p className="text-sm text-slate-500">
                      Remaining balance
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs text-slate-500">Earned</p>
                        <p className="font-semibold text-slate-900">
                          {selectedCredit.earned}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs text-slate-500">Used</p>
                        <p className="font-semibold text-slate-900">
                          {selectedCredit.used}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No credit selected"
                    description="Choose a leave type to view its balance."
                  />
                )}
              </Card.Content>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <Card.Content className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <CalendarDaysIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Request Summary
                    </h2>
                    <p className="text-sm text-slate-500">
                      Preview before submitting.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <SummaryItem
                    label="Leave Type"
                    value={
                      form.leaveType ? formatLeaveType(form.leaveType) : "-"
                    }
                  />

                  <SummaryItem
                    label="Inclusive Dates"
                    value={
                      form.startDate && form.endDate
                        ? `${form.startDate} to ${form.endDate}`
                        : "-"
                    }
                  />

                  <SummaryItem
                    label="Requested Days"
                    value={`${form.totalDays || 0} day(s)`}
                  />

                  <SummaryItem
                    label="Projected Balance"
                    value={
                      selectedCredit && requestedDays > 0
                        ? `${projectedBalance} remaining`
                        : "-"
                    }
                    highlight
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                  <div className="flex gap-3">
                    <CheckCircleIcon className="h-5 w-5 shrink-0" />
                    <p>
                      After submission, your leave will appear in your leave
                      history as pending until approved or rejected.
                    </p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`text-right text-sm font-semibold ${
          highlight ? "text-sky-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
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

function ErrorBox({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step = "0.5",
  helper = "",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={step}
        className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />

      {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
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