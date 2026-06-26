import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Search, MapPin, Building2, Filter, Globe, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DBPRRecord {
  id: string;
  license_number: string;
  name: string;
  status: string;
  location?: string;
  type?: string;
}

type Props = { embedded?: boolean };

export default function IntelGathering({ embedded = false }: Props) {
  const [records, setRecords] = useState<DBPRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Firecrawl states
  const [targetUrl, setTargetUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<string | null>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  const handleFirecrawl = async () => {
    if (!targetUrl) return;
    setIsCrawling(true);
    setCrawlError(null);
    setCrawlResult(null);

    try {
      const response = await fetch('/api/intel-gathering/firecrawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to scrape the URL');
      }

      const data = await response.json();
      setCrawlResult(data.data?.markdown || 'No markdown data extracted.');
    } catch (err) {
      if (err instanceof Error) {
        setCrawlError(err.message);
      } else {
        setCrawlError('An unknown error occurred during scanning.');
      }
    } finally {
      setIsCrawling(false);
    }
  };

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
    <div className={embedded ? 'px-3 sm:px-4 py-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'}>
      <div className={embedded ? 'mb-6' : 'mb-12'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 mb-4"
        >
          <div className="w-12 h-12 bg-bee-amber/10 rounded-xl flex items-center justify-center border border-bee-amber/20">
            <Search className="w-6 h-6 text-bee-amber" />
          </div>
          <h1 className={`font-display font-bold text-white ${embedded ? 'text-2xl' : 'text-4xl'}`}>
            Intel Gathering
          </h1>
        </motion.div>
        <p className={`text-slate-400 max-w-3xl ${embedded ? 'text-sm' : 'text-xl'}`}>
          DBPR license records plus Firecrawl deep scan — same tools as aibhive.com/intel-gathering.
        </p>
      </div>

      <div className="bg-bee-black/40 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
        <div className="mb-6 border-b border-white/5 pb-4">
          <h2 className="text-lg font-medium text-white flex items-center">
            <Globe className="w-5 h-5 mr-2 text-bee-amber" />
            Deep Scan (Firecrawl)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Extract comprehensive intelligence from any business website URL.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="url"
              className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-bee-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-bee-amber focus:border-bee-amber sm:text-sm transition-colors"
              placeholder="https://example-business.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFirecrawl()}
            />
          </div>
          <button
            onClick={handleFirecrawl}
            disabled={isCrawling || !targetUrl}
            className="h-[46px] px-8 bg-bee-amber text-bee-black font-semibold rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isCrawling ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 mr-2" />
                Deep Scan
              </>
            )}
          </button>
        </div>

        {crawlError && (
          <div className="text-red-400 py-3 px-4 bg-red-400/10 rounded-lg border border-red-400/20 text-sm mb-4">
            {crawlError}
          </div>
        )}

        {crawlResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <label className="block text-sm font-medium text-slate-400 mb-2">Extracted Intelligence</label>
            <div className="bg-bee-black/60 border border-white/5 rounded-xl p-4 max-h-[400px] overflow-y-auto">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                {crawlResult}
              </pre>
            </div>
          </motion.div>
        )}
      </div>

      <div className="bg-bee-black/40 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
        <div className="mb-6 border-b border-white/5 pb-4">
          <h2 className="text-lg font-medium text-white flex items-center">
            <Filter className="w-5 h-5 mr-2 text-bee-amber" />
            DBPR License Search Filters
          </h2>
        </div>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-slate-400 mb-2">
              Business Name or License Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-bee-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-bee-amber focus:border-bee-amber sm:text-sm transition-colors"
                placeholder="Search anything..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="location" className="block text-sm font-medium text-slate-400 mb-2">
              Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                id="location"
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-bee-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-bee-amber focus:border-bee-amber sm:text-sm transition-colors"
                placeholder="City, State, or Zip"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="type" className="block text-sm font-medium text-slate-400 mb-2">
              Business Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                id="type"
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-bee-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-bee-amber focus:border-bee-amber sm:text-sm transition-colors"
                placeholder="e.g. Real Estate, Contractor"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
          </div>

          <button className="h-[42px] px-6 bg-bee-amber text-bee-black font-semibold rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5 mr-2" />
            Apply Filters
          </button>
        </div>
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
          ) : (() => {
            const filteredRecords = records.filter(record => {
              const matchesSearch = searchTerm === '' ||
                record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.license_number.toLowerCase().includes(searchTerm.toLowerCase());

              // Mock logic for location/type until backend supports it
              const recordLocation = record.location || '';
              const matchesLocation = locationFilter === '' ||
                recordLocation.toLowerCase().includes(locationFilter.toLowerCase());

              const recordType = record.type || record.name; // Fallback to name for type in our demo
              const matchesType = typeFilter === '' ||
                recordType.toLowerCase().includes(typeFilter.toLowerCase());

              return matchesSearch && matchesLocation && matchesType;
            });

            if (filteredRecords.length === 0) {
              return (
                <div className="text-slate-400 py-12 text-center">
                  No records match your filters.
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-4 text-sm font-medium text-slate-400 px-4">License Number</th>
                      <th className="pb-4 text-sm font-medium text-slate-400 px-4">Name / Type</th>
                      <th className="pb-4 text-sm font-medium text-slate-400 px-4">Location</th>
                      <th className="pb-4 text-sm font-medium text-slate-400 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRecords.map((record) => (
                      <motion.tr
                        key={record.id || record.license_number}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-4 text-white font-mono text-sm">{record.license_number}</td>
                        <td className="py-4 px-4 text-slate-300">{record.name}</td>
                        <td className="py-4 px-4 text-slate-400 text-sm">{record.location || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            record.status === 'Inactive'
                              ? 'bg-orange-400/10 text-orange-400 border-orange-400/20'
                              : 'bg-red-400/10 text-red-400 border-red-400/20'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
