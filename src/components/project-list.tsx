"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string) => void;
}

export default function ProjectList({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
}: ProjectListProps) {
  const [newProjectName, setNewProjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="p-2 space-y-2">
      <nav className="space-y-1">
        {projects.map((project) => (
          <Button
            key={project.id}
            variant={project.id === selectedProjectId ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSelectProject(project.id)}
          >
            {project.name}
          </Button>
        ))}
      </nav>
      <div className="px-2 pt-2">
        {isAdding ? (
          <div className="space-y-2">
            <Input
              placeholder="New project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddProject}>Add</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full justify-start" onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>
    </div>
  );
}
