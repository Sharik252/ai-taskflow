import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, LogOut, Trash2, CheckSquare } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getInitials, formatDate } from "@/lib/utils";

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [signingOut, setSigningOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const name = user?.user_metadata?.name ?? "User";
  const email = user?.email ?? "";
  const createdAt = user?.created_at ?? "";

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    showToast("Signed out successfully", "success");
    navigate("/login");
  };

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-2xl">
        {/* Profile header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
              {getInitials(name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{name}</h2>
              <p className="text-sm text-slate-400">{email}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatDate(createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="card p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Account Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-sm text-white">{name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Mail className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-white">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">User ID</p>
                <p className="text-sm text-slate-400 font-mono truncate">{user?.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Account Actions</h3>
          <div className="space-y-2">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {signingOut ? <LoadingSpinner size="sm" /> : <LogOut className="w-5 h-5" />}
              Sign Out
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-error-600/10 hover:bg-error-600/20 text-error-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete Account">
        <p className="text-sm text-slate-300 mb-4">
          Account deletion is not available from this page. To delete your account, please contact
          support. This will permanently remove all your tasks and chat history.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmOpen(false)} className="btn-secondary">
            Close
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
