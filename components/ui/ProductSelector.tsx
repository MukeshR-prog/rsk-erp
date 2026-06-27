"use client";

import DropdownSelector, { DropdownOption } from "./DropdownSelector";

interface ProductOption {
  id: string;
  code: string;
  name: string;
  type: string;
  volumeMl?: string | null;
  color?: string | null;
}

interface ProductSelectorProps {
  products: ProductOption[];
  selectedKey?: string;
  onSelectionChange: (key: string) => void;
  label?: string;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

export default function ProductSelector({
  products,
  selectedKey = "",
  onSelectionChange,
  label = "Select Product",
  placeholder = "Choose a product",
  isInvalid = false,
  errorMessage,
  className = "",
}: ProductSelectorProps) {
  const options: DropdownOption[] = products.map((p) => {
    const spec = [p.volumeMl, p.color].filter(Boolean).join(" • ");
    const specStr = spec ? ` (${spec})` : "";
    return {
      id: p.id,
      name: `[${p.code}] ${p.name}${specStr}`,
      subtext: p.type.replace("_", " "),
    };
  });

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
