
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import type { Task, Folder, TaskStatus } from '../../../server/src/schema';

interface TaskFormData {
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: Date | null;
  folder_id: number | null;
}

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  folders: Folder[];
  selectedFolder: number | null;
}

export function TaskForm({ task, onSubmit, onCancel, folders, selectedFolder }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo' as TaskStatus,
    due_date: task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
    folder_id: task?.folder_id || selectedFolder || null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData: TaskFormData = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        due_date: formData.due_date ? new Date(formData.due_date) : null,
        folder_id: formData.folder_id
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter task description (optional)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: TaskStatus) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">⏳ To Do</SelectItem>
              <SelectItem value="in_progress">🔄 In Progress</SelectItem>
              <SelectItem value="completed">✅ Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, due_date: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="folder">Folder</Label>
        <Select
          value={formData.folder_id?.toString() || 'none'}
          onValueChange={(value: string) =>
            setFormData((prev) => ({ 
              ...prev, 
              folder_id: value === 'none' ? null : parseInt(value) 
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">📋 No Folder</SelectItem>
            {folders.map((folder: Folder) => (
              <SelectItem key={folder.id} value={folder.id.toString()}>
                📁 {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : task ? '💾 Update Task' : '➕ Create Task'}
        </Button>
      </DialogFooter>
    </form>
  );
}
