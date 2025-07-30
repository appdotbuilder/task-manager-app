
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { trpc } from '@/utils/trpc';
import type { Project, User, CreateProjectInput } from '../../../server/src/schema';

interface ProjectCollaborationProps {
  projects: Project[];
  currentUser: User;
  selectedProject: number | null;
  onSelectProject: (projectId: number | null) => void;
}

export function ProjectCollaboration({ 
  projects, 
  currentUser, 
  selectedProject, 
  onSelectProject 
}: ProjectCollaborationProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<CreateProjectInput>({
    name: '',
    description: null,
    owner_id: currentUser.id
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const newProject = await trpc.createProject.mutate(projectData);
      console.log('Project created:', newProject);
      
      // Reset form
      setProjectData({
        name: '',
        description: null,
        owner_id: currentUser.id
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm text-gray-700">PROJECTS</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              ➕
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>🚀 Create New Project</DialogTitle>
              <DialogDescription>
                Create a project to collaborate with team members on shared tasks.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    value={projectData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setProjectData((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={projectData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setProjectData((prev: CreateProjectInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Describe your project (optional)"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : '🚀 Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project List */}
      <div className="space-y-2">
        {projects.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <div className="text-3xl mb-2">🚀</div>
            <p>No projects yet</p>
            <p className="text-xs">Create one to start collaborating</p>
          </div>
        ) : (
          projects.map((project: Project) => (
            <Card 
              key={project.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedProject === project.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => onSelectProject(project.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      🚀 {project.name}
                      {project.owner_id === currentUser.id && (
                        <Badge variant="secondary" className="text-xs">
                          Owner
                        </Badge>
                      )}
                    </h4>
                    
                    {project.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {currentUser.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500">
                        Created {project.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selected Project Actions */}
      {selectedProject && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              🎯 Project Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button size="sm" variant="outline" className="w-full justify-start">
              👥 Manage Members
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              📊 View Analytics
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              ⚙️ Project Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Collaboration hint */}
      {projects.length === 0 && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md text-sm text-purple-800">
          <strong>🤝 Collaboration:</strong> Projects allow you to work together with team members on shared tasks and goals!
        </div>
      )}
    </div>
  );
}
