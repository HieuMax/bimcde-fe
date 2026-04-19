"use client";

import {
  DateModifiedFilterPopover,
  type DatePresetOption,
} from "@/components/features/topics/filters/TopicsFilters";

type DropdownProps = {
  title: string;
  options: DatePresetOption[];
  value: string;
  onChange: (value: string) => void;
  from?: Date | null;
  to?: Date | null;
  onRangeChange?: (range: { from: Date | null; to: Date | null }) => void;
};

export default function DropdownDatePicker(props: DropdownProps) {
  return (
    <DateModifiedFilterPopover
      label={props.title}
      options={props.options}
      presetValue={props.value}
      onPresetChange={props.onChange}
      from={props.from}
      to={props.to}
      onRangeChange={props.onRangeChange}
    />
  );
}
