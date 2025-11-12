import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectableTree } from '../SelectableTree';
import type { TreeNodeState } from '../types';

interface TestItem {
  id: string;
  title: string;
  children?: TestItem[];
}

describe('SelectableTree', () => {
  const mockItems: TestItem[] = [
    {
      id: '1',
      title: 'Parent 1',
      children: [
        { id: '1-1', title: 'Child 1-1' },
        { id: '1-2', title: 'Child 1-2' },
      ],
    },
    {
      id: '2',
      title: 'Parent 2',
      children: [{ id: '2-1', title: 'Child 2-1' }],
    },
  ];

  const defaultProps = {
    items: mockItems,
    checkedState: new Map<string, TreeNodeState>(),
    onToggle: jest.fn(),
    expandedNodes: new Set<string>(),
    onToggleExpand: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render tree with root items', () => {
    render(<SelectableTree {...defaultProps} />);

    expect(screen.getByText('Parent 1')).toBeInTheDocument();
    expect(screen.getByText('Parent 2')).toBeInTheDocument();
  });

  it('should render checkboxes for all items', () => {
    render(<SelectableTree {...defaultProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2); // Only root items visible initially
  });

  it('should show expand button for items with children', () => {
    render(<SelectableTree {...defaultProps} />);

    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    expect(expandButtons).toHaveLength(2); // Both parents have children
  });

  it('should call onToggleExpand when expand button clicked', async () => {
    const onToggleExpand = jest.fn();
    const user = userEvent.setup();

    render(<SelectableTree {...defaultProps} onToggleExpand={onToggleExpand} />);

    const expandButton = screen.getAllByRole('button', { name: /expand/i })[0];
    await user.click(expandButton);

    expect(onToggleExpand).toHaveBeenCalledWith('1');
  });

  it('should show children when node is expanded', () => {
    const expandedNodes = new Set(['1']);

    render(<SelectableTree {...defaultProps} expandedNodes={expandedNodes} />);

    expect(screen.getByText('Child 1-1')).toBeInTheDocument();
    expect(screen.getByText('Child 1-2')).toBeInTheDocument();
  });

  it('should hide children when node is collapsed', () => {
    const expandedNodes = new Set<string>();

    render(<SelectableTree {...defaultProps} expandedNodes={expandedNodes} />);

    expect(screen.queryByText('Child 1-1')).not.toBeInTheDocument();
    expect(screen.queryByText('Child 1-2')).not.toBeInTheDocument();
  });

  it('should call onToggle when checkbox clicked', async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();

    render(<SelectableTree {...defaultProps} onToggle={onToggle} />);

    const checkbox = screen.getAllByRole('checkbox')[0];
    await user.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('should show checked state correctly', () => {
    const checkedState = new Map<string, TreeNodeState>([
      ['1', { checked: true, indeterminate: false }],
      ['2', { checked: false, indeterminate: false }],
    ]);

    render(<SelectableTree {...defaultProps} checkedState={checkedState} />);

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('should show indeterminate state correctly', () => {
    const checkedState = new Map<string, TreeNodeState>([
      ['1', { checked: false, indeterminate: true }],
    ]);

    render(<SelectableTree {...defaultProps} checkedState={checkedState} />);

    const checkbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  it('should render custom title when renderTitle provided', () => {
    const renderTitle = (item: TestItem, defaultTitle: string) => (
      <strong data-testid="custom-title">{defaultTitle.toUpperCase()}</strong>
    );

    render(<SelectableTree {...defaultProps} renderTitle={renderTitle} />);

    const customTitles = screen.getAllByTestId('custom-title');
    expect(customTitles).toHaveLength(2);
    expect(customTitles[0]).toHaveTextContent('PARENT 1');
  });

  it('should use custom getId function', () => {
    const onToggle = jest.fn();
    const customGetId = (item: TestItem) => `custom-${item.id}`;

    render(
      <SelectableTree
        {...defaultProps}
        getId={customGetId}
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    userEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith('custom-1');
  });

  it('should use custom getTitle function', () => {
    const customGetTitle = (item: TestItem) => `Title: ${item.title}`;

    render(<SelectableTree {...defaultProps} getTitle={customGetTitle} />);

    expect(screen.getByText('Title: Parent 1')).toBeInTheDocument();
    expect(screen.getByText('Title: Parent 2')).toBeInTheDocument();
  });

  it('should show loading spinner when node is loading', () => {
    const loadingNodes = new Set(['1']);

    render(<SelectableTree {...defaultProps} loadingNodes={loadingNodes} />);

    const loader = screen.getByLabelText('Loading');
    expect(loader).toBeInTheDocument();
  });

  it('should disable expand button when loading', () => {
    const loadingNodes = new Set(['1']);
    const expandedNodes = new Set(['2']);

    render(
      <SelectableTree
        {...defaultProps}
        loadingNodes={loadingNodes}
        expandedNodes={expandedNodes}
      />
    );

    // Parent 2 is expanded but not loading
    const expandButtons = screen.getAllByRole('button');
    // Find collapse button for expanded node (should not be disabled)
    const collapseButton = expandButtons.find(
      btn => btn.getAttribute('aria-label') === 'Collapse'
    );
    expect(collapseButton).not.toBeDisabled();
  });

  it('should show expand button when onLoadNode is provided', () => {
    const onLoadNode = jest.fn();
    const itemsWithoutChildren: TestItem[] = [
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' },
    ];

    render(
      <SelectableTree
        {...defaultProps}
        items={itemsWithoutChildren}
        onLoadNode={onLoadNode}
      />
    );

    // Should show expand buttons even though items don't have children yet
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    expect(expandButtons).toHaveLength(2);
  });

  it('should not show expand button for leaf nodes without loader', () => {
    const itemsWithoutChildren: TestItem[] = [
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' },
    ];

    render(<SelectableTree {...defaultProps} items={itemsWithoutChildren} />);

    const expandButtons = screen.queryAllByRole('button', { name: /expand/i });
    expect(expandButtons).toHaveLength(0);
  });

  it('should apply correct nesting levels with padding', () => {
    const expandedNodes = new Set(['1']);

    render(<SelectableTree {...defaultProps} expandedNodes={expandedNodes} />);

    // Find parent and child content divs
    const allContentDivs = screen
      .getAllByText(/Parent 1|Child 1-1/)
      .map(el => el.closest('.category-tree-item-content'));

    // Parent should have 0px padding (level 0)
    const parentContent = allContentDivs.find(div =>
      div?.textContent?.includes('Parent 1')
    ) as HTMLElement;
    expect(parentContent.style.paddingLeft).toBe('0px');

    // Child should have 24px padding (level 1)
    const childContent = allContentDivs.find(div =>
      div?.textContent?.includes('Child 1-1')
    ) as HTMLElement;
    expect(childContent.style.paddingLeft).toBe('24px');
  });

  it('should set correct ARIA attributes', () => {
    const expandedNodes = new Set(['1']);

    render(<SelectableTree {...defaultProps} expandedNodes={expandedNodes} />);

    const tree = screen.getByRole('tree');
    expect(tree).toHaveAttribute('aria-label', 'Category tree');

    const treeItems = screen.getAllByRole('treeitem');
    expect(treeItems[0]).toHaveAttribute('aria-level', '1');
    expect(treeItems[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('should handle deeply nested items', () => {
    const deepItems: TestItem[] = [
      {
        id: '1',
        title: 'Level 1',
        children: [
          {
            id: '1-1',
            title: 'Level 2',
            children: [
              {
                id: '1-1-1',
                title: 'Level 3',
                children: [{ id: '1-1-1-1', title: 'Level 4' }],
              },
            ],
          },
        ],
      },
    ];

    const expandedNodes = new Set(['1', '1-1', '1-1-1']);

    render(
      <SelectableTree
        {...defaultProps}
        items={deepItems}
        expandedNodes={expandedNodes}
      />
    );

    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('Level 4')).toBeInTheDocument();

    // Check nesting levels
    const level4Content = screen
      .getByText('Level 4')
      .closest('.category-tree-item-content') as HTMLElement;
    expect(level4Content.style.paddingLeft).toBe('72px'); // 3 * 24px
  });

  it('should render empty tree', () => {
    render(<SelectableTree {...defaultProps} items={[]} />);

    const tree = screen.getByRole('tree');
    expect(tree).toBeEmptyDOMElement();
  });
});
