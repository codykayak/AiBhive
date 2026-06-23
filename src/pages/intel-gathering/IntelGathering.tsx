import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface DBPRRecord {
  id: string;
  license_number: string;
  name: string;
  status: string;
}

export default function IntelGathering() {
  const [records, setRecords] = useState<DBPRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch('/api/intel-gathering/dbpr');
        if (!response.ok) {
          throw new Error('Failed to fetch DBPR records');
        }
        const data = await response.json();
        setRecords(data.records || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 mb-4"
        >
          <div className="w-12 h-12 bg-bee-amber/10 rounded-xl flex items-center justify-center border border-bee-amber/20">
            <Search className="w-6 h-6 text-bee-amber" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white">Intel Gathering</h1>
        </motion.div>
        <p className="text-xl text-slate-400 max-w-3xl">
          A human intelligence gathering operation. Viewing filtered records from the Florida DBPR API.
        </p>
      </div>

      <div className="bg-bee-black/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-medium text-white flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-bee-amber" />
            Filtered DBPR Records (Null and Void / Inactive)
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="w-8 h-8 text-bee-amber animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-400 py-8 text-center bg-red-400/10 rounded-lg border border-red-400/20">
              {error}
            </div>
          ) : records.length === 0 ? (
            <div className="text-slate-400 py-12 text-center">
              No records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 text-sm font-medium text-slate-400 px-4">License Number</th>
                    <th className="pb-4 text-sm font-medium text-slate-400 px-4">Name</th>
                    <th className="pb-4 text-sm font-medium text-slate-400 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {records.map((record) => (
                    <motion.tr
                      key={record.id || record.license_number}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-4 text-white font-mono text-sm">{record.license_number}</td>
                      <td className="py-4 px-4 text-slate-300">{record.name}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20">
                          {record.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
