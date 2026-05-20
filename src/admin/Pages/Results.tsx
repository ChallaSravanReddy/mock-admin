import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { analyticsService } from '../services';
import { useMockTestStore } from '../store';
import { AttemptResult } from '../types';

export const Results: React.FC = () => {
  const { mockTests } = useMockTestStore();
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<AttemptResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMockTest, setSelectedMockTest] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load attempts
  useEffect(() => {
    const loadAttempts = async () => {
      try {
        setIsLoading(true);
        const data = await analyticsService.getAllAttempts();
        setAttempts(data);
      } catch (error) {
        console.error('Failed to load attempts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempts();
  }, []);

  // Filter and sort attempts
  useEffect(() => {
    let filtered = attempts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (attempt) =>
          attempt.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          attempt.mockTestTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by mock test
    if (selectedMockTest) {
      filtered = filtered.filter((attempt) => attempt.mockTestId === selectedMockTest);
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'score-high':
        sorted.sort((a, b) => b.score - a.score);
        break;
      case 'score-low':
        sorted.sort((a, b) => a.score - b.score);
        break;
      case 'date':
        sorted.sort(
          (a, b) =>
            new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
        );
        break;
      case 'accuracy':
        sorted.sort((a, b) => b.accuracy - a.accuracy);
        break;
      default:
        break;
    }

    setFilteredAttempts(sorted);
    setCurrentPage(1);
  }, [attempts, searchQuery, selectedMockTest, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAttempts.length / itemsPerPage);
  const paginatedAttempts = filteredAttempts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const headers = [
      'User ID',
      'Mock Test',
      'Score',
      'Accuracy',
      'Time Taken (sec)',
      'Attempted At',
    ];
    const rows = filteredAttempts.map((attempt) => [
      attempt.userId,
      attempt.mockTestTitle,
      attempt.score,
      `${attempt.accuracy}%`,
      attempt.timeTaken,
      new Date(attempt.attemptedAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
        <p className="text-gray-600">View and analyze user test attempts and scores</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <Input
                placeholder="Search by user ID or test name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedMockTest}
              onChange={(e) => setSelectedMockTest(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tests</option>
              {mockTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Latest First</option>
              <option value="score-high">Score (High to Low)</option>
              <option value="score-low">Score (Low to High)</option>
              <option value="accuracy">Accuracy (High to Low)</option>
            </select>

            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download size={18} />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredAttempts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {filteredAttempts.length > 0
                ? Math.round(
                    filteredAttempts.reduce((sum, a) => sum + a.score, 0) / filteredAttempts.length
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {filteredAttempts.length > 0
                ? Math.round(
                    filteredAttempts.reduce((sum, a) => sum + a.accuracy, 0) /
                      filteredAttempts.length
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {filteredAttempts.length > 0
                ? Math.round(
                    (filteredAttempts.filter((a) => a.accuracy >= 70).length /
                      filteredAttempts.length) *
                      100
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attempts</CardTitle>
          <CardDescription>
            {filteredAttempts.length} attempt{filteredAttempts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading results...</p>
              </div>
            </div>
          ) : paginatedAttempts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No results found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Mock Test</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Time Taken</TableHead>
                      <TableHead>Attempted At</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">{attempt.userId}</TableCell>
                        <TableCell>{attempt.mockTestTitle}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600">{attempt.score}%</span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              attempt.accuracy >= 80
                                ? 'bg-green-100 text-green-800'
                                : attempt.accuracy >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {attempt.accuracy}%
                          </span>
                        </TableCell>
                        <TableCell>{Math.round(attempt.timeTaken / 60)} min</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(attempt.attemptedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye size={16} />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
