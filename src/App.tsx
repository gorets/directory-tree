import { useState, useEffect } from 'react';
import { SelectableTreeWithConfig, TreeSyncConfig } from './components/SelectableTreeView/index.js';

const token = 'wsk-v1-9NWAgbA6QFFts0H2mIkxQPMQkeJRvmjqTW2tlASevRYC5bWyujXc3HbbbcVvhHmoheRwOtEmvHHzp8Xc3ZD2Zk8KPa3tr';


const loadedConfig = {
  "enabled": [
    // "30284778",
    // "30284524",
    // "244219905",
    // "30284063",
    // "30284778",
    // "30284524",
    // "244219905",
    // "30284063",
    // "30280963",
    // "30285286",
    // "30285148",
    // "30282858",
    // "30284898",
    // "30283062",
    // "30285078",
    // "244219905",
    // "30284063"
  ],
  "disabled": [
    // "30278243",
    // "30284707",
    // "30278243",
    // "30284707"
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

  const fetchTreeNode = async (parentId: string | null = null, parentPages: (string | Number)[] | undefined = undefined) => {
    try {
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
          childPosition: page.childPosition ?? 0, // Preserve childPosition for sorting
          type: 'unknown',
        }));

      setUniquePages(pages);
    } catch (error: any) {
      console.error('Failed to load pages:', error);
    }
  };

  function setUniquePages(newPages: any[]) {
    setPages((prevPages) => {
      // Create a map of existing pages by ID
      const pageMap = new Map(prevPages.map((p: any) => [p.id, p]));

      // Update or add pages - always set to ensure correct parentId
      for (const page of newPages) {
        pageMap.set(page.id, page);
      }

      // Sort all pages by childPosition within their parent groups
      const result = Array.from(pageMap.values());
      result.sort((a: any, b: any) => {
        // First sort by parentId (to keep hierarchy)
        if (a.parentId !== b.parentId) {
          return 0; // Keep original parent grouping
        }
        // Then sort by childPosition within same parent
        return (a.childPosition ?? 0) - (b.childPosition ?? 0);
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
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexDirection: 'row', marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ width: '50%', height: '95vh', overflow: 'auto', border: '1px solid #ccc', borderRadius: '5px', padding: '10px', boxSizing: 'border-box' }}>
          {isLoadingConfig ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Tree Loading...</div>
          ) : (
            <SelectableTreeWithConfig
              items={pages}
              config={treeConfig}
              onNodeLoad={fetchTreeNode}
              onConfigChange={(config) => {
                updateConfigIfItWasChanged(config);
              }}
            />
          )}
        </div>
        <div style={{ fontFamily: 'monospace', width: '45%', height: '95vh', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px', overflow: 'auto', border: '1px solid #ccc', boxSizing: 'border-box' }}>
          {isLoadingConfig ? (
            <div style={{ padding: '10px', backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '5px', margin: '10px 0 20px 0' }}>
              ⏳ Config is loading from the API...
            </div>
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

