import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Button } from "@heroui/react";
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  EnvelopeIcon,
  IdentificationIcon,
  InformationCircleIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../app/AuthContext";
import {
  registerDivisionAdmin,
  registerSchoolAdmin,
} from "../services/authService";
import { sisonSchools } from "../data/sisonSchool";

const inputWrapperClass =
  "flex h-12 w-full items-center rounded-xl border border-slate-300 bg-white px-3 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100";

const inputClass =
  "h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

const employmentStatusOptions = [
  { label: "Permanent", value: "permanent" },
  { label: "Provisional", value: "provisional" },
  { label: "Contractual", value: "contractual" },
  { label: "Job Order", value: "job_order" },
  { label: "Substitute", value: "substitute" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [accountType, setAccountType] = useState("school_admin");
  const [schoolSearch, setSchoolSearch] = useState("");

  const [form, setForm] = useState({
    schoolName: "",
    schoolId: "",
    name: "",
    email: "",
    password: "",
    employeeNumber: "",
    position: "",
    employmentStatus: "permanent",
    dateHired: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSchoolAdmin = accountType === "school_admin";

  const filteredSchools = useMemo(() => {
    const searchValue = schoolSearch.toLowerCase().trim();

    if (!searchValue) return sisonSchools;

    return sisonSchools.filter((school) => {
      return (
        school.schoolName.toLowerCase().includes(searchValue) ||
        school.schoolId.toLowerCase().includes(searchValue)
      );
    });
  }, [schoolSearch]);

  const selectedSchool = sisonSchools.find(
    (school) => school.schoolId === form.schoolId
  );

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSchoolSelect = (schoolId) => {
    const selectedSchool = sisonSchools.find(
      (school) => school.schoolId === schoolId
    );

    if (!selectedSchool) {
      setForm((current) => ({
        ...current,
        schoolId: "",
        schoolName: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      schoolId: selectedSchool.schoolId,
      schoolName: selectedSchool.schoolName,
    }));
  };

  const handleAccountTypeChange = (type) => {
    setAccountType(type);
    setError("");

    if (type === "division_admin") {
      setForm((current) => ({
        ...current,
        schoolName: "",
        schoolId: "",
        position: current.position || "Division Admin",
      }));
      setSchoolSearch("");
    }

    if (type === "school_admin") {
      setForm((current) => ({
        ...current,
        position:
          current.position === "Division Admin"
            ? "Administrative Officer"
            : current.position,
      }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (isSchoolAdmin && (!form.schoolName || !form.schoolId)) {
      setError("Please select a school.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (isSchoolAdmin) {
        await registerSchoolAdmin({
          schoolName: form.schoolName,
          schoolId: form.schoolId,
          name: form.name,
          email: form.email,
          password: form.password,
          employeeNumber: form.employeeNumber,
          position: form.position || "Administrative Officer",
          employmentStatus: form.employmentStatus,
          dateHired: form.dateHired || undefined,
        });
      } else {
        await registerDivisionAdmin({
          name: form.name,
          email: form.email,
          password: form.password,
          employeeNumber: form.employeeNumber,
          position: form.position || "Division Admin",
          employmentStatus: form.employmentStatus,
          dateHired: form.dateHired || undefined,
        });
      }

      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-linear-to-br from-sky-700 via-sky-600 to-cyan-400 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 left-20 h-80 w-80 rounded-full bg-white/10" />

          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-bold text-sky-700 shadow-sm">
                DL
              </div>

              <div>
                <h2 className="text-xl font-bold">DepEd Leave</h2>
                <p className="text-sm text-sky-100">
                  School and Division Registration
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-sky-100">
                Register. Configure. Manage.
              </p>

              <h1 className="text-5xl font-bold leading-tight">
                Create an admin account for school or division access.
              </h1>

              <p className="mt-6 text-lg leading-8 text-sky-50">
                School Admin Officers manage school-level records. Division
                Admins monitor division-wide records and approve principal leave
                applications.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3">
                <FeatureItem text="School-based employee and leave tracking" />
                <FeatureItem text="Division-wide principal leave approvals" />
                <FeatureItem text="Leave credits and ledger visibility" />
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/20 bg-white/15 p-5 shadow-sm backdrop-blur">
            <div className="flex gap-3">
              <InformationCircleIcon className="h-6 w-6 shrink-0 text-sky-100" />
              <p className="text-sm font-medium leading-6 text-sky-50">
                Register only official admin accounts here. Regular employee
                accounts should be created by the Admin Officer inside the
                system.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <Card className="w-full max-w-2xl border border-slate-200 bg-white shadow-xl">
            <Card.Content className="p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-xl font-bold text-white shadow-sm">
                  DL
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                  Create Admin Account
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Select the type of admin account you want to register.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className={labelClass}>Account Type</label>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <AccountTypeCard
                      active={isSchoolAdmin}
                      title="School Admin Officer"
                      description="Creates and manages records for one school."
                      icon={AcademicCapIcon}
                      onClick={() => handleAccountTypeChange("school_admin")}
                    />

                    <AccountTypeCard
                      active={!isSchoolAdmin}
                      title="Division Admin"
                      description="Can view division-wide records and principal approvals."
                      icon={BuildingOffice2Icon}
                      onClick={() => handleAccountTypeChange("division_admin")}
                    />
                  </div>
                </div>

                {isSchoolAdmin && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <SectionTitle
                      title="School Assignment"
                      description="Choose the school that this admin account will manage."
                    />

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={labelClass}>Search School</label>

                        <div className={inputWrapperClass}>
                          <BuildingOffice2Icon className="mr-3 h-5 w-5 text-slate-400" />
                          <input
                            value={schoolSearch}
                            onChange={(e) => setSchoolSearch(e.target.value)}
                            className={inputClass}
                            placeholder="Search by school name or school ID"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className={labelClass}>School</label>

                          <select
                            value={form.schoolId}
                            onChange={(e) =>
                              handleSchoolSelect(e.target.value)
                            }
                            required={isSchoolAdmin}
                            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          >
                            <option value="">Select school</option>

                            {filteredSchools.map((school) => (
                              <option
                                key={school.schoolId}
                                value={school.schoolId}
                              >
                                {school.schoolId} - {school.schoolName}
                              </option>
                            ))}
                          </select>

                          {filteredSchools.length === 0 && (
                            <p className="mt-2 text-xs text-red-600">
                              No school matched your search.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>School ID</label>

                          <input
                            value={form.schoolId}
                            readOnly
                            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none"
                            placeholder="Auto-filled"
                          />
                        </div>
                      </div>

                      {selectedSchool && (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                            Selected School
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {selectedSchool.schoolName}
                          </p>
                          <p className="text-sm text-slate-600">
                            School ID: {selectedSchool.schoolId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <SectionTitle
                    title="Account Information"
                    description="Login and employee profile details."
                  />

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <IconInput
                      label="Full Name"
                      value={form.name}
                      onChange={(value) => updateForm("name", value)}
                      placeholder="Full name"
                      icon={UserIcon}
                      required
                    />

                    <IconInput
                      label="Employee Number"
                      value={form.employeeNumber}
                      onChange={(value) =>
                        updateForm("employeeNumber", value)
                      }
                      placeholder="Employee number"
                      icon={IdentificationIcon}
                      required
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <IconInput
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={(value) => updateForm("email", value)}
                      placeholder="Email address"
                      icon={EnvelopeIcon}
                      required
                    />

                    <IconInput
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(value) => updateForm("password", value)}
                      placeholder="Minimum 6 characters"
                      icon={LockClosedIcon}
                      required
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className={labelClass}>Position</label>

                      <div className={inputWrapperClass}>
                        <input
                          value={form.position}
                          onChange={(e) =>
                            updateForm("position", e.target.value)
                          }
                          className={inputClass}
                          placeholder={
                            isSchoolAdmin
                              ? "Administrative Officer"
                              : "Division Admin"
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Employment Status</label>

                      <select
                        value={form.employmentStatus}
                        onChange={(e) =>
                          updateForm("employmentStatus", e.target.value)
                        }
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      >
                        {employmentStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Date Hired</label>

                      <input
                        type="date"
                        value={form.dateHired}
                        onChange={(e) =>
                          updateForm("dateHired", e.target.value)
                        }
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={loading}
                  className="h-12 w-full bg-sky-600 font-semibold text-white"
                >
                  Create Account
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Already have an account? Sign in
                </Link>
              </div>
            </Card.Content>
          </Card>
        </section>
      </div>
    </main>
  );
}

function AccountTypeCard({ active, title, description, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
        <Icon className="h-5 w-5" />
      </div>

      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </button>
  );
}

function IconInput({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>

      <div className={inputWrapperClass}>
        <Icon className="mr-3 h-5 w-5 text-slate-400" />

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClass}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function FeatureItem({ text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
      <CheckCircleIcon className="h-5 w-5 shrink-0 text-sky-100" />
      <p className="text-sm font-medium text-sky-50">{text}</p>
    </div>
  );
}