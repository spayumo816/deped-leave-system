import { NavLink, Outlet, useNavigate } from "react-router";
import { Button } from "@heroui/react";
import { useState } from "react";
import {
  ArrowLeftOnRectangleIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  KeyIcon,
  PlusCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../app/AuthContext";

const menuByRole = {
  admin_officer: [
    { label: "Dashboard", path: "/dashboard", icon: ChartBarIcon },
    { label: "Employees", path: "/users", icon: UserGroupIcon },
    { label: "Leave Ledger", path: "/leave-ledger", icon: BookOpenIcon },
    {
      label: "Employees'Leave Applications",
      path: "/leaves",
      icon: ClipboardDocumentListIcon,
    },
    { label: "My Leave Applications", path: "/my-leaves", icon: ClipboardDocumentListIcon },
    { label: "File Leave", path: "/file-leave", icon: CalendarDaysIcon },
    {
      label: "Add Managed School",
      path: "/add-managed-school",
      icon: PlusCircleIcon,
    },
    { label: "Change Password", path: "/change-password", icon: KeyIcon },
  ],

  principal: [
    { label: "Dashboard", path: "/dashboard", icon: ChartBarIcon },
    {
      label: "Pending Approvals",
      path: "/pending-approvals",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      label: "Employees' Leave Applications",
      path: "/leaves",
      icon: ClipboardDocumentListIcon,
    },
    { label: "My Leave Applications", path: "/my-leaves", icon: ClipboardDocumentListIcon },
    { label: "File Leave", path: "/file-leave", icon: CalendarDaysIcon },
    { label: "Change Password", path: "/change-password", icon: KeyIcon },
  ],

  division_admin: [
    { label: "Dashboard", path: "/dashboard", icon: ChartBarIcon },
    {
      label: "Pending Approvals",
      path: "/pending-approvals",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      label: "Leave Applications",
      path: "/leaves",
      icon: ClipboardDocumentListIcon,
    },
    { label: "Leave Ledger", path: "/leave-ledger", icon: BookOpenIcon },
    { label: "Change Password", path: "/change-password", icon: KeyIcon },
  ],

  teacher: [
    { label: "Dashboard", path: "/dashboard", icon: ChartBarIcon },
    { label: "My Leave Applications", path: "/my-leaves", icon: ClipboardDocumentListIcon },
    { label: "File Leave", path: "/file-leave", icon: CalendarDaysIcon },
    { label: "Leave Ledger", path: "/leave-ledger", icon: BookOpenIcon },
    { label: "Change Password", path: "/change-password", icon: KeyIcon },
  ],
};

const formatRole = (role) => {
  if (!role) return "User";
  return role.replaceAll("_", " ");
};

const getInitials = (name) => {
  if (!name) return "U";

  const words = name.trim().split(" ");

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return `${words[0].charAt(0)}${words[words.length - 1].charAt(
    0
  )}`.toUpperCase();
};

export default function AppLayout() {
  const {
    user,
    role,
    school,
    currentMembership,
    memberships,
    logout,
    switchMembership,
  } = useAuth();

  const navigate = useNavigate();
  const menu = menuByRole[role] || [];
  const [switching, setSwitching] = useState(false);

  const hasMultipleMemberships = memberships.length > 1;

  const handleSwitchMembership = async (userSchoolId) => {
    if (!userSchoolId || userSchoolId === currentMembership?._id) return;

    try {
      setSwitching(true);
      await switchMembership(userSchoolId);
      navigate("/dashboard", { replace: true });
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-[19rem] border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-lg font-bold text-white shadow-sm">
                DL
              </div>

              <div>
                <h1 className="text-base font-bold text-slate-900">
                  DepEd Leave
                </h1>
                <p className="text-xs text-slate-500">Management System</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <BuildingOffice2Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Active School
                  </p>

                  {hasMultipleMemberships ? (
                    <select
                      value={currentMembership?._id || ""}
                      onChange={(e) => handleSwitchMembership(e.target.value)}
                      disabled={switching}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:opacity-60"
                    >
                      {memberships.map((membership) => (
                        <option key={membership._id} value={membership._id}>
                          {membership.school?.schoolName || "School"} —{" "}
                          {formatRole(membership.role)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {school?.schoolName || "School"}
                      </p>
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {formatRole(role)}
                      </p>
                    </div>
                  )}

                  {switching && (
                    <p className="mt-2 text-xs font-medium text-sky-600">
                      Switching active school...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
            {menu.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-sky-100 text-sky-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                  {getInitials(user?.name)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user?.name || "User"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            <Button
              color="danger"
              variant="flat"
              onPress={handleLogout}
              className="h-11 w-full justify-center font-semibold"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col">
        {/* <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {school?.schoolName || "School"}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {formatRole(role)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                {getInitials(user?.name)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 lg:hidden">
            Mobile sidebar navigation is not yet enabled. For full navigation,
            use a desktop or wider screen.
          </div>
        </header> */}

        <section className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}