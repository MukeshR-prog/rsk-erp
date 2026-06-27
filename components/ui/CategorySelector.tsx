"use client";

import DropdownSelector, { DropdownOption } from "./DropdownSelector";

interface CategoryOption {
  id: string;
  name: string;
}

interface CategorySelectorProps {
  categories: CategoryOption[];
  selectedKey?: string;
  onSelectionChange: (key: string) => void;
  label?: string;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

export default function CategorySelector({
  categories,
  selectedKey = "",
  onSelectionChange,
  label = "Select Category",
  placeholder = "Choose a product category",
  isInvalid = false,
  errorMessage,
  className = "",
}: CategorySelectorProps) {
  const options: DropdownOption[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
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
