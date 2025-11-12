import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectableTreeWithConfig } from '../SelectableTreeWithConfig';
import type { TreeSyncConfig } from '../types';

interface TestItem {
  id: string;
  parentId: string;
  title: string;
}

describe('SelectableTreeWithConfig', () => {
  const mockItems: TestItem[] = [
    { id: '1', parentId: 'root', title: 'Parent 1' },
    { id: '1-1', parentId: '1', title: 'Child 1-1' },
    { id: '1-2', parentId: '1', title: 'Child 1-2' },
    { id: '2', parentId: 'root', title: 'Parent 2' },
    { id: '2-1', parentId: '2', title: 'Child 2-1' },
  ];

  const defaultProps = {
    items: mockItems,
    config: { enabled: [], disabled: [] } as TreeSyncConfig,
    getId: (item: TestItem) => item.id,
    getTitle: (item: TestItem) => item.title,
  };

  it('should render root items', () => {
    render(<SelectableTreeWithConfig {...defaultProps} />);

    expect(screen.getByText('Parent 1')).toBeInTheDocument();
    expect(screen.getByText('Parent 2')).toBeInTheDocument();
  });

  it('should apply enabled config on mount', () => {
    const config: TreeSyncConfig = {
      enabled: ['1'],
      disabled: [],
    };

    render(<SelectableTreeWithConfig {...defaultProps} config={config} />);

    const checkbox = screen.getByRole('checkbox', { name: /parent 1/i });
    expect(checkbox).toBeChecked();
  });

  it('should apply disabled config on mount', () => {
    const config: TreeSyncConfig = {
      enabled: ['1'],
      disabled: ['1-1'],
    };

    render(<SelectableTreeWithConfig {...defaultProps} config={config} />);

    // First expand to see children
    const expandButton = screen.getAllByRole('button')[0];
    userEvent.click(expandButton);

    waitFor(() => {
      const parentCheckbox = screen.getByRole('checkbox', { name: /parent 1/i });
      const childCheckbox = screen.getByRole('checkbox', { name: /child 1-1/i });

      expect(parentCheckbox).toBeChecked();
      expect(childCheckbox).not.toBeChecked();
    });
  });

  it('should toggle item when checkbox clicked', async () => {
    const onConfigChange = jest.fn();
    const user = userEvent.setup();

    render(
      <SelectableTreeWithConfig
        {...defaultProps}
        onConfigChange={onConfigChange}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /parent 1/i });
    await user.click(checkbox);

    // Wait for debounced config change
    await waitFor(
      () => {
        expect(onConfigChange).toHaveBeenCalled();
        const lastCall = onConfigChange.mock.calls[onConfigChange.mock.calls.length - 1][0];
        expect(lastCall.enabled).toContain('1');
      },
      { timeout: 200 }
    );
  });

  it('should toggle all descendants when parent toggled', async () => {
    const onConfigChange = jest.fn();
    const user = userEvent.setup();

    render(
      <SelectableTreeWithConfig
        {...defaultProps}
        onConfigChange={onConfigChange}
      />
    );

    // First expand parent
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    // Then toggle parent checkbox
    const parentCheckbox = screen.getByRole('checkbox', { name: /parent 1/i });
    await user.click(parentCheckbox);

    await waitFor(() => {
      const child1Checkbox = screen.getByRole('checkbox', { name: /child 1-1/i });
      const child2Checkbox = screen.getByRole('checkbox', { name: /child 1-2/i });

      expect(parentCheckbox).toBeChecked();
      expect(child1Checkbox).toBeChecked();
      expect(child2Checkbox).toBeChecked();
    });
  });

  it('should show indeterminate state when some children checked', async () => {
    const config: TreeSyncConfig = {
      enabled: ['1'],
      disabled: ['1-1'],
    };
    const user = userEvent.setup();

    render(<SelectableTreeWithConfig {...defaultProps} config={config} />);

    // Expand parent
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    await waitFor(() => {
      const parentCheckbox = screen.getByRole('checkbox', {
        name: /parent 1/i,
      }) as HTMLInputElement;

      // Parent should be indeterminate (one child enabled, one disabled)
      expect(parentCheckbox.indeterminate).toBe(true);
    });
  });

  it('should expand and show children on expand button click', async () => {
    const user = userEvent.setup();

    render(<SelectableTreeWithConfig {...defaultProps} />);

    // Children should not be visible initially
    expect(screen.queryByText('Child 1-1')).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    // Children should now be visible
    await waitFor(() => {
      expect(screen.getByText('Child 1-1')).toBeInTheDocument();
      expect(screen.getByText('Child 1-2')).toBeInTheDocument();
    });
  });

  it('should call onLoadNode when expanding node with loader', async () => {
    const onLoadNode = jest.fn();
    const user = userEvent.setup();

    render(
      <SelectableTreeWithConfig
        {...defaultProps}
        onLoadNode={onLoadNode}
      />
    );

    // Should call for root on mount
    expect(onLoadNode).toHaveBeenCalledWith('root');

    // Click expand button
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    // Should call for expanded node
    await waitFor(() => {
      expect(onLoadNode).toHaveBeenCalledWith('1');
    });
  });

  it('should generate minimal config with only explicit actions', async () => {
    const onConfigChange = jest.fn();
    const user = userEvent.setup();

    render(
      <SelectableTreeWithConfig
        {...defaultProps}
        onConfigChange={onConfigChange}
      />
    );

    // Expand and enable parent
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    const parentCheckbox = screen.getByRole('checkbox', { name: /parent 1/i });
    await user.click(parentCheckbox);

    // Wait for config change
    await waitFor(
      () => {
        expect(onConfigChange).toHaveBeenCalled();
        const config = onConfigChange.mock.calls[onConfigChange.mock.calls.length - 1][0];
        // Should only have parent in config, not children
        expect(config.enabled).toEqual(['1']);
        expect(config.enabled).not.toContain('1-1');
        expect(config.enabled).not.toContain('1-2');
      },
      { timeout: 200 }
    );
  });

  it('should override parent state when child explicitly toggled', async () => {
    const onConfigChange = jest.fn();
    const user = userEvent.setup();

    // Start with parent enabled
    const config: TreeSyncConfig = {
      enabled: ['1'],
      disabled: [],
    };

    render(
      <SelectableTreeWithConfig
        {...defaultProps}
        config={config}
        onConfigChange={onConfigChange}
      />
    );

    // Expand parent
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    // Disable one child
    await waitFor(() => {
      const childCheckbox = screen.getByRole('checkbox', { name: /child 1-1/i });
      expect(childCheckbox).toBeChecked();
    });

    const childCheckbox = screen.getByRole('checkbox', { name: /child 1-1/i });
    await user.click(childCheckbox);

    // Wait for config change
    await waitFor(
      () => {
        expect(onConfigChange).toHaveBeenCalled();
        const newConfig = onConfigChange.mock.calls[onConfigChange.mock.calls.length - 1][0];
        // Should have parent enabled and child disabled
        expect(newConfig.enabled).toContain('1');
        expect(newConfig.disabled).toContain('1-1');
      },
      { timeout: 200 }
    );
  });

  it('should remove descendant actions when parent toggled', async () => {
    const onConfigChange = jest.fn();
    const user = userEvent.setup();

    // Start with parent and child both in config
    const config: TreeSyncConfig = {
      enabled: ['1'],
      disabled: ['1-1'],
    };

    render(
      <SelectableTreeWithConfig
        {...defaultProps}
        config={config}
        onConfigChange={onConfigChange}
      />
    );

    // Expand parent
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    // Toggle parent off
    await waitFor(() => {
      const parentCheckbox = screen.getByRole('checkbox', { name: /parent 1/i });
      expect(parentCheckbox).toBeInTheDocument();
    });

    const parentCheckbox = screen.getByRole('checkbox', { name: /parent 1/i });
    await user.click(parentCheckbox);

    // Wait for config change
    await waitFor(
      () => {
        expect(onConfigChange).toHaveBeenCalled();
        const newConfig = onConfigChange.mock.calls[onConfigChange.mock.calls.length - 1][0];
        // Should only have parent disabled, child action should be removed
        expect(newConfig.disabled).toEqual(['1']);
        expect(newConfig.disabled).not.toContain('1-1');
        expect(newConfig.enabled).toEqual([]);
      },
      { timeout: 200 }
    );
  });

  it('should handle controlled expandedNodes prop', async () => {
    const onExpandedNodesChange = jest.fn();
    const expandedNodes = new Set<string>();
    const user = userEvent.setup();

    const { rerender } = render(
      <SelectableTreeWithConfig
        {...defaultProps}
        expandedNodes={expandedNodes}
        onExpandedNodesChange={onExpandedNodesChange}
      />
    );

    // Click expand button
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    // Should notify parent
    await waitFor(() => {
      expect(onExpandedNodesChange).toHaveBeenCalled();
      const newExpandedNodes = onExpandedNodesChange.mock.calls[0][0];
      expect(newExpandedNodes.has('1')).toBe(true);
    });

    // Rerender with updated expandedNodes
    expandedNodes.add('1');
    rerender(
      <SelectableTreeWithConfig
        {...defaultProps}
        expandedNodes={expandedNodes}
        onExpandedNodesChange={onExpandedNodesChange}
      />
    );

    // Children should be visible
    await waitFor(() => {
      expect(screen.getByText('Child 1-1')).toBeInTheDocument();
    });
  });

  it('should debounce config changes', async () => {
    jest.useFakeTimers();
    const onConfigChange = jest.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <SelectableTreeWithConfig
        {...defaultProps}
        onConfigChange={onConfigChange}
      />
    );

    const checkbox1 = screen.getByRole('checkbox', { name: /parent 1/i });
    const checkbox2 = screen.getByRole('checkbox', { name: /parent 2/i });

    // Click multiple checkboxes quickly
    await user.click(checkbox1);
    await user.click(checkbox2);

    // Should not call immediately
    expect(onConfigChange).not.toHaveBeenCalled();

    // Advance timers past debounce
    jest.advanceTimersByTime(150);

    // Should call once after debounce
    await waitFor(() => {
      expect(onConfigChange).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });
});
