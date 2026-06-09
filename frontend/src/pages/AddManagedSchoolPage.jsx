import { useMemo, useState } from "react";
import { Card, Button } from "@heroui/react";
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  IdentificationIcon,
  InformationCircleIcon,
  MapPinIcon,
  PlusCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { addManagedSchool } from "../services/schoolService";
import { useAuth } from "../app/AuthContext";
import { sisonSchools } from "../data/sisonSchool";

const formatLabel = (value) => {
  if (!value) return "Not available";
  return value.replaceAll("_", " ");
};

const inputWrapperClass =
  "flex h-12 w-full items-center rounded-xl border border-slate-300 bg-white px-3 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100";

const inputClass =
  "h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

export default function AddManagedSchoolPage() {
  const { refreshUser, currentMembership, school } = useAuth();

  const [form, setForm] = useState({
    schoolName: "",
    schoolId: "",
    address: "",
  });

  const [schoolSearch, setSchoolSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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
    (schoolItem) => schoolItem.schoolId === form.schoolId
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.schoolId || !form.schoolName) {
      setError("Please select a school first.");
      return;
    }

    try {
      setLoading(true);
      setSuccess("");
      setError("");

      await addManagedSchool({
        schoolName: form.schoolName,
        schoolId: form.schoolId,
        address: form.address,
      });

      await refreshUser();

      setSuccess(
        "Managed school added successfully. You can now switch to this school from the active school selector."
      );

      setForm({
        schoolName: "",
        schoolId: "",
        address: "",
      });

      setSchoolSearch("");
    } catch (err) {
      setError(err.message || "Failed to add managed school.");
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
              School Management
            </p>

            <h1 className="mt-2 text-3xl font-bold">Add Managed School</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
              Link another school to your same Admin Officer account. Your
              employee profile and leave credit setup will be copied from your
              current active school.
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
            <p className="text-sky-50">Current Role</p>
            <p className="font-semibold capitalize">
              {formatLabel(currentMembership?.role)}
            </p>
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
                  <UserCircleIcon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Current Admin Profile
                  </h2>
                  <p className="text-sm text-slate-500">
                    Details to be copied.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <InfoItem
                  label="Active School"
                  value={
                    currentMembership?.school?.schoolName ||
                    school?.schoolName ||
                    "Not available"
                  }
                />

                <InfoItem
                  label="Employee Number"
                  value={currentMembership?.employeeNumber || "Not available"}
                />

                <InfoItem
                  label="Position"
                  value={currentMembership?.position || "Administrative Officer"}
                />

                <InfoItem
                  label="Role"
                  value={formatLabel(currentMembership?.role)}
                  capitalize
                />
              </div>
            </Card.Content>
          </Card>

          <Card className="border border-sky-200 bg-sky-50 shadow-sm">
            <Card.Content className="p-6">
              <div className="flex gap-3">
                <InformationCircleIcon className="h-6 w-6 shrink-0 text-sky-700" />

                <div>
                  <h2 className="font-bold text-sky-900">How this works</h2>
                  <p className="mt-2 text-sm leading-6 text-sky-800">
                    After adding a managed school, you can switch schools from
                    the active school selector in the sidebar. Your account will
                    remain the same, but the active school context will change.
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
                  <BuildingOffice2Icon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    New Managed School
                  </h2>
                  <p className="text-sm text-slate-500">
                    Select the school to link to your admin account.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
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

              <div>
                <label className={labelClass}>School</label>

                <select
                  value={form.schoolId}
                  onChange={(e) => handleSchoolSelect(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Select school</option>

                  {filteredSchools.map((school) => (
                    <option key={school.schoolId} value={school.schoolId}>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>School Name</label>

                  <div className={inputWrapperClass}>
                    <AcademicCapIcon className="mr-3 h-5 w-5 text-slate-400" />
                    <input
                      value={form.schoolName}
                      readOnly
                      className={inputClass}
                      placeholder="Auto-filled"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>School ID</label>

                  <div className={inputWrapperClass}>
                    <IdentificationIcon className="mr-3 h-5 w-5 text-slate-400" />
                    <input
                      value={form.schoolId}
                      readOnly
                      className={inputClass}
                      placeholder="Auto-filled"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>School Address</label>

                <div className={inputWrapperClass}>
                  <MapPinIcon className="mr-3 h-5 w-5 text-slate-400" />
                  <input
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    className={inputClass}
                    placeholder="Optional school address"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Ready to link this school?
                  </p>
                  <p className="text-sm text-slate-500">
                    The new school will appear in your active school selector
                    after saving.
                  </p>
                </div>

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={loading}
                  className="h-12 gap-2 bg-sky-600 px-8 font-semibold text-white"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  Add School
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>
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