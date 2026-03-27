"use client";

import React, { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, X } from "lucide-react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

export type TopicMatchMode = "atleast" | "any" | "all";

export type TopicFilterOption = {
  value: string;
  label: string;
  color?: string;
  icon?: string;
};

type MultiCheckboxFilterProps = {
  label: string;
  options: TopicFilterOption[];
  selectedValues: string[];
  onChange: (next: string[]) => void;
  renderOptionIcon?: (opt: TopicFilterOption) => React.ReactNode;
  placeholder?: string;
};

export function MultiCheckboxFilterPopover({
  label,
  options,
  selectedValues,
  onChange,
  renderOptionIcon,
  placeholder,
}: MultiCheckboxFilterProps) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const selectedLabel =
    selectedValues.length === 0
      ? placeholder ?? `All ${label}s`
      : `${label}: ${selectedValues.length}`;

  const toggle = (value: string) => {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  };

  const toggleAll = () => {
    if (selectedValues.length === options.length) onChange([]);
    else onChange(options.map((o) => o.value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 px-2 text-sm font-medium text-gray-700"
        >
          {selectedValues.length === 0 ? label : selectedLabel}{" "}
          <ChevronDown className="h-4 w-4 ml-1 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-800">{label}</div>
          <Button
            variant="ghost"
            className="h-7 px-2 text-xs text-gray-600"
            onClick={toggleAll}
          >
            {selectedValues.length === options.length ? "Clear" : "Select all"}
          </Button>
        </div>

        <div className="max-h-[260px] overflow-y-auto pr-1">
          {options.map((opt) => {
            const checked = selectedSet.has(opt.value);
            return (
              <div
                key={opt.value}
                className="flex items-center gap-2 py-2"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(opt.value)}
                />
                <div className="flex items-center gap-2 min-w-0">
                  {renderOptionIcon ? (
                    renderOptionIcon(opt)
                  ) : opt.color ? (
                    <span
                      className="inline-block w-3 h-3 rounded-sm border"
                      style={{ backgroundColor: opt.color }}
                    />
                  ) : null}
                  <span className="text-sm text-gray-800 truncate">
                    {opt.label}
                  </span>
                </div>
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="text-sm text-gray-400 py-4 text-center">
              No options
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type TagsFilterPopoverProps = {
  tags: string[];
  selectedTags: string[];
  matchMode: TopicMatchMode;
  onChange: (next: { selectedTags: string[]; matchMode: TopicMatchMode }) => void;
};

export function TagsFilterPopover({
  tags,
  selectedTags,
  matchMode,
  onChange,
}: TagsFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selectedSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  const filteredTags = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return tags;
    return tags.filter((x) => x.toLowerCase().includes(t));
  }, [q, tags]);

  const toggleTag = (tag: string) => {
    const next = new Set(selectedSet);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange({ selectedTags: [...next], matchMode });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 px-2 text-sm font-medium text-gray-700"
        >
          {selectedTags.length === 0 ? "Tags" : `Tags: ${selectedTags.length}`}{" "}
          <ChevronDown className="h-4 w-4 ml-1 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-800">Tags</div>
          <Button
            variant="ghost"
            className="h-7 px-2 text-xs text-gray-600"
            onClick={() => onChange({ selectedTags: [], matchMode })}
          >
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="text-xs font-medium text-gray-500">Match</div>
          <RadioGroup
            value={matchMode}
            onValueChange={(v) =>
              onChange({
                selectedTags,
                matchMode: v as TopicMatchMode,
              })
            }
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-1">
              <RadioGroupItem value="atleast" id="tags_match_atleast" />
              <label htmlFor="tags_match_atleast" className="text-xs text-gray-600">
                At least
              </label>
            </div>
            <div className="flex items-center gap-1">
              <RadioGroupItem value="any" id="tags_match_any" />
              <label htmlFor="tags_match_any" className="text-xs text-gray-600">
                Any
              </label>
            </div>
            <div className="flex items-center gap-1">
              <RadioGroupItem value="all" id="tags_match_all" />
              <label htmlFor="tags_match_all" className="text-xs text-gray-600">
                All
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className="relative mb-2">
          <Search className="h-4 w-4 text-gray-500 absolute left-3 top-2.5" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="h-8 pl-9 pr-8"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2 top-2.5 text-gray-500"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="max-h-[260px] overflow-y-auto pr-1">
          {filteredTags.map((tag) => {
            const checked = selectedSet.has(tag);
            return (
              <label key={tag} className="flex items-center gap-2 py-2 cursor-pointer">
                <Checkbox checked={checked} onCheckedChange={() => toggleTag(tag)} />
                <span className="text-sm text-gray-800">{tag}</span>
              </label>
            );
          })}
          {filteredTags.length === 0 && (
            <div className="text-sm text-gray-400 py-4 text-center">
              No tags
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

