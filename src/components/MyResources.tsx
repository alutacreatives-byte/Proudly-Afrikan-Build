import React, { useState } from 'react';
import {
  FolderCheck,
  Search,
  Trash2,
  Edit3,
  Star,
  Copy,
  FileCheck2,
  FileSpreadsheet,
  CalendarCheck2,
  FileQuestion,
  BookOpenCheck,
  Presentation,
  GraduationCap,
  Route,
  Plus,
  Check,
} from 'lucide-react';
import { SavedResource, ToolType } from '../types';

interface MyResourcesProps {
  resources: SavedResource[];
  onOpenResource: (resource: SavedResource) => void;
  onDeleteResource: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicateResource: (resource: SavedResource) => void;
  onStartNewBuild: () => void;
}

const TOOL_ICONS: Record<ToolType, React.ElementType> = {
  exam: FileCheck2,
  worksheet: FileSpreadsheet,
  'lesson-plan': CalendarCheck2,
  'pdf-quiz': FileQuestion,
  'pdf-studypack': BookOpenCheck,
  presentation: Presentation,
  'course-builder': GraduationCap,
  'learning-path': Route,
};

const TOOL_LABELS: Record<ToolType, string> = {
  exam: 'Exam',
  worksheet: 'Worksheet',
  'lesson-plan': 'Lesson Plan',
  'pdf-quiz': 'PDF Quiz',
  'pdf-studypack': 'Study Pack',
  presentation: 'Presentation',
  'course-builder': 'Course',
  'learning-path': 'Learning Path',
};

export const MyResources: React.FC<MyResourcesProps> = ({
  resources,
  onOpenResource,
  onDeleteResource,
  onToggleFavorite,
  onDuplicateResource,
  onStartNewBuild,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredResources = (resources || []).filter((res) => {
    if (!res) return false;
    const title = res.title || '';
    const subject = res.subject || '';
    const topic = res.topic || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || res.toolType === selectedType;
    const matchesFav = !onlyFavorites || res.isFavorite;
    return matchesSearch && matchesType && matchesFav;
  });

  const handleCopyJson = (res: SavedResource) => {
    navigator.clipboard.writeText(JSON.stringify(res.data, null, 2));
    setCopiedId(res.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <span className="font-mono-code text-xs sm:text-sm font-bold text-[#D63651] uppercase tracking-widest block mb-2">
          SAVED BUILDS LIBRARY
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-300">
          <div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-[#181716] uppercase tracking-tight leading-none">
              MY BUILDS
            </h1>
            <p className="font-mono-code text-sm sm:text-base text-stone-700 font-medium mt-1.5">
              Access, inspect, duplicate, edit and export all learning resources created in Proudly Afrikan Build.
            </p>
          </div>

          <button
            onClick={onStartNewBuild}
            className="clay-btn-crimson px-6 py-3 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>NEW BUILD ↗</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="clay-card-3d p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by title, subject, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full clay-input pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono-code text-[#181716] placeholder-stone-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 text-xs sm:text-sm font-mono-code font-bold uppercase transition shrink-0 cursor-pointer ${
              selectedType === 'all'
                ? 'clay-btn-dark'
                : 'clay-pill-3d text-stone-900'
            }`}
          >
            All ({(resources || []).length})
          </button>

          {(Object.keys(TOOL_LABELS) as ToolType[]).map((type) => {
            const count = (resources || []).filter((r) => r && r.toolType === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 text-xs sm:text-sm font-mono-code font-bold uppercase transition shrink-0 cursor-pointer ${
                  selectedType === type
                    ? 'clay-btn-dark'
                    : 'clay-pill-3d text-stone-900'
                }`}
              >
                {TOOL_LABELS[type]} ({count})
              </button>
            );
          })}

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-4 py-2 text-xs sm:text-sm font-mono-code font-bold uppercase transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              onlyFavorites
                ? 'clay-btn-dark'
                : 'clay-pill-3d text-stone-900'
            }`}
          >
            <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-[#D63651] text-[#D63651]' : 'text-stone-400'}`} />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => {
            const Icon = TOOL_ICONS[res.toolType] || FolderCheck;

            return (
              <div
                key={res.id}
                className="clay-card-3d-interactive p-6 sm:p-7 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 clay-btn-dark rounded-xl flex items-center justify-center font-bold shrink-0">
                        <Icon className="w-5 h-5 text-[#E6425E]" />
                      </div>
                      <span className="font-mono-code text-xs font-bold uppercase tracking-wider text-[#D63651] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                        {TOOL_LABELS[res.toolType]}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(res.id)}
                      className="text-stone-400 hover:text-[#D63651] transition p-1.5 cursor-pointer rounded-lg hover:bg-stone-200/50"
                      title={res.isFavorite ? 'Remove favorite' : 'Mark as favorite'}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          res.isFavorite ? 'fill-[#D63651] text-[#D63651]' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="w-full h-[1px] bg-stone-200/90 my-3.5"></div>

                  {/* Title & Subject */}
                  <h3
                    onClick={() => onOpenResource(res)}
                    className="font-display font-black text-xl sm:text-2xl text-[#181716] group-hover:text-[#D63651] transition-colors cursor-pointer line-clamp-2 uppercase leading-tight"
                  >
                    {res.title}
                  </h3>

                  <div className="mt-2.5 font-mono-code text-xs sm:text-sm text-stone-700 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#181716]">{res.subject}</span>
                    <span>•</span>
                    <span className="font-semibold">{res.gradeLevel}</span>
                  </div>

                  {/* Tags */}
                  {res.tags && Array.isArray(res.tags) && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {res.tags.slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="font-mono-code text-xs font-bold bg-white/80 border border-stone-300 text-stone-700 px-2.5 py-0.5 rounded-md uppercase"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 pt-4 border-t border-stone-200/90 flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <button
                    onClick={() => onOpenResource(res)}
                    className="clay-btn-dark py-2 px-4 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>OPEN &amp; EDIT ↗</span>
                  </button>

                  <div className="flex items-center gap-1 text-stone-600">
                    <button
                      onClick={() => handleCopyJson(res)}
                      className="p-2 hover:text-[#181716] hover:bg-stone-200/50 rounded-lg transition cursor-pointer"
                      title="Copy JSON payload"
                    >
                      {copiedId === res.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDuplicateResource(res)}
                      className="p-2 hover:text-[#181716] hover:bg-stone-200/50 rounded-lg transition cursor-pointer"
                      title="Duplicate Resource"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteResource(res.id)}
                      className="p-2 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="clay-card-3d p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-16 h-16 clay-btn-dark rounded-2xl flex items-center justify-center mb-4">
            <FolderCheck className="w-8 h-8 text-[#E6425E]" />
          </div>
          <h3 className="font-display font-black text-2xl text-[#181716] uppercase">No builds found</h3>
          <p className="font-mono-code text-sm sm:text-base text-stone-700 max-w-md mt-2 leading-relaxed font-normal">
            {searchTerm || selectedType !== 'all' || onlyFavorites
              ? 'Try changing your search keywords or filter settings.'
              : 'You have not saved any builds yet. Pick a generator from the Build homepage to create your first educational resource!'}
          </p>
          <button
            onClick={onStartNewBuild}
            className="mt-6 clay-btn-crimson px-6 py-3 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <span>GO TO BUILD HOME ↗</span>
          </button>
        </div>
      )}
    </div>
  );
};
