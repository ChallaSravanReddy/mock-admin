import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Loader2 } from 'lucide-react';
import { swithChallengeService } from '../services/swithChallengeService';
import { useSwithChallengeStore } from '../store/swithChallengeStore';
import { SwithChallengeBuilder } from '../components/puzzle/SwithChallengeBuilder';
import { SwithChallengeGame, SwithChallengeGameFormData } from '../types/swithChallenge';

export const SwithChallengeManagement: React.FC = () => {
  const {
    games,
    isLoading,
    error,
    setGames,
    addGame,
    updateGame,
    deleteGame,
    togglePublishStatus,
    setLoading,
    setError,
  } = useSwithChallengeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<SwithChallengeGame | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load games
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const allGames = await swithChallengeService.getAllGames();
        setGames(allGames);
      } catch (err) {
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [setGames, setLoading, setError]);

  // Filter games
  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSaveGame = async (formData: SwithChallengeGameFormData) => {
    try {
      if (editingGame) {
        const updated = await swithChallengeService.updateGame(editingGame.id, formData);
        updateGame(editingGame.id, updated);
      } else {
        const newGame = await swithChallengeService.createGame(formData);
        addGame(newGame);
      }
      setIsDialogOpen(false);
      setEditingGame(null);
    } catch (err) {
      setError('Failed to save game');
    }
  };

  const handleEditGame = (game: SwithChallengeGame) => {
    setEditingGame(game);
    setIsDialogOpen(true);
  };

  const handleDeleteGame = async (id: string) => {
    if (confirm('Are you sure you want to delete this game?')) {
      try {
        setIsDeleting(id);
        await swithChallengeService.deleteGame(id);
        deleteGame(id);
      } catch (err) {
        setError('Failed to delete game');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const updated = await swithChallengeService.togglePublish(id);
      updateGame(id, updated);
    } catch (err) {
      setError('Failed to update game');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Swith Challenge Games</h1>
          <p className="text-gray-600 mt-1">Create and manage symbol ordering challenges</p>
        </div>
        <Button
          onClick={() => {
            setEditingGame(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Game
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search games by title or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Games Table */}
      <Card>
        <CardHeader>
          <CardTitle>Games ({filteredGames.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No games found. Create one to get started!</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGames.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{game.title}</div>
                          <div className="text-sm text-gray-500">{game.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            game.difficulty === 'easy'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : game.difficulty === 'medium'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          {game.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{game.timeDuration}s</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            game.published
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {game.published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(game.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePublish(game.id)}
                            title={game.published ? 'Unpublish' : 'Publish'}
                          >
                            {game.published ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGame(game)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGame(game.id)}
                            disabled={isDeleting === game.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isDeleting === game.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

      {/* Builder Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGame ? 'Edit Game' : 'Create New Game'}</DialogTitle>
            <DialogDescription>
              {editingGame
                ? 'Update the game configuration below'
                : 'Set up a new Swith Challenge game'}
            </DialogDescription>
          </DialogHeader>
          <SwithChallengeBuilder
            game={editingGame}
            onSave={handleSaveGame}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingGame(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
