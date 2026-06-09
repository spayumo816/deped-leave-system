import { useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import {
  getSchoolCredits,
  updateCredit,
} from "../services/creditService";

const formatLabel = (value) => value?.replaceAll("_", " ") || "";

export default function LeaveCreditsPage() {
  const [records, setRecords] = useState([]);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedCredit, setSelectedCredit] = useState(null);

  const [editForm, setEditForm] = useState({
    earned: "",
    used: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [drawerError, setDrawerError] = useState("");

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      setPageError("");

      const data = await getSchoolCredits();
      setRecords(data);
    } catch (err) {
      setPageError(err.message || "Failed to load leave credits.");
    } finally {
      setLoading(false);
    }
  };

  const openEditDrawer = (record, credit) => {
    setSelectedRecord(record);
    setSelectedCredit(credit);
    setEditForm({
      earned: credit.earned,
      used: credit.used,
      remarks: credit.remarks || "",
    });
    setDrawerError("");
  };

  const closeEditDrawer = () => {
    setSelectedRecord(null);
    setSelectedCredit(null);
    setEditForm({
      earned: "",
      used: "",
      remarks: "",
    });
    setDrawerError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setDrawerError("");

      await updateCredit(selectedRecord.userSchool._id, {
        leaveType: selectedCredit.leaveType,
        earned: Number(editForm.earned),
        used: Number(editForm.used),
        remarks: editForm.remarks,
      });

      await loadCredits();
      closeEditDrawer();
    } catch (err) {
      setDrawerError(err.message || "Failed to update leave credit.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading leave credits...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Credits</h1>
        <p className="text-sm text-slate-500">
          View and edit employee leave credit balances.
        </p>
      </div>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {records.map((record) => (
          <Card
            key={record._id}
            className="border border-slate-200 bg-white shadow-sm"
          >
            <Card.Content className="p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {record.userSchool?.user?.name}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {record.userSchool?.employeeNumber} ·{" "}
                    {formatLabel(record.userSchool?.role)} ·{" "}
                    {formatLabel(record.userSchool?.personnelType)}
                  </p>

                  <p className="text-sm text-slate-500">
                    {record.userSchool?.position}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">
                        Leave Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm">Earned</th>
                      <th className="px-4 py-3 text-left text-sm">Used</th>
                      <th className="px-4 py-3 text-left text-sm">
                        Remaining
                      </th>
                      <th className="px-4 py-3 text-left text-sm">Remarks</th>
                      <th className="px-4 py-3 text-right text-sm">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {record.credits.map((credit) => {
                      const remaining = credit.earned - credit.used;

                      return (
                        <tr
                          key={credit.leaveType}
                          className="border-t border-slate-200"
                        >
                          <td className="px-4 py-3 capitalize">
                            {formatLabel(credit.leaveType)}
                          </td>

                          <td className="px-4 py-3">{credit.earned}</td>

                          <td className="px-4 py-3">{credit.used}</td>

                          <td className="px-4 py-3 font-semibold text-sky-700">
                            {remaining}
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-500">
                            {credit.remarks || "-"}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="flat"
                              color="secondary"
                              onPress={() => openEditDrawer(record, credit)}
                              className="gap-2"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {selectedRecord && selectedCredit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">
                Edit Leave Credit
              </h2>

              <p className="text-sm text-slate-500">
                {selectedRecord.userSchool?.user?.name}
              </p>

              <p className="text-sm capitalize text-slate-500">
                {formatLabel(selectedCredit.leaveType)}
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5 p-6">
              {drawerError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {drawerError}
                </div>
              )}

              <FormInput
                label="Earned"
                type="number"
                value={editForm.earned}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    earned: value,
                  }))
                }
                required
              />

              <FormInput
                label="Used"
                type="number"
                value={editForm.used}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    used: value,
                  }))
                }
                required
              />

              <FormTextarea
                label="Remarks"
                value={editForm.remarks}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    remarks: value,
                  }))
                }
                placeholder="Add remarks or reason for adjustment"
              />

              <BalancePreview earned={editForm.earned} used={editForm.used} />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="flat"
                  className="w-full"
                  onPress={closeEditDrawer}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  color="primary"
                  isLoading={saving}
                  className="w-full"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
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
        step="0.5"
        className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        placeholder={placeholder}
      />
    </div>
  );
}

function BalancePreview({ earned, used }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">Remaining Balance</p>
      <p className="text-2xl font-bold text-sky-700">
        {Number(earned || 0) - Number(used || 0)}
      </p>
    </div>
  );
}