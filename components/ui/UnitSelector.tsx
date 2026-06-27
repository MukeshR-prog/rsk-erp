"use client";

import DropdownSelector, { DropdownOption } from "./DropdownSelector";

interface UnitOption {
  id: string;
  name: string;
}

interface UnitSelectorProps {
  units: UnitOption[];
  selectedKey?: string;
  onSelectionChange: (key: string) => void;
  label?: string;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

export default function UnitSelector({
  units,
  selectedKey = "",
  onSelectionChange,
  label = "Select Unit",
  placeholder = "Choose a measurement unit",
  isInvalid = false,
  errorMessage,
  className = "",
}: UnitSelectorProps) {
  const options: DropdownOption[] = units.map((u) => ({
    id: u.id,
    name: u.name,
  }));

  return (
    <DropdownSelector
      options={options}
      selectedId={selectedKey}
      onChange={onSelectionChange}
      label={label}
      placeholder={placeholder}
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      className={className}
      isClearable={true}
    />
  );
}
