"use client";

import DropdownSelector, { DropdownOption } from "./DropdownSelector";

interface ContactOption {
  id: string;
  name: string;
  type: string;
  phone?: string | null;
}

interface ContactSelectorProps {
  contacts: ContactOption[];
  selectedKey?: string;
  onSelectionChange: (key: string) => void;
  label?: string;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

export default function ContactSelector({
  contacts,
  selectedKey = "",
  onSelectionChange,
  label = "Select Contact",
  placeholder = "Choose a customer or supplier",
  isInvalid = false,
  errorMessage,
  className = "",
}: ContactSelectorProps) {
  const options: DropdownOption[] = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    subtext: `${c.type}${c.phone ? ` • ${c.phone}` : ""}`,
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
