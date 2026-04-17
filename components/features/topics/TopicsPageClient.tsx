"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  SlidersHorizontal,
  ListFilter,
  Search,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Topic } from "./topic-types";
import { TopicRow } from "./TopicRow";
import { TopicPropertiesPanel } from "./TopicPropertiesPanel";
import { topicsService } from "@/services/topics.service";
import { toast } from "sonner";
import {
  MultiCheckboxFilterPopover,
  TagsFilterPopover,
  TopicFilterOption,
  TopicMatchMode,
} from "./filters/TopicsFilters";
import { topicSettingsService } from "@/services/topicSettings.service";

export const TopicsPageClient: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createTopic, setCreateTopic] = useState<Topic | null>(null);
  const [search, setSearch] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [viewFilter, setViewFilter] = useState("Active Topics");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [topicTypes, setTopicTypes] = useState<TopicFilterOption[]>([]);
  const [topicStatuses, setTopicStatuses] = useState<TopicFilterOption[]>([]);
  const [topicPriorities, setTopicPriorities] = useState<TopicFilterOption[]>(
    [],
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsMatchMode, setTagsMatchMode] = useState<TopicMatchMode>("any");

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedId) ?? null,
    [selectedId, topics],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topics.filter((t) => {
      if (assignedToMe && !t.assignedToMe) return false;

      if (selectedTypes.length > 0 && !selectedTypes.includes(t.type))
        return false;
      if (
        selectedPriorities.length > 0 &&
        !selectedPriorities.includes(t.priority)
      )
        return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(t.status))
        return false;

      if (selectedTags.length > 0) {
        const topicTagSet = new Set(t.tags);
        const matched = selectedTags.filter((tag) => topicTagSet.has(tag));
        if (tagsMatchMode === "all") {
          if (matched.length !== selectedTags.length) return false;
        } else {
          // any/atleast
          if (matched.length < 1) return false;
        }
      }

      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.authorName.toLowerCase().includes(q)
      );
    });
  }, [
    search,
    assignedToMe,
    topics,
    selectedTypes,
    selectedStatuses,
    selectedPriorities,
    selectedTags,
    tagsMatchMode,
  ]);

  const isPanelOpen = !!selectedTopic || !!createTopic;

  // Fetch topic instances from BE
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const items = await topicsService.getTopicItems(projectId);
        if (!alive) return;
        setTopics(items);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load topics");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId]);

  useEffect(() => {
    const topicId = searchParams.get("openTopicId");
    if (!topicId) return;
    setCreateTopic(null);
    setSelectedId(topicId);
    router.replace(`/projects/${projectId}/topics`, { scroll: false });
  }, [searchParams, router, projectId]);

  // Fetch topic settings (options for filters) from BE
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { topicTypes, topicStatuses, topicPriorities } =
          await topicSettingsService.getAll(projectId);
        if (!alive) return;

        const mapOpt = (o: any): TopicFilterOption => ({
          value: o.name,
          label: o.name,
          color: o.color,
          icon: o.icon,
        });

        setTopicTypes(
          (topicTypes ?? [])
            .filter((x: any) => x.visible !== false)
            .map(mapOpt),
        );
        setTopicStatuses(
          (topicStatuses ?? [])
            .filter((x: any) => x.visible !== false)
            .map(mapOpt),
        );
        setTopicPriorities(
          (topicPriorities ?? [])
            .filter((x: any) => x.visible !== false)
            .map(mapOpt),
        );
      } catch (e) {
        console.error(e);
        toast.error("Failed to load topic filter settings");
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of topics) {
      for (const tag of t.tags ?? []) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [topics]);

  const handleTopicRowSelect = (topicId: string) => {
    setSelectedId((prev) => (prev === topicId ? null : topicId));
    setCreateTopic(null);
  };

  const handleCreateNew = () => {
    const nowIso = new Date().toISOString();
    const nextIndex = topics.length + 1;
    const newId = `t-new-${Date.now()}`;

    const template: Topic = {
      id: newId,
      code: `THEBU-${nextIndex}`,
      title: "",
      description: "",
      assignee: "",
      type: "Undefined",
      authorName: "You",
      createdAt: nowIso,
      modifiedAt: nowIso,
      status: "New",
      priority: "Normal",
      tags: [],
      dueDate: undefined,
      assignedToMe: false,
      thumbnailUrl: "",
      stats: { comments: 0, viewpoints: 0, attachments: 0 },
    };

    setSelectedId(null);
    setCreateTopic(template);
  };

  return (
    <div className="flex h-full w-full min-h-0">
      <div
        className={`flex flex-col h-full flex-1 min-w-0 transition-all duration-300 ${
          isPanelOpen ? "mr-0 sm:mr-80" : "mr-0"
        }`}
      >
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-gray-800">Topics</h2>
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-sm font-medium text-gray-600"
                  >
                    View: {viewFilter}{" "}
                    <ChevronDown className="h-4 w-4 ml-1 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    "Active Topics",
                    "All Topics in project",
                    "Assigned to me",
                    "Created by me",
                    "From this models",
                  ].map((v) => (
                    <DropdownMenuItem key={v} onClick={() => setViewFilter(v)}>
                      {v}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu> */}
            </div>

            <div className="flex items-center gap-1">
              <Button
                className="h-9 px-4 bg-[#0B4F8A] hover:bg-[#094574] text-white"
                onClick={() => handleCreateNew()}
              >
                New
              </Button>
            </div>
          </div>

          {/* Filter bar (like screenshot) */}
          <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-3 text-sm text-gray-600">
            <MultiCheckboxFilterPopover
              label="Type"
              options={topicTypes}
              selectedValues={selectedTypes}
              onChange={setSelectedTypes}
              placeholder="Type"
              renderOptionIcon={(opt) => {
                if (opt.icon?.startsWith("data:"))
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={opt.icon}
                      alt={opt.label}
                      className="w-4 h-4 object-contain"
                    />
                  );
                return opt.color ? (
                  <span
                    className="inline-block w-3 h-3 rounded-sm border"
                    style={{ backgroundColor: opt.color }}
                  />
                ) : null;
              }}
            />

            <span className="text-gray-300">|</span>

            <MultiCheckboxFilterPopover
              label="Priority"
              options={topicPriorities}
              selectedValues={selectedPriorities}
              onChange={setSelectedPriorities}
              placeholder="Priority"
              renderOptionIcon={(opt) => (
                <span
                  className="inline-block w-3 h-3 rounded-sm border"
                  style={{ backgroundColor: opt.color ?? "#999" }}
                />
              )}
            />

            <span className="text-gray-300">|</span>

            <MultiCheckboxFilterPopover
              label="Status"
              options={topicStatuses}
              selectedValues={selectedStatuses}
              onChange={setSelectedStatuses}
              placeholder="Status"
              renderOptionIcon={(opt) => (
                <span
                  className="inline-block w-3 h-3 rounded-sm border"
                  style={{ backgroundColor: opt.color ?? "#999" }}
                />
              )}
            />

            <span className="text-gray-300">|</span>

            <TagsFilterPopover
              tags={availableTags}
              selectedTags={selectedTags}
              matchMode={tagsMatchMode}
              onChange={({ selectedTags, matchMode }) => {
                setSelectedTags(selectedTags);
                setTagsMatchMode(matchMode);
              }}
            />

            <div className="flex items-center gap-2 ml-2">
              <Checkbox
                checked={assignedToMe}
                onCheckedChange={(v) => setAssignedToMe(!!v)}
              />
              <span>Assigned to me</span>
            </div>

            <div className="ml-auto w-[260px]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-8"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 bg-white">
            <ScrollArea className="h-full">
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-6 flex items-center justify-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    No topics found
                  </div>
                ) : (
                  filtered.map((t) => (
                    <TopicRow
                      key={t.id}
                      topic={t}
                      selected={t.id === selectedId}
                      onSelect={() => handleTopicRowSelect(t.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (PROPERTIES) */}
      <aside
        className={`
          bg-white shadow-lg border-l z-20 flex flex-col min-w-0 overflow-hidden
          fixed inset-0 w-full h-full
          transition-opacity duration-200
          ${
            isPanelOpen
              ? "opacity-100 visible pointer-events-auto"
              : "opacity-0 invisible pointer-events-none"
          }
          sm:absolute sm:inset-auto sm:top-0 sm:right-0 sm:bottom-0 sm:w-[320px] sm:min-w-0
          sm:opacity-100 sm:visible sm:pointer-events-auto
          sm:transition-transform sm:duration-300
          ${isPanelOpen ? "sm:translate-x-0" : "sm:translate-x-full"}
        `}
      >
        {selectedTopic ? (
          <TopicPropertiesPanel
            topic={selectedTopic}
            projectId={projectId}
            topicTypes={topicTypes}
            topicStatuses={topicStatuses}
            topicPriorities={topicPriorities}
            onClose={() => setSelectedId(null)}
            onSaveTopic={(updated) => {
              setTopics((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x)),
              );
            }}
          />
        ) : createTopic ? (
          <TopicPropertiesPanel
            topic={createTopic}
            projectId={projectId}
            variant="create"
            createDefaults={{
              type: selectedTypes[0],
              priority: selectedPriorities[0],
              status: selectedStatuses[0],
              tags: selectedTags,
            }}
            topicTypes={topicTypes}
            topicStatuses={topicStatuses}
            topicPriorities={topicPriorities}
            onClose={() => setCreateTopic(null)}
            onSaveTopic={(updated) => {
              setTopics((prev) => {
                // Insert new topic at top
                return [updated, ...prev];
              });
              setSelectedId(updated.id);
              setCreateTopic(null);
            }}
          />
        ) : null}
      </aside>
    </div>
  );
};
