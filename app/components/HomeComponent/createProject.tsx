'use client';

import { useState, useRef } from 'react';
import { X, Upload, Building2 } from 'lucide-react';

interface CreateProjectProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: {
    name: string;
    thumbnail?: File;
    region: string;
  }) => void;
}

export default function CreateProject({ isOpen, onClose, onSubmit }: CreateProjectProps) {
  const [projectName, setProjectName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Asia');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const regions = ['Asia', 'Europe', 'North America', 'South America'];

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('Project name is required');
      return;
    }
    onSubmit({
      name: projectName,
      thumbnail: thumbnailFile || undefined,
      region: selectedRegion,
    });
    resetForm();
  };

  const resetForm = () => {
    setProjectName('');
    setSelectedRegion('Asia');
    setThumbnailPreview(null);
    setThumbnailFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-grey-500 bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="projectName" className="block text-sm font-semibold text-gray-900 mb-2">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">e.g., Building A, Bridge Project</p>
            </div>

            {/* Region Selection */}
            <div>
              <label htmlFor="region" className="block text-sm font-semibold text-gray-900 mb-2">
                Region
              </label>
              <select
                id="region"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
              >
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Project Thumbnail
              </label>

              {/* Preview or Upload Area */}
              {thumbnailPreview ? (
                <div className="relative group">
                  <img src={thumbnailPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg"/>
                  <div className="absolute inset-0 bg-grey-500 bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Upload size={24} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="font-medium text-gray-700">Click to upload</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </div>

            {/* Default Thumbnail Option */}
            {!thumbnailPreview && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Or use default thumbnail:</p>
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailPreview('default');
                    setThumbnailFile(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  <Building2 size={18} />
                  Use Building Icon
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!projectName.trim()}
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
