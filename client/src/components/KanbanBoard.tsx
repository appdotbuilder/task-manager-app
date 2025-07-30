
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Task, TaskStatus } from '../../../server/src/schema';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
}

export function KanbanBoard({ tasks, onTaskStatusChange, onEditTask, onDeleteTask }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  const columns: { status: TaskStatus; title: string; icon: string; color: string }[] = [
    { status: 'todo', title: 'To Do', icon: '⏳', color: 'bg-gray-50 border-gray-200' },
    { status: 'in_progress', title: 'In Progress', icon: '🔄', color: 'bg-blue-50 border-blue-200' },
    { status: 'completed', title: 'Completed', icon: '✅', color: 'bg-green-50 border-green-200' }
  ];

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      onTaskStatusChange(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: TaskStatus) => 
    tasks.filter((task: Task) => task.status === status);

  const getPriorityColor = (dueDate: Date | null) => {
    if (!dueDate) return 'bg-gray-100 text-gray-800';
    
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'bg-red-100 text-red-800'; // Overdue
    if (daysDiff <= 1) return 'bg-orange-100 text-orange-800'; // Due soon
    if (daysDiff <= 3) return 'bg-yellow-100 text-yellow-800'; // Due this week
    return 'bg-blue-100 text-blue-800'; // Future
  };

  const formatDueDate = (dueDate: Date | null) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return `Overdue by ${Math.abs(daysDiff)} days`;
    if (daysDiff === 0) return 'Due today';
    if (daysDiff === 1) return 'Due tomorrow';
    return `Due in ${daysDiff} days`;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
        <p className="text-gray-500">Create your first task to get started with your workflow!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div
          key={column.status}
          className={`rounded-lg border-2 border-dashed ${column.color} p-4 min-h-[400px]`}
          onDragOver={handleDragOver}
          onDrop={(e: React.DragEvent) => handleDrop(e, column.status)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-xl">{column.icon}</span>
              {column.title}
            </h3>
            <Badge variant="secondary" className="bg-white">
              {getTasksByStatus(column.status).length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {getTasksByStatus(column.status).map((task: Task) => (
              <Card
                key={task.id}
                className="cursor-move hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                draggable
                onDragStart={(e: React.DragEvent) => handleDragStart(e, task)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditTask(task)}>
                          ✏️ Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteTaskId(task.id)}
                          className="text-red-600"
                        >
                          🗑️ Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {task.due_date && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(task.due_date)}`}
                      >
                        📅 {formatDueDate(task.due_date)}
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                      📅 {task.created_at.toLocaleDateString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {getTasksByStatus(column.status).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">{column.icon}</div>
                <p className="text-sm">Drop tasks here</p>
              
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open: boolean) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTaskId) {
                  onDeleteTask(deleteTaskId);
                  setDeleteTaskId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
