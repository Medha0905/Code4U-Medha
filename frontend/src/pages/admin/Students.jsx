import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { GraduationCap, Search } from 'lucide-react';
import * as adminApi from '../../services/admin';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';

export default function AdminStudents() {
  const [students, setStudents] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => adminApi.listStudents().then(setStudents).catch(() => setStudents([]));
  useEffect(() => { load(); }, []);

  const toggleActive = async (student) => {
    const nextActive = !student.user.isActive;
    if (!nextActive && !confirm(`Deactivate ${student.fullName}'s account? They won't be able to log in until reactivated.`)) return;
    try {
      await adminApi.setUserActive(student.user.id, nextActive);
      toast.success(nextActive ? 'Account reactivated' : 'Account deactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update account');
    }
  };

  if (!students) return <div className="grid gap-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  const filtered = students.filter((s) => s.fullName.toLowerCase().includes(search.toLowerCase()) || s.user.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Students</h1>
          <p className="text-ink-500 text-sm mt-1">{students.length} registered accounts.</p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 text-ink-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" className="input pl-9 !py-2" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students found" />
      ) : (
        <div className="card divide-y divide-cream-200">
          {filtered.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-ink-900 truncate">{s.fullName}</p>
                <p className="text-xs text-ink-500 mt-0.5">{s.user.email} {s.phone ? `· ${s.phone}` : ''}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.user.isActive ? 'bg-sage-50 text-sage-600' : 'bg-rose-50 text-rose-600'}`}>
                  {s.user.isActive ? 'Active' : 'Deactivated'}
                </span>
                <button
                  onClick={() => toggleActive(s)}
                  className={`btn-ghost !py-1.5 !px-3 text-xs ${s.user.isActive ? 'text-rose-500' : 'text-sage-600'}`}
                >
                  {s.user.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
