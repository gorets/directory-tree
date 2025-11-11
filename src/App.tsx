import { useState } from 'react';
import { SelectableTreeWithConfig } from './components/SelectableTreeView/index.js';

const token = 'wsk-v1-9NWAgbA6QFFts0H2mIkxQPMQkeJRvmjqTW2tlASevRYC5bWyujXc3HbbbcVvhHmoheRwOtEmvHHzp8Xc3ZD2Zk8KPa3tr';

function App() {
  const [pages, setPages] = useState<any[]>([]);
  const [treeConfig, setTreeConfig] = useState({ enabled: [] as string[], disabled: [] as string[] });

  const fetchTreeNode = async (parentId: string = 'root') => {
    try {
      const response = await fetch(`https://kb.wim-stage.wildix.com/api/v1/data-sources/43c16eeb-73c9-4bfc-b98e-dba277bd26c8/extra-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          "parameters": {
            "pages": {
              spaceId: "30277677",
              parentId
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const { extraInfo } = await response.json();

      // API doesn't return parentId, so we set it ourselves based on the request
      const pages = extraInfo.pages.map((page: any) => ({
        id: page.id,
        parentId: parentId, // Use the parentId we requested with
        title: page.title,
        type: 'unknown',
      }));

      setPages((prevPages) => {
        // Create a map of existing pages by ID
        const pageMap = new Map(prevPages.map((p: any) => [p.id, p]));
        
        // Update or add pages - always set to ensure correct parentId
        for (const page of pages) {
          pageMap.set(page.id, page);
        }
        
        return Array.from(pageMap.values());
      });

    } catch (error: any) {
      console.error('Failed to load pages:', error);
    }
  };

  return (
    <>
      <div>Hello From React App!</div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexDirection: 'row', marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ width: '50%' }}>
          <SelectableTreeWithConfig
            items={pages}
            config={treeConfig}
            onNodeLoad={fetchTreeNode}
            onConfigChange={(config) => {
              setTreeConfig(config);
            }}
          />
        </div>
        <div style={{font: 'pre-wrap', width: '45%', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px', height: '400px', overflow: 'auto' }}>
          {JSON.stringify(treeConfig, null, 2)}
        </div>
      </div>

    </>
  );
}

export default App;

