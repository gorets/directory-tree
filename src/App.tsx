import { useState, useEffect, useCallback } from 'react';
import { SelectableTreeWithConfig, TreeSyncConfig } from './components/SelectableTreeView/index.js';

const token = 'wsk-v1-9NWAgbA6QFFts0H2mIkxQPMQkeJRvmjqTW2tlASevRYC5bWyujXc3HbbbcVvhHmoheRwOtEmvHHzp8Xc3ZD2Zk8KPa3tr';


const loadedConfig = {
  "enabled": [
    "30284778",
    "30284546",
    "30284927"
  ],
  "disabled": [
    "30278049"
  ]
}

const fetchConfigFromAPI = (): Promise<typeof loadedConfig> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(loadedConfig);
    }, 500);
  });
};

function App() {
  const [pages, setPages] = useState<any[]>([]);
  const [treeConfig, setTreeConfig] = useState({ enabled: [] as string[], disabled: [] as string[] });
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingTreeData, setIsLoadingTreeData] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const config = await fetchConfigFromAPI();
        if (isMounted) {
          setTreeConfig(config);
          if (config.enabled.length) {
            console.log('Fetching root with enabled pages:', config.enabled);
            fetchTreeNode(null, config.enabled);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading config:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingConfig(false);
        }
      }
    };

    loadConfig();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const fetchTreeNode = useCallback(async (parentId: string | null = null, parentPages: (string | Number)[] | undefined = undefined) => {
    try {
      setIsLoadingTreeData(true);
      const response = await fetch(`http://localhost:3000/api/v1/data-sources/43c16eeb-73c9-4bfc-b98e-dba277bd26c8/extra-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          "parameters": {
            "pages": {
              spaceId: "30277677",
              parentId: parentId !== 'root' ? parentId : null,
              parentPages,
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const { extraInfo } = await response.json();

      // API doesn't return parentId, so we set it ourselves based on the request
      const pages = extraInfo.pages
        // .filter((page: any) => page.status === 'current')
        .map((page: any) => ({
          id: page.id,
          parentId: page.parentId ?? parentId, // Use the parentId we requested with
          title: page.title,
          position: page.position ?? 0, // Preserve position for sorting
          type: 'unknown',
        }));

      setUniquePages(pages);
      setIsLoadingTreeData(false);
    } catch (error: any) {
      setIsLoadingTreeData(false);
      console.error('Failed to load pages:', error);
    }
  }, []);

  function setUniquePages(newPages: any[]) {
    setPages((prevPages) => {
      // Create a map of existing pages by ID
      const pageMap = new Map(prevPages.map((p: any) => [p.id, p]));

      // Update or add pages - always set to ensure correct parentId
      for (const page of newPages) {
        pageMap.set(page.id, page);
      }

      // Sort all pages by position within their parent groups
      const result = Array.from(pageMap.values());
      result.sort((a: any, b: any) => {
        // First sort by parentId (to keep hierarchy)
        if (a.parentId !== b.parentId) {
          return 0; // Keep original parent grouping
        }
        // Then sort by position within same parent
        return (a.position ?? 0) - (b.position ?? 0);
      });

      return result;
    });
  }

  function updateConfigIfItWasChanged(config: TreeSyncConfig) {
    console.log('Config was changed:', config);

    const enabledChanged = config.enabled.length !== treeConfig.enabled.length ||
      config.enabled.some((id, i) => id !== treeConfig.enabled[i]);
    const disabledChanged = config.disabled.length !== treeConfig.disabled.length ||
      config.disabled.some((id, i) => id !== treeConfig.disabled[i]);

    if (enabledChanged || disabledChanged) {
      setTreeConfig(config);
    }
  }

  return (
    <>
      <div style={{
        display: 'flex', gap: '10px', justifyContent: 'space-between', flexDirection: 'row',
        marginTop: '20px', marginBottom: '20px'
      }}>
        <div style={{
          width: '50%', height: '95vh', overflow: 'auto', border: '1px solid #ccc',
          borderRadius: '5px', padding: '10px', boxSizing: 'border-box', position: 'relative'
        }}>
          {isLoadingTreeData && (
            <div style={{
              position: 'absolute', top: '0', right: '0',
              padding: '20px', textAlign: 'center', color: '#999'
            }}>Tree Loading...</div>
          )}
          <SelectableTreeWithConfig
            items={pages}
            config={treeConfig}
            onNodeLoad={fetchTreeNode}
            onConfigChange={(config) => {
              updateConfigIfItWasChanged(config);
            }}
          />
        </div>
        <div style={{
          fontFamily: 'monospace', width: '45%', height: '95vh', backgroundColor: '#f0f0f0', position: 'relative',
          padding: '10px', borderRadius: '5px', overflow: 'auto', border: '1px solid #ccc', boxSizing: 'border-box'
        }}>
          {isLoadingConfig ? (
            <div style={{
              position: 'absolute', top: '0', right: '0',
              padding: '20px', textAlign: 'center', color: '#999'
            }}>Config Loading...</div>
          ) : (
            <pre style={{ margin: 0 }}>
              {JSON.stringify(treeConfig, null, 2)}
            </pre>
          )}
        </div>
      </div>

    </>
  );
}

export default App;

