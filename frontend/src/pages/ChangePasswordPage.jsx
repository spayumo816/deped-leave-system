import { useMemo, useState } from "react";
import { Card, Button } from "@heroui/react";
import {
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { changeMyPassword } from "../services/authService";
import { useAuth } from "../app/AuthContext";

const inputWrapperClass =
  "flex h-12 w-full items-center rounded-xl border border-slate-300 bg-white px-3 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100";

const inputClass =
  "h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400";

export default function ChangePasswordPage() {
  const { user, role, school } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const passwordType = showPasswords ? "text" : "password";

  const passwordChecks = useMemo(() => {
    const password = form.newPassword || "";

    return {
      hasLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      passwordsMatch:
        form.newPassword.length > 0 &&
        form.newPassword === form.confirmPassword,
    };
  }, [form.newPassword, form.confirmPassword]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);
      setSuccess("");
      setError("");

      await changeMyPassword(form);

      setSuccess("Password changed successfully.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">
              Account Security
            </p>

            <h1 className="mt-2 text-3xl font-bold">Change Password</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
              Update your default or temporary password to keep your DepEd Leave
              account secure.
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
            <p className="text-sky-50">Signed in as</p>
            <p className="font-semibold">{user?.name || "User"}</p>
          </div>
        </div>
      </section>

      {success && (
        <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <Card.Content className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <ShieldCheckIcon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Account Details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Current logged-in account.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <InfoItem label="Name" value={user?.name || "User"} />

                <InfoItem label="Email" value={user?.email || "-"} />

                <InfoItem
                  label="Role"
                  value={role?.replaceAll("_", " ") || "-"}
                  capitalize
                />

                <InfoItem
                  label="Active School"
                  value={school?.schoolName || "-"}
                />
              </div>
            </Card.Content>
          </Card>

          <Card className="border border-sky-200 bg-sky-50 shadow-sm">
            <Card.Content className="p-6">
              <div className="flex gap-3">
                <InformationCircleIcon className="h-6 w-6 shrink-0 text-sky-700" />

                <div>
                  <h2 className="font-bold text-sky-900">
                    Password Reminder
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-sky-800">
                    Avoid using temporary passwords for a long time. Change your
                    password after receiving a reset from the Admin Officer.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <Card.Content className="p-0">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <KeyIcon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Update Password
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter your current password and create a new one.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <PasswordInput
                label="Current Password"
                value={form.currentPassword}
                onChange={(value) => updateForm("currentPassword", value)}
                type={passwordType}
                placeholder="Enter current password"
              />

              <PasswordInput
                label="New Password"
                value={form.newPassword}
                onChange={(value) => updateForm("newPassword", value)}
                type={passwordType}
                placeholder="Enter new password"
              />

              <PasswordInput
                label="Confirm New Password"
                value={form.confirmPassword}
                onChange={(value) => updateForm("confirmPassword", value)}
                type={passwordType}
                placeholder="Re-enter new password"
                showToggle
                showPasswords={showPasswords}
                onToggle={() => setShowPasswords((current) => !current)}
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">
                  Password Checklist
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <PasswordCheck
                    passed={passwordChecks.hasLength}
                    label="At least 8 characters"
                  />
                  <PasswordCheck
                    passed={passwordChecks.hasUppercase}
                    label="Has uppercase letter"
                  />
                  <PasswordCheck
                    passed={passwordChecks.hasLowercase}
                    label="Has lowercase letter"
                  />
                  <PasswordCheck
                    passed={passwordChecks.hasNumber}
                    label="Has number"
                  />
                  <PasswordCheck
                    passed={passwordChecks.passwordsMatch}
                    label="Passwords match"
                  />
                </div>
              </div>

              <Button
                type="submit"
                color="primary"
                size="lg"
                isLoading={loading}
                className="h-12 w-full bg-sky-600 font-semibold text-white"
              >
                Change Password
              </Button>
            </form>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  type,
  placeholder,
  showToggle = false,
  showPasswords = false,
  onToggle,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className={inputWrapperClass}>
        <LockClosedIcon className="mr-3 h-5 w-5 text-slate-400" />

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className={inputClass}
          placeholder={placeholder}
        />

        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="ml-3 rounded-md p-1 text-slate-400 transition hover:text-slate-700"
            aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
          >
            {showPasswords ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function PasswordCheck({ passed, label }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
        passed ? "bg-green-50 text-green-700" : "bg-white text-slate-500"
      }`}
    >
      <CheckCircleIcon
        className={`h-4 w-4 ${passed ? "text-green-600" : "text-slate-300"}`}
      />
      <span>{label}</span>
    </div>
  );
}

function InfoItem({ label, value, capitalize = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold text-slate-900 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}