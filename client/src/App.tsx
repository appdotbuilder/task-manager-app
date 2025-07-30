
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { FolderSidebar } from '@/components/FolderSidebar';
import { TaskForm } from '@/components/TaskForm';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ProjectCollaboration } from '@/components/ProjectCollaboration';
import { ReminderNotifications } from '@/components/ReminderNotifications';
import { UserAuth } from '@/components/UserAuth';
import type { Task, Folder, Project, User, TaskStatus } from '../../server/src/schema';

interface TaskFormData {
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: Date | null;
  folder_id: number | null;
}

function App() {
  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // UI states
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'projects'>('personal');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Load folders, tasks, and projects for the current user
      const [foldersData, tasksData, projectsData] = await Promise.all([
        trpc.getFolders.query({ userId: currentUser.id }),
        trpc.getTasks.query({ userId: currentUser.id, folderId: selectedFolder || undefined }),
        trpc.getProjects.query({ userId: currentUser.id })
      ]);
      
      setFolders(foldersData);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Since handlers are stubs, we'll show a notification about this
      console.log('📝 Note: Backend handlers are stubs - using empty data');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedFolder]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Task operations
  const handleCreateTask = async (taskData: TaskFormData) => {
    if (!currentUser) return;
    
    try {
      const newTask = await trpc.createTask.mutate({
        ...taskData,
        user_id: currentUser.id,
        folder_id: selectedFolder
      });
      
      setTasks((prev: Task[]) => [...prev, newTask]);
      setShowTaskForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      await trpc.updateTask.mutate({
        id: taskId,
        ...updates
      });
      
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => task.id === taskId ? { ...task, ...updates } : task)
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleTaskStatusChange = (taskId: number, newStatus: TaskStatus) => {
    handleUpdateTask(taskId, { status: newStatus });
  };

  // Folder operations
  const handleCreateFolder = async (name: string, parentId: number | null = null) => {
    if (!currentUser) return;
    
    try {
      const newFolder = await trpc.createFolder.mutate({
        name,
        parent_id: parentId,
        user_id: currentUser.id
      });
      
      setFolders((prev: Folder[]) => [...prev, newFolder]);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  // User authentication
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTasks([]);
    setFolders([]);
    setProjects([]);
    setSelectedFolder(null);
    setSelectedProject(null);
  };

  // Task statistics
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((task: Task) => task.status === 'todo').length,
    inProgress: tasks.filter((task: Task) => task.status === 'in_progress').length,
    completed: tasks.filter((task: Task) => task.status === 'completed').length
  };

  const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  const handleTabChange = (value: string) => {
    if (value === 'personal' || value === 'projects') {
      setActiveTab(value);
    }
  };

  if (!currentUser) {
    return <UserAuth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                📋 TaskFlow
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {currentUser.name}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <ReminderNotifications userId={currentUser.id} />
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <span className="text-2xl">📝</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStats.todo}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <span className="text-2xl">🔄</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStats.completed}</div>
              <Progress value={completionRate} className="mt-2 bg-white/20" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📁 Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-2 mx-4 mb-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="personal" className="px-4 pb-4">
                    <FolderSidebar
                      folders={folders}
                      selectedFolder={selectedFolder}
                      onSelectFolder={setSelectedFolder}
                      onCreateFolder={handleCreateFolder}
                    />
                  </TabsContent>
                  
                  <TabsContent value="projects" className="px-4 pb-4">
                    <ProjectCollaboration
                      projects={projects}
                      currentUser={currentUser}
                      selectedProject={selectedProject}
                      onSelectProject={setSelectedProject}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Main Task Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    🎯 Tasks
                    {selectedFolder && (
                      <Badge variant="outline">
                        {folders.find((f: Folder) => f.id === selectedFolder)?.name || 'Unknown Folder'}
                      </Badge>
                    )}
                  </CardTitle>
                  
                  <Button onClick={() => setShowTaskForm(true)} className="bg-blue-600 hover:bg-blue-700">
                    ➕ Add Task
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading tasks...</span>
                  </div>
                ) : (
                  <KanbanBoard
                    tasks={tasks}
                    onTaskStatusChange={handleTaskStatusChange}
                    onEditTask={setEditingTask}
                    onDeleteTask={handleDeleteTask}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Task Form Dialog */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>➕ Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your {selectedFolder ? 'selected folder' : 'personal tasks'}.
            </DialogDescription>
          </DialogHeader>
          
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowTaskForm(false)}
            folders={folders}
            selectedFolder={selectedFolder}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open: boolean) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>✏️ Edit Task</DialogTitle>
            <DialogDescription>
              Update your task details.
            </DialogDescription>
          </DialogHeader>
          
          {editingTask && (
            <TaskForm
              task={editingTask}
              onSubmit={(updates: TaskFormData) => handleUpdateTask(editingTask.id, updates)}
              onCancel={() => setEditingTask(null)}
              folders={folders}
              selectedFolder={selectedFolder}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stub notification for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-md text-sm max-w-sm">
          <strong>Development Note:</strong> Backend handlers are stubs. The app demonstrates full UI functionality with empty data from the API.
        </div>
      )}
    </div>
  );
}

export default App;
