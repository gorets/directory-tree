import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SelectableTree } from './SelectableTree';
import type { TreeNodeState, TreeSyncConfig, SelectableTreeWithConfigProps } from './types';
import {
  CONFIG_DEBOUNCE_MS,
  getChildrenFromFlat,
  findItemInFlat,
  getAllDescendantIds,
  toggleItemsRecursively,
  getRootItems,
} from './helpers';

/**
 * SelectableTreeWithConfig - A hierarchical tree component with checkboxes and config sync
 *
 * Key features:
 * - Flat array data structure (items with parentId references)
 * - Two-way sync with config (enabled/disabled arrays)
 * - Inheritance: children inherit parent's checked state
 * - Minimal config: only explicitly toggled items are stored
 * - Lazy loading: load children on expand
 * - Indeterminate state: for partially checked parents
 *
 * @example
 * ```tsx
 * <SelectableTreeWithConfig
 *   items={flatItems}
 *   config={{ enabled: ['id1'], disabled: ['id2'] }}
 *   onConfigChange={(newConfig) => setConfig(newConfig)}
 *   onNodeLoad={(parentId) => loadChildren(parentId)}
 *   getId={(item) => item.id}
 * />
 * ```
 */
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

  // Track previous config to avoid unnecessary onConfigChange calls
  const previousConfigRef = useRef<TreeSyncConfig | null>(null);

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

  /**
   * Apply config to tree items
   * Builds checked state and explicit actions from config
   */
  useEffect(() => {
    if (items && config && !isApplyingConfig.current) {
      isApplyingConfig.current = true;
      const checked = new Set<string>();
      const actions = new Map<string, 'enabled' | 'disabled'>();

      // Build explicitActions from config
      config.enabled.forEach(id => actions.set(id, 'enabled'));
      config.disabled.forEach(id => actions.set(id, 'disabled'));

      /**
       * Recursively apply config to items and their children
       */
      const applyConfig = (itemList: T[], parentEnabled = false) => {
        for (const item of itemList) {
          const itemId = getId(item);
          const explicitAction = actions.get(itemId);

          // Determine if this item should be enabled
          let isEnabled = parentEnabled;
          if (explicitAction === 'enabled') {
            isEnabled = true;
          } else if (explicitAction === 'disabled') {
            isEnabled = false;
          }

          if (isEnabled) {
            checked.add(itemId);
          }

          // Recursively apply to children
          const children = getChildrenFromFlat(items, itemId);
          applyConfig(children, isEnabled);
        }
      };

      applyConfig(items, false);
      setCheckedItems(checked);
      setExplicitActions(actions);

      // Reset flag after next tick to allow state updates
      setTimeout(() => {
        isApplyingConfig.current = false;
      }, 0);
    }
  }, [items, config, getId]);

  /**
   * On mount: if loader exists, request root nodes
   */
  useEffect(() => {
    const loader = onNodeLoad ?? onLoadNode;
    if (loader) {
      // Call to load root-level nodes
      callLoad('root');
    }
  }, [callLoad, onLoadNode, onNodeLoad]);

  /**
   * Calculate checked and indeterminate states for all items
   * Leaf nodes: based on checkedItems
   * Parent nodes: based on children states (all/some/none checked)
   */
  const checkedState = useMemo(() => {
    const state = new Map<string, TreeNodeState>();

    const calculateState = (item: T): TreeNodeState => {
      const itemId = getId(item);
      const children = getChildrenFromFlat(items, itemId);

      // Leaf node: state based on checkedItems
      if (children.length === 0) {
        const checked = checkedItems.has(itemId);
        const nodeState = { checked, indeterminate: false };
        state.set(itemId, nodeState);
        return nodeState;
      }

      // Parent node: state based on children
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

    // Calculate state starting from root items
    const rootItems = getRootItems(items);
    rootItems.forEach(calculateState);
    return state;
  }, [items, checkedItems, getId]);

  /**
   * Check if config has actually changed
   */
  const hasConfigChanged = useCallback((newConfig: TreeSyncConfig, prevConfig: TreeSyncConfig | null): boolean => {
    if (!prevConfig) return true;

    const enabledChanged = newConfig.enabled.length !== prevConfig.enabled.length ||
      newConfig.enabled.some((id, i) => id !== prevConfig.enabled[i]);
    const disabledChanged = newConfig.disabled.length !== prevConfig.disabled.length ||
      newConfig.disabled.some((id, i) => id !== prevConfig.disabled[i]);

    return enabledChanged || disabledChanged;
  }, []);

  /**
   * Notify parent of config changes with debouncing
   * Only calls onConfigChange if config actually changed
   */
  const onConfigChangeRef = useRef(onConfigChange);
  onConfigChangeRef.current = onConfigChange;

  const debouncedNotifyConfigChange = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Don't generate config if we're currently applying config from props
    if (isApplyingConfig.current) {
      return;
    }

    if (onConfigChangeRef.current) {
      // Clear previous debounce timer
      if (debouncedNotifyConfigChange.current) {
        clearTimeout(debouncedNotifyConfigChange.current);
      }

      // Debounce config changes to avoid excessive updates
      debouncedNotifyConfigChange.current = setTimeout(() => {
        const newConfig = generateMinimalConfig(explicitActions);

        // Only call onConfigChange if config actually changed
        if (hasConfigChanged(newConfig, previousConfigRef.current)) {
          previousConfigRef.current = newConfig;
          onConfigChangeRef.current?.(newConfig);
        }
      }, CONFIG_DEBOUNCE_MS);
    }

    return () => {
      if (debouncedNotifyConfigChange.current) {
        clearTimeout(debouncedNotifyConfigChange.current);
      }
    };
  }, [explicitActions, hasConfigChanged]);

  /**
   * Handle checkbox toggle for an item
   * Updates both checked state and explicit actions
   */
  const handleToggle = useCallback((itemId: string) => {
    const item = findItemInFlat(items, itemId, getId);
    if (!item) return;

    const currentState = checkedState.get(itemId);
    const shouldCheck = !currentState?.checked;

    // Update checkedItems with new state for item and all descendants
    setCheckedItems(prev => {
      const newChecked = new Set(prev);
      toggleItemsRecursively(items, item, shouldCheck, getId, newChecked);
      return newChecked;
    });

    // Update explicitActions: record this action and remove descendant actions
    setExplicitActions(prev => {
      const newActions = new Map(prev);

      // Record explicit action for this item
      newActions.set(itemId, shouldCheck ? 'enabled' : 'disabled');

      // Remove all descendant actions (they now inherit from parent)
      const descendants = getAllDescendantIds(items, item, getId);
      descendants.forEach(descId => newActions.delete(descId));

      return newActions;
    });
  }, [items, checkedState, getId]);

  // Track nodes that need loading after expand
  const [nodesToLoad, setNodesToLoad] = useState<Set<string>>(new Set());

  // useEffect to handle loading deferred out of setState
  useEffect(() => {
    if (nodesToLoad.size === 0) return;
    
    // Create local loader function to avoid circular dependency
    const loader = onNodeLoad ?? onLoadNode;
    if (!loader) return;

    for (const nodeId of nodesToLoad) {
      if (loadedParentsRef.current.has(nodeId)) continue;
      try {
        setLoadingNodes(prev => new Set(prev).add(nodeId));
        const res = loader(nodeId);
        loadedParentsRef.current.add(nodeId);
        if (res && typeof (res as any).then === 'function') {
          (res as Promise<any>)
            .finally(() => {
              setLoadingNodes(prev => {
                const next = new Set(prev);
                next.delete(nodeId);
                return next;
              });
            })
            .catch(() => {
              loadedParentsRef.current.delete(nodeId);
            });
        } else {
          setLoadingNodes(prev => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
        }
      } catch (err) {
        loadedParentsRef.current.delete(nodeId);
        setLoadingNodes(prev => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
        throw err;
      }
    }
    
    // Clear after loading
    setNodesToLoad(new Set());
  }, [nodesToLoad, onNodeLoad, onLoadNode]);

  /**
   * Handle expand/collapse toggle for a tree node
   * If expanding and node has no children, triggers lazy loading
   */
  const handleToggleExpand = useCallback((categoryId: string) => {
    const updateExpandedNodes = (nodes: Set<string>) => {
      const next = new Set(nodes);
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
      const wasExpanded = internalExpandedNodes.has(categoryId);

      setInternalExpandedNodes(prev => {
        const next = updateExpandedNodes(prev);
        return next;
      });

      // Check if we're expanding (not collapsing) and need to load children
      // Defer callLoad to avoid setState during render
      if (!wasExpanded) {
        const item = findItemInFlat(items, categoryId, getId);
        const children = item ? getChildren(item) : [];

        if (children.length === 0) {
          // Defer to next tick to avoid "setState during render" warning
          setTimeout(() => {
            callLoad(categoryId);
          }, 0);
        }
      }
    }
  }, [isControlled, expandedNodes, onExpandedNodesChange, internalExpandedNodes, items, getId, getChildren, callLoad]);

  /**
   * Get root-level items for rendering
   */
  const hierarchicalItems = useMemo(() => getRootItems(items), [items]);

  const loader = onNodeLoad ?? onLoadNode;

  /**
   * Dynamic getChildren that looks up children in the flat items array
   */
  const dynamicGetChildren = useCallback(
    (item: T) => getChildrenFromFlat(items, getId(item)),
    [items, getId]
  );

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

/**
 * Generate minimal config from explicit user actions
 *
 * This is intentionally simple: just splits the explicitActions Map
 * into enabled and disabled arrays. The minimality is achieved by
 * removing descendant actions when a parent is toggled.
 *
 * @param explicitActions - Map of item IDs to their explicit actions
 * @returns Config with enabled and disabled arrays
 */
export function generateMinimalConfig(
  explicitActions: Map<string, 'enabled' | 'disabled'>
): TreeSyncConfig {
  const enabled: string[] = [];
  const disabled: string[] = [];

  explicitActions.forEach((action, itemId) => {
    if (action === 'enabled') {
      enabled.push(itemId);
    } else if (action === 'disabled') {
      disabled.push(itemId);
    }
  });

  return { enabled, disabled };
}
