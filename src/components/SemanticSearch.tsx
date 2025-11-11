'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
  employee: {
    id: string;
    name: string;
    email: string;
    role?: string;
    department?: string;
    skills?: string[];
    walletAddress?: string;
  };
  score: number;
  relevance: 'high' | 'medium' | 'low';
}

export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/employees/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        console.error('Search failed:', data.error);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 Semantic Employee Search
        </h2>
        <p className="text-gray-600">
          Search by skills, role, or natural language (e.g., &quot;blockchain developer&quot; or &quot;frontend specialist&quot;)
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for employees... (e.g., 'Web3 expert' or 'React developer')"
            className="w-full px-4 py-3 pl-12 pr-24 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            disabled={loading}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="inline animate-spin mr-2" size={16} />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="inline animate-spin text-blue-600 mb-4" size={48} />
          <p className="text-gray-600">Searching with AI semantic understanding...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg">No employees found matching &quot;{query}&quot;</p>
          <p className="text-gray-500 text-sm mt-2">Try a different search term or add more employees</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {results.length} {results.length === 1 ? 'result' : 'results'}
            </h3>
            <p className="text-sm text-gray-500">Sorted by relevance</p>
          </div>

          {results.map((result, index) => (
            <div
              key={result.employee.id}
              className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-semibold text-gray-900">
                      {index + 1}. {result.employee.name}
                    </h4>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getRelevanceColor(result.relevance)}`}
                    >
                      {result.relevance.toUpperCase()} ({(result.score * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">{result.employee.email}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {result.employee.role && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Role:</span>
                        <span className="text-sm text-gray-900 ml-2">{result.employee.role}</span>
                      </div>
                    )}
                    {result.employee.department && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Department:</span>
                        <span className="text-sm text-gray-900 ml-2">{result.employee.department}</span>
                      </div>
                    )}
                  </div>

                  {result.employee.skills && result.employee.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-700">Skills:</span>
                      {result.employee.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {result.employee.walletAddress && (
                    <div className="text-sm text-gray-500 font-mono">
                      Wallet: {result.employee.walletAddress.slice(0, 10)}...{result.employee.walletAddress.slice(-8)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Semantic search understands meaning, not just keywords.
              Try searching for &quot;crypto expert&quot; to find blockchain developers, or &quot;UI specialist&quot; to find frontend engineers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
