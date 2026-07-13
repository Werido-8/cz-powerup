import { useCallback, useMemo, useState } from "react";

export function useFileSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isAllResultsSelected, setIsAllResultsSelected] = useState(false);

  const toggle = useCallback((id: string) => {
    setIsAllResultsSelected(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[], checked: boolean) => {
    setIsAllResultsSelected(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const selectAllResults = useCallback((allIds: string[]) => {
    setSelectedIds(new Set(allIds));
    setIsAllResultsSelected(true);
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setIsAllResultsSelected(false);
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const selectedCount = selectedIds.size;

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    isAllResultsSelected,
    toggle,
    toggleAll,
    selectAllResults,
    clear,
    isSelected,
  };
}
