
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Folder } from '../../../server/src/schema';

interface FolderSidebarProps {
  folders: Folder[];
  selectedFolder: number | null;
  onSelectFolder: (folderId: number | null) => void;
  onCreateFolder: (name: string, parentId?: number | null) => Promise<void>;
}

export function FolderSidebar({ folders, selectedFolder, onSelectFolder, onCreateFolder }: FolderSidebarProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsLoading(true);
    try {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Organize folders hierarchically (simplified - just root level for now)
  const rootFolders = folders.filter((folder: Folder) => folder.parent_id === null);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-sm text-gray-700">FOLDERS</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              ➕
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>📁 Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your tasks.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateFolder}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setNewFolderName(e.target.value)
                    }
                    placeholder="Enter folder name"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : '📁 Create Folder'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Tasks Option */}
      <Button
        variant={selectedFolder === null ? 'default' : 'ghost'}
        className="w-full justify-start text-left h-auto p-2"
        onClick={() => onSelectFolder(null)}
      >
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2">
            📋 All Tasks
          </span>
        </div>
      </Button>

      {/* Folder List */}
      <div className="space-y-1">
        {rootFolders.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            <div className="text-2xl mb-2">📁</div>
            <p>No folders yet</p>
            <p className="text-xs">Create one to organize your tasks</p>
          </div>
        ) : (
          rootFolders.map((folder: Folder) => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? 'default' : 'ghost'}
              className="w-full justify-start text-left h-auto p-2"
              onClick={() => onSelectFolder(folder.id)}
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-2">
                  📁 {folder.name}
                </span>
                {selectedFolder === folder.id && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </div>
            </Button>
          ))
        )}
      </div>

      {/* Folder creation hint */}
      {folders.length === 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <strong>💡 Tip:</strong> Create folders to organize your tasks by project, category, or priority!
        </div>
      )}
    </div>
  );
}
