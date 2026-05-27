import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search, Loader2,
  ExternalLink, List,
} from 'lucide-react';
import {
  GameTypePill,
  GameTypeSelector,
  GAME_TYPE_LEGACY_CONFIG,
} from '../components/mockTest/gameTypeLegacyConfig';

/** @deprecated Import from gameTypeLegacyConfig or constants/gameTypes */
export const GAME_TYPE_CONFIG = GAME_TYPE_LEGACY_CONFIG;
import { mockTestService } from '../services';
import { useMockTestStore } from '../store';
import { useMockTestQuestionsStore } from '../store/mockTestQuestionsStore';
import { MockTest } from '../types';
import { useNavigate } from 'react-router-dom';

// ─── Game type config (legacy pill styles for mock tests) ─────────────────────

import type { GameTypeId } from '../constants/gameTypes';

export type { GameTypeId };

// ─── Form data ────────────────────────────────────────────────────────────────

interface CreateTestFormData {
  title: string;
  description: string;
  durationMinutes: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// ─── Main page ────────────────────────────────────────────────────────────────

export const MockTestManagement: React.FC = () => {
  const {
    mockTests, isLoading, error,
    setMockTests, addMockTest, updateMockTest,
    deleteMockTest, togglePublishStatus,
    setLoading, setError,
  } = useMockTestStore();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [selectedGameTypes, setSelectedGameTypes] = useState<GameTypeId[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { getQuestions, deleteTestQuestions } = useMockTestQuestionsStore();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<CreateTestFormData>({ defaultValues: { difficulty: 'medium' } });

  // Load tests
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const tests = await mockTestService.getAllMockTests();
        setMockTests(tests);
      } catch {
        setError('Failed to load mock tests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setMockTests, setLoading, setError]);

  // Filter + paginate
  const filtered = mockTests.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const onSubmit = async (data: CreateTestFormData) => {
    if (selectedGameTypes.length === 0) {
      alert('Please select at least one game type');
      return;
    }
    try {
      const payload = {
        ...data,
        enabledGameTypes: selectedGameTypes,
        totalQuestions: editingTest ? getQuestions(editingTest.id).length : 0,
        published: editingTest?.published ?? false,
      } as any;
      if (editingTest) {
        const updated = await mockTestService.updateMockTest(editingTest.id, payload);
        updateMockTest(editingTest.id, updated);
        handleCloseDialog();
      } else {
        const newTest = await mockTestService.createMockTest({ ...payload, published: false });
        addMockTest(newTest);
        handleCloseDialog();
        navigate(`/admin/mock-tests/${newTest.id}`);
      }
    } catch {
      setError('Failed to save mock test');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mock test?')) return;
    try {
      await mockTestService.deleteMockTest(id);
      deleteTestQuestions(id);
      deleteMockTest(id);
    } catch {
      setError('Failed to delete');
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await mockTestService.togglePublish(id);
      const t = mockTests.find((x) => x.id === id);
      if (t) updateMockTest(id, { published: !t.published });
    } catch {
      setError('Failed to update status');
    }
  };

  const handleViewQuestions = (testId: string) => {
    navigate(`/admin/mock-tests/${testId}`);
  };

  const handleEdit = (test: MockTest) => {
    setEditingTest(test);
    setSelectedGameTypes((test as any).enabledGameTypes ?? []);
    reset({
      title: test.title,
      description: test.description,
      durationMinutes: test.durationMinutes,
      category: test.category,
      difficulty: test.difficulty,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTest(null);
    setSelectedGameTypes([]);
    reset({ difficulty: 'medium' });
  };

  const openCreateDialog = () => {
    setEditingTest(null);
    reset({ title: '', description: '', durationMinutes: 30, category: '', difficulty: 'medium' });
    setSelectedGameTypes([]);
    setIsDialogOpen(true);
  };

  const handleOpenTest = (id: string) => {
    navigate(`/admin/mock-tests/${id}/view`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Mock Test Management</h1>
        <p className="text-gray-600">
          Create multi-game-type tests — combine Puzzle, Switch, Grid, Inductive &amp; Motion challenges
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Search + Create */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="gap-2">
                  <Plus size={18} /> Create Test
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTest ? 'Edit assessment' : 'Create assessment'}</DialogTitle>
                  <DialogDescription>
                    Set up the assessment. Add and manage questions on the detail page after saving.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Basic info */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <Input
                      {...register('title', { required: 'Title is required' })}
                      placeholder="e.g. Aptitude Test Batch 1"
                      className="mt-1"
                    />
                    {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <Input
                      {...register('description', { required: 'Description is required' })}
                      placeholder="Brief description of this test"
                      className="mt-1"
                    />
                    {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Duration (minutes)</label>
                      <Input
                        type="number"
                        {...register('durationMinutes', {
                          required: true,
                          min: { value: 1, message: 'Min 1 min' },
                        })}
                        placeholder="30"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <Input {...register('category')} placeholder="e.g. Aptitude" className="mt-1" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Difficulty</label>
                    <select
                      {...register('difficulty')}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* ── Game type selector ── */}
                  <div className="border-t pt-4">
                    <GameTypeSelector
                      selected={selectedGameTypes}
                      onChange={setSelectedGameTypes}
                    />
                  </div>

                  {!editingTest && selectedGameTypes.length > 0 && (
                    <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
                      After creating, you will be taken to the assessment page to add questions by round.
                    </p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={selectedGameTypes.length === 0}>
                      {editingTest ? 'Save settings' : 'Create & add questions'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Tests table */}
      <Card>
        <CardHeader>
          <CardTitle>Mock Tests</CardTitle>
          <CardDescription>{filtered.length} test{filtered.length !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-3">No tests yet. Create your first mock test!</p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus size={16} /> Create Test
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Game Types</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div>
                            <button
                              type="button"
                              className="font-medium text-left text-blue-700 hover:underline"
                              onClick={() => handleViewQuestions(test.id)}
                            >
                              {test.title}
                            </button>
                            <p className="text-sm text-gray-500">{test.description}</p>
                            {test.category && (
                              <span className="text-xs text-gray-400">{test.category}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {((test as any).enabledGameTypes ?? []).map((g: string) => (
                              <GameTypePill key={g} gameType={g} small />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{test.durationMinutes} min</TableCell>
                        <TableCell>{getQuestions(test.id).length || test.totalQuestions}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              test.published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {test.published ? 'Published' : 'Draft'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-blue-700 border-blue-200"
                              onClick={() => handleViewQuestions(test.id)}
                            >
                              <List size={14} />
                              Questions
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenTest(test.id)}
                              title="Preview exam"
                            >
                              <ExternalLink size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePublish(test.id)}
                              title={test.published ? 'Unpublish' : 'Publish'}
                            >
                              {test.published ? <Eye size={15} /> : <EyeOff size={15} />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(test)}>
                              <Edit2 size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(test.id)}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
