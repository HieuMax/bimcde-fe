'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Grid3x3,
  ChevronDown,
  MoreVertical,
  ListTree,
} from 'lucide-react';
import CreateProject from '@/app/components/HomeComponent/createProject';
import { getProjects } from '../../../types/api';

type Project = {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function ProjectView() {
  const router = useRouter();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data: Project[] = await getProjects();
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const regions = ['All Regions', 'Asia', 'Europe', 'North America', 'South America'];

  /* ===== CREATE PROJECT (UI MOCK) ===== */
  const handleCreateProject = (newProject: {
    name: string;
    thumbnail?: File;
    region: string;
  }) => {
    const project: Project = {
      _id: crypto.randomUUID(), // ✅ string id
      name: newProject.name,
      createdAt: new Date().toISOString(),
    };

    setProjects(prev => [project, ...prev]);
    setIsCreateOpen(false);
  };

  const filteredProjects =
    selectedRegion === 'All Regions'
      ? projects
      : projects;

  if (loading) {
    return <div className="p-6 text-gray-600">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="w-full p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          New
        </button>
      </div>

      {/* CONTROLS */}
      <div className="bg-white rounded-lg shadow mb-6 p-4 flex justify-between">
        <div className="flex gap-4">
          <div className="relative">
            <button
              onClick={() => setIsRegionOpen(!isRegionOpen)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
            >
              {selectedRegion}
              <ChevronDown size={18} />
            </button>

            {isRegionOpen && (
              <div className="absolute mt-1 bg-white border rounded shadow z-10">
                {regions.map(region => (
                  <button
                    key={region}
                    onClick={() => {
                      setSelectedRegion(region);
                      setIsRegionOpen(false);
                    }}
                    className="block px-4 py-2 w-full text-left hover:bg-blue-50"
                  >
                    {region}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setViewMode('grid')}>
            <Grid3x3 />
          </button>
          <button onClick={() => setViewMode('list')}>
            <ListTree />
          </button>
        </div>
      </div>

      {/* GRID */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-4 gap-4">
          {filteredProjects.map(project => (
            <div
              key={project._id}
              onClick={() => router.push(`/projects/${project._id}`)}
              className="bg-white rounded shadow cursor-pointer"
            >
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Preview</span>
              </div>
              <div className="p-4 font-medium">{project.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* LIST */}
      {viewMode === 'list' && (
        <div className="bg-white rounded shadow">
          <table className="w-full">
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr
                  key={project._id}
                  onClick={() => router.push(`/projects/${project._id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4">{project.name}</td>
                  <td className="p-4 text-sm text-gray-500">
                    {index === 0 ? '0 B' : '109 MB'}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : '--'}
                  </td>
                  <td className="p-4 text-right">
                    <MoreVertical />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateProject
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}