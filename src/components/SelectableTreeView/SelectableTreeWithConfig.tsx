import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SelectableTree } from './SelectableTree.js';
import type { TreeNodeState, TreeSyncConfig, SelectableTreeWithConfigProps } from './types.js';

export function SelectableTreeWithConfig<T>({
  items,
  config,
  onLoadNode,
  onNodeLoad,
  onConfigChange,
  getId: getIdProp = (item: any) => item.id,
  getTitle: getTitleProp = (item: any) => item.title,
  getChildren: getChildrenProp = (item: any) => item.children || [],
  renderTitle,
  expandedNodes: controlledExpandedNodes,
  onExpandedNodesChange,
}: SelectableTreeWithConfigProps<T>) {
  
  // Memoize getters to avoid unnecessary recalculations
  const getId = useCallback(getIdProp, []);
  const getTitle = useCallback(getTitleProp, []);
  const getChildren = useCallback(getChildrenProp, []);
  
  const [internalExpandedNodes, setInternalExpandedNodes] = useState<Set<string>>(new Set());
  
  const isControlled = controlledExpandedNodes !== undefined;
  const expandedNodes = isControlled ? controlledExpandedNodes : internalExpandedNodes;
  
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Track which nodes are currently loading
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // Track explicit user actions: Map<itemId, 'enabled' | 'disabled'>
  // Only items explicitly clicked by user or loaded from config
  const [explicitActions, setExplicitActions] = useState<Map<string, 'enabled' | 'disabled'>>(new Map());

  // Flag to prevent cycles: distinguish changes from user vs from config
  const isApplyingConfig = useRef(false);

  // Track which parentIds we already requested to avoid duplicate loads
  const loadedParentsRef = useRef<Set<string>>(new Set());

  // Normalized function to call when children need to be loaded
  const callLoad = useCallback((parentId: string = 'root') => {
    const loader = onNodeLoad ?? onLoadNode;
    if (!loader) return;
    if (loadedParentsRef.current.has(parentId)) return;
    try {
      setLoadingNodes(prev => new Set(prev).add(parentId));
      const res = loader(parentId);
      // If it returns a promise, mark as loaded when resolved (or mark immediately to prevent duplicates)
      loadedParentsRef.current.add(parentId);
      if (res && typeof (res as any).then === 'function') {
        (res as Promise<any>)
          .finally(() => {
            setLoadingNodes(prev => {
              const next = new Set(prev);
              next.delete(parentId);
              return next;
            });
          })
          .catch(() => {
            // On failure allow retry by removing from set
            loadedParentsRef.current.delete(parentId);
          });
      } else {
        // Sync result - immediately clear loading
        setLoadingNodes(prev => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });
      }
    } catch (err) {
      // allow retry
      loadedParentsRef.current.delete(parentId);
      setLoadingNodes(prev => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
      throw err;
    }
  }, [onLoadNode, onNodeLoad]);

  useEffect(() => {
    if (items && config && !isApplyingConfig.current) {
      isApplyingConfig.current = true;
      const checked = new Set<string>();
      const actions = new Map<string, 'enabled' | 'disabled'>();

      // Build explicitActions from config
      config.enabled.forEach(id => actions.set(id, 'enabled'));
      config.disabled.forEach(id => actions.set(id, 'disabled'));

      const applyConfig = (itemList: T[], parentEnabled = false) => {
        for (const item of itemList) {
          const itemId = getId(item);
          const explicitAction = actions.get(itemId);

          let isEnabled = parentEnabled;
          if (explicitAction === 'enabled') {
            isEnabled = true;
          } else if (explicitAction === 'disabled') {
            isEnabled = false;
          }

          if (isEnabled) {
            checked.add(itemId);
          }

          // Use dynamicGetChildren to get current children from flat items
          const children = itemList.filter((it: T) => {
            const parentId = (it as any).parentId;
            return parentId === itemId;
          });
          applyConfig(children, isEnabled);
        }
      };

      applyConfig(items, false);
      setCheckedItems(checked);
      setExplicitActions(actions);

      // Reset flag after a small delay
      setTimeout(() => {
        isApplyingConfig.current = false;
      }, 0);
    }
  }, [items, config, getId]);

  // On mount: if loader exists, request root nodes
  useEffect(() => {
    const loader = onNodeLoad ?? onLoadNode;
    if (loader) {
      // Call to load root-level nodes
      callLoad('root');
    }
  }, [callLoad, onLoadNode, onNodeLoad]);

  const checkedState = useMemo(() => {
    const state = new Map<string, TreeNodeState>();

    const calculateState = (item: T): TreeNodeState => {
      const itemId = getId(item);
      // Get children from flat items array
      const children = items.filter((it: T) => {
        const parentId = (it as any).parentId;
        return parentId === itemId;
      });
      
      if (children.length === 0) {
        const checked = checkedItems.has(itemId);
        state.set(itemId, { checked, indeterminate: false });
        return { checked, indeterminate: false };
      }

      const childStates = children.map(calculateState);
      const allChecked = childStates.every(s => s.checked && !s.indeterminate);
      const someChecked = childStates.some(s => s.checked || s.indeterminate);

      const nodeState: TreeNodeState = {
        checked: allChecked,
        indeterminate: someChecked && !allChecked,
      };

      state.set(itemId, nodeState);
      return nodeState;
    };

    // Only calculate for root items
    const rootItems = items.filter((item: T) => {
      const parentId = (item as any).parentId;
      return parentId === 'root' || !parentId;
    });
    rootItems.forEach(calculateState);
    return state;
  }, [items, checkedItems, getId]);

  // Debounce for onConfigChange to avoid calling it too frequently
  const onConfigChangeRef = useRef(onConfigChange);
  onConfigChangeRef.current = onConfigChange;
  
  const debouncedNotifyConfigChange = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Don't generate config if we just applied it
    if (isApplyingConfig.current) {
      return;
    }

    if (onConfigChangeRef.current) {
      // Debounce: wait 100ms before calling onConfigChange
      if (debouncedNotifyConfigChange.current) {
        clearTimeout(debouncedNotifyConfigChange.current);
      }

      debouncedNotifyConfigChange.current = setTimeout(() => {
        // Generate config from explicit user actions
        const newConfig = generateMinimalConfig(explicitActions);
        onConfigChangeRef.current?.(newConfig);
      }, 100);
    }

    return () => {
      if (debouncedNotifyConfigChange.current) {
        clearTimeout(debouncedNotifyConfigChange.current);
      }
    };
  }, [explicitActions]);

  const handleToggle = useCallback((itemId: string) => {
    const findItem = (itemList: T[], id: string): T | null => {
      for (const item of itemList) {
        const currentId = getId(item);
        if (currentId === id) return item;
        // Get children from flat items
        const children = items.filter((it: T) => {
          const parentId = (it as any).parentId;
          return parentId === currentId;
        });
        const found = findItem(children, id);
        if (found) return found;
      }
      return null;
    };

    // Get all descendants of an item
    const getAllDescendantIds = (item: T): string[] => {
      const result: string[] = [];
      const collect = (currentItem: T) => {
        const id = getId(currentItem);
        const children = items.filter((it: T) => {
          const parentId = (it as any).parentId;
          return parentId === id;
        });
        children.forEach(child => {
          result.push(getId(child));
          collect(child);
        });
      };
      collect(item);
      return result;
    };

    const item = findItem(items, itemId);
    if (!item) return;

    const currentState = checkedState.get(itemId);
    const shouldCheck = !currentState?.checked;

    // Update checkedItems
    setCheckedItems(prev => {
      const newChecked = new Set(prev);

      const toggleRecursive = (currentItem: T, check: boolean) => {
        const id = getId(currentItem);
        if (check) {
          newChecked.add(id);
        } else {
          newChecked.delete(id);
        }
        const children = items.filter((it: T) => {
          const parentId = (it as any).parentId;
          return parentId === id;
        });
        children.forEach(child => toggleRecursive(child, check));
      };

      toggleRecursive(item, shouldCheck);
      return newChecked;
    });

    // Update explicitActions: add this item's action and remove all descendant actions
    setExplicitActions(prev => {
      const newActions = new Map(prev);

      // Set action for this item
      newActions.set(itemId, shouldCheck ? 'enabled' : 'disabled');

      // Remove all descendant actions (they now inherit from this item)
      const descendants = getAllDescendantIds(item);
      descendants.forEach(descId => newActions.delete(descId));

      return newActions;
    });
  }, [items, checkedState, getId]);

  const handleToggleExpand = useCallback((categoryId: string) => {
    const updateExpandedNodes = (prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    };
    
    if (isControlled && onExpandedNodesChange) {
      onExpandedNodesChange(updateExpandedNodes(expandedNodes));
    } else if (!isControlled) {
      setInternalExpandedNodes(prev => {
        const next = updateExpandedNodes(prev);
        // If we are expanding, and the node currently has no children, trigger loader
        const isNowExpanded = next.has(categoryId) && !prev.has(categoryId);
        if (isNowExpanded) {
          // find the item in current items and check children
          const findItem = (itemList: T[], id: string): T | null => {
            for (const item of itemList) {
              const currentId = getId(item);
              if (currentId === id) return item;
              const found = findItem(getChildren(item), id);
              if (found) return found;
            }
            return null;
          };

          const item = findItem(items, categoryId);
          const children = item ? getChildren(item) : [];
          if (children.length === 0) {
            // request children for this node
            callLoad(categoryId);
          }
        }

        return next;
      });
    }
  }, [isControlled, expandedNodes, onExpandedNodesChange, items, getId, callLoad]);

  // Get only root-level items (those with parentId === 'root')
  const hierarchicalItems = useMemo(() => {
    const roots = items.filter((item: T) => {
      const parentId = (item as any).parentId;
      return parentId === 'root' || !parentId;
    });
    return roots;
  }, [items]);

  const loader = onNodeLoad ?? onLoadNode;

  // Dynamic getChildren that looks up children in the flat items array
  const dynamicGetChildren = useCallback((item: T) => {
    const itemId = getId(item);
    const children = items.filter((it: T) => {
      const parentId = (it as any).parentId;
      return parentId === itemId;
    });
    return children;
  }, [items, getId]);

  return (
    <SelectableTree
      items={hierarchicalItems}
      checkedState={checkedState}
      onToggle={handleToggle}
      expandedNodes={expandedNodes}
      onToggleExpand={handleToggleExpand}
      getId={getId}
      getTitle={getTitle}
      getChildren={dynamicGetChildren}
      renderTitle={renderTitle}
      onLoadNode={loader}
      loadingNodes={loadingNodes}
    />
  );
}

export function generateMinimalConfig(
  explicitActions: Map<string, 'enabled' | 'disabled'>
): TreeSyncConfig {
  const enabled: string[] = [];
  const disabled: string[] = [];

  // Simply split explicitActions into enabled and disabled arrays
  explicitActions.forEach((action, itemId) => {
    if (action === 'enabled') {
      enabled.push(itemId);
    } else if (action === 'disabled') {
      disabled.push(itemId);
    }
  });

  return { enabled, disabled };
}
