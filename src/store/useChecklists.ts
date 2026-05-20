import { useState, useEffect, useCallback } from 'react';
import { Checklist, ChecklistItem } from '../types';

const STORAGE_KEY = 'family_checklists_v1';

function load(): Checklist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Checklist[]) : [];
  } catch {
    return [];
  }
}

function persist(lists: Checklist[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // quota exceeded — data stays in memory this session
    console.warn('localStorage quota exceeded; checklists not persisted.');
  }
}

export type ChecklistInput  = Pick<Checklist, 'name' | 'description'>;
export type ItemInput       = Pick<ChecklistItem, 'title' | 'notes' | 'completed'>;

export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>(load);

  useEffect(() => { persist(checklists); }, [checklists]);

  const addChecklist = useCallback((data: ChecklistInput): string => {
    const id  = crypto.randomUUID();
    const now = new Date().toISOString();
    setChecklists(prev => [
      ...prev,
      {
        id,
        name:        data.name,
        description: data.description?.trim() || undefined,
        items:       [],
        createdAt:   now,
        updatedAt:   now,
      },
    ]);
    return id;
  }, []);

  /**
   * Create a checklist pre-populated with items (used by Excel import).
   * One write, one persist, one navigate target.
   */
  const addChecklistWithItems = useCallback(
    (data: ChecklistInput, items: Array<Pick<ChecklistItem, 'title' | 'notes' | 'completed'>>): string => {
      const id  = crypto.randomUUID();
      const now = new Date().toISOString();
      const fullItems: ChecklistItem[] = items.map(it => ({
        id:          crypto.randomUUID(),
        title:       it.title,
        notes:       it.notes?.trim() || undefined,
        completed:   Boolean(it.completed),
        createdAt:   now,
        updatedAt:   now,
      }));
      setChecklists(prev => [
        ...prev,
        {
          id,
          name:        data.name,
          description: data.description?.trim() || undefined,
          items:       fullItems,
          createdAt:   now,
          updatedAt:   now,
        },
      ]);
      return id;
    },
    [],
  );

  const updateChecklist = useCallback(
    (id: string, data: Partial<Omit<Checklist, 'id' | 'items' | 'createdAt'>>) => {
      setChecklists(prev =>
        prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c),
      );
    },
    [],
  );

  const deleteChecklist = useCallback((id: string) => {
    setChecklists(prev => prev.filter(c => c.id !== id));
  }, []);

  const addItem = useCallback((checklistId: string, item: ItemInput) => {
    const now = new Date().toISOString();
    const newItem: ChecklistItem = {
      id:        crypto.randomUUID(),
      title:     item.title,
      notes:     item.notes?.trim() || undefined,
      completed: Boolean(item.completed),
      createdAt: now,
      updatedAt: now,
    };
    setChecklists(prev =>
      prev.map(c =>
        c.id === checklistId
          ? { ...c, items: [...c.items, newItem], updatedAt: now }
          : c,
      ),
    );
  }, []);

  const updateItem = useCallback(
    (checklistId: string, itemId: string, patch: Partial<Omit<ChecklistItem, 'id' | 'createdAt'>>) => {
      const now = new Date().toISOString();
      setChecklists(prev =>
        prev.map(c => {
          if (c.id !== checklistId) return c;
          return {
            ...c,
            items: c.items.map(it =>
              it.id === itemId
                ? { ...it, ...patch, updatedAt: now }
                : it,
            ),
            updatedAt: now,
          };
        }),
      );
    },
    [],
  );

  const toggleItem = useCallback((checklistId: string, itemId: string) => {
    const now = new Date().toISOString();
    setChecklists(prev =>
      prev.map(c => {
        if (c.id !== checklistId) return c;
        return {
          ...c,
          items: c.items.map(it =>
            it.id === itemId
              ? { ...it, completed: !it.completed, updatedAt: now }
              : it,
          ),
          updatedAt: now,
        };
      }),
    );
  }, []);

  const deleteItem = useCallback((checklistId: string, itemId: string) => {
    const now = new Date().toISOString();
    setChecklists(prev =>
      prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.filter(it => it.id !== itemId), updatedAt: now }
          : c,
      ),
    );
  }, []);

  const getChecklist = useCallback(
    (id: string): Checklist | undefined => checklists.find(c => c.id === id),
    [checklists],
  );

  return {
    checklists,
    addChecklist,
    addChecklistWithItems,
    updateChecklist,
    deleteChecklist,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    getChecklist,
  };
}
