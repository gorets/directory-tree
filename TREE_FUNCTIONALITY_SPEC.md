# SelectableTreeWithConfig - Функциональное описание

## Описание функционала SelectableTreeWithConfig

### Основная цель
Реализовать иерархическое дерево с чекбоксами, которое синхронизирует состояние выбора с конфигом в виде двух массивов: `enabled` и `disabled`.

**Ключевая особенность:** Конфиг содержит только **явно выбранные узлы**, потомки наследуют состояние от parent'ов автоматически.

### Ключевые характеристики

#### 1. **Структура данных дерева**
- Дерево представлено **плоским массивом** (flat array), а не nested структурой
- Каждый элемент имеет:
  - `id` - уникальный идентификатор
  - `parentId` - ID parent элемента (или `'root'` / `null` для корневых элементов)
  - `title` - название
  - Другие поля (опциональные)

#### 2. **Конфиг с двумя массивами**
```typescript
config = {
  enabled: string[],   // ID элементов, которые explicitly enabled
  disabled: string[]   // ID элементов, которые explicitly disabled
}
```

**Логика наследования:**
- Если `parent` в `enabled` → все его **потомки** (дети, внуки и т.д.) **автоматически checked**, кроме тех, что явно в `disabled`
- Если `parent` в `disabled` → все его **потомки автоматически unchecked**, кроме тех, что явно в `enabled`
- Если потомок ЯВНО в конфиге → он переопределяет состояние parent

#### 3. **Поведение при клике на элемент**

**Шаг за шагом:**

1. Пользователь кликает на **parent элемент** с несколькими unchecked детьми
2. Parent становится **checked**
3. В конфиг добавляется **ТОЛЬКО ID самого parent**, например: `enabled: ["30277679"]`
4. Дети parent'а:
   - Визуально становятся **checked** (наследуют состояние parent)
   - **НО в конфиг они НЕ добавляются** (не нужно явно указывать ID всех потомков)

#### 4. **Поведение при раскрытии ветки (загрузка детей)**

**Сценарий:**
1. Parent уже в конфиге как enabled: `enabled: ["30277679"]`
2. Пользователь кликает на стрелку рядом с parent, чтобы раскрыть ветку
3. Срабатывает `onNodeLoad` callback, который загружает детей с API
4. Дети добавляются в `items` (плоский массив)
5. **ВАЖНО:** Дети автоматически становятся checked (через наследование от parent)
6. **КРИТИЧНО:** В конфиг НЕ должны добавляться ID детей!
7. Конфиг остаётся: `enabled: ["30277679"]` (только ID parent)

#### 5. **Частичный выбор (Indeterminate state)**

Если у parent'а:
- **Все дети** checked → parent fully checked
- **Часть детей** checked → parent indeterminate (полузаполненный чекбокс)
- **Ни один child** не checked → parent unchecked

При partial state (indeterminate) нужно оптимизировать конфиг:
- Если большинство детей checked → добавить parent в `enabled` и явно указать unchecked детей в `disabled`
- Если большинство детей unchecked → добавить parent в `disabled` и явно указать checked детей в `enabled`

#### 6. **Синхронизация конфига**

**Генерация конфига из UI состояния:**
- Должны в конфиге появляться **только явно выбранные узлы** (те, что кликал пользователь ИЛИ загружены из конфига)
- **НЕ должны включаться** автоматические потомки (которые inherited от parent)
- Конфиг должен быть **минимальным** - содержать только необходимые ID для восстановления состояния

**Применение конфига на UI:**
- Когда приходит конфиг → все элементы из `enabled` становятся checked
- Их потомки (даже если их нет в конфиге) автоматически становятся checked
- Элементы из `disabled` становятся unchecked
- Их потомки (кроме явно enabled) автоматически unchecked

#### 7. **Отслеживание явных действий пользователя**

Компонент различает:

```typescript
// Явные действия пользователя (должны быть в конфиге)
explicitActions = Map<itemId, 'enabled' | 'disabled'> {
  "30277679": 'enabled'    // пользователь кликнул на этот элемент
}

// Все checked (включая унаследованные)
checkedItems = Set<string> {
  "30277679",      // явно enabled
  "30284778",      // дитя, унаследовало checked от parent
  "30284524",      // дитя, унаследовало checked от parent
  // ... все потомки
}
```

**Конфиг генерируется ТОЛЬКО из `explicitActions`, а НЕ из `checkedItems`!**

#### 8. **Debouncing и батчинг обновлений**

- Конфиг не должен меняться при каждом клике - используется debounce (~100ms) перед вызовом `onConfigChange`
- `setState` вызовы батчируются React'ом автоматически (React 17+)
- В App компоненте используется `setTimeout(..., 0)` для гарантии что `setState` произойдет после рендера дочерних компонентов

#### 9. **Предотвращение React warning'ов**

**"Cannot update a component while rendering a different component":**
- Все callbacks обернуты в `useCallback` для стабилизации ссылок
- `onNodeLoad` в App обернута в `useCallback` 
- Обновления state отложены через `setTimeout(..., 0)` чтобы избежать синхронных обновлений во время рендера

---

## Визуальный пример

**Шаг 1: Пусто**
```
☐ Root
  ☐ Child 1
  ☐ Child 2
config: { enabled: [], disabled: [] }
explicitActions: Map {}
```

**Шаг 2: Кликнули на Root**
```
☑ Root
  ☑ Child 1  ← автоматически checked
  ☑ Child 2  ← автоматически checked
config: { enabled: ["root-id"], disabled: [] }
explicitActions: Map { "root-id" → 'enabled' }
```

**Шаг 3: Раскрыли Root (загрузили детей с API)**
```
☑ Root
  ▼ Child 1
    ☑ Grandchild 1.1  ← автоматически checked (наследует от Child 1)
    ☑ Grandchild 1.2
  ☑ Child 2
    ☑ Grandchild 2.1  ← автоматически checked
config: { enabled: ["root-id"], disabled: [] }  ← БЕЗ изменений!
explicitActions: Map { "root-id" → 'enabled' }  ← Без изменений!
```

**Шаг 4: Откликнули Grandchild 1.1**
```
☑ Root
  ◐ Child 1  ← partial (некоторые дети unchecked)
    ☐ Grandchild 1.1  ← unchecked
    ☑ Grandchild 1.2
  ☑ Child 2
    ☑ Grandchild 2.1
config: {
  enabled: ["root-id"],
  disabled: ["grandchild-1.1-id"]
}
explicitActions: Map {
  "root-id" → 'enabled',
  "grandchild-1.1-id" → 'disabled'
}
```

---

## Основные типы

```typescript
interface TreeSyncConfig {
  enabled: string[];    // IDs явно enabled элементов
  disabled: string[];   // IDs явно disabled элементов
}

interface TreeNodeState {
  checked: boolean;
  indeterminate: boolean;
}

interface TreeItem {
  id: string;
  parentId: string | null;
  title: string;
  [key: string]: any;
}
```

---

## Основные функции компонента

### `SelectableTreeWithConfig<T>` - основной компонент

**Props:**
- `items: T[]` - плоский массив элементов дерева
- `config: TreeSyncConfig` - конфиг с `enabled` и `disabled` массивами
- `onConfigChange: (config: TreeSyncConfig) => void` - callback при изменении конфига
- `onNodeLoad: (parentId: string) => Promise<void> | void` - загрузить детей для узла
- `getId: (item: T) => string` - функция для получения ID элемента
- `getTitle: (item: T) => string` - функция для получения названия элемента
- Опциональные: `renderTitle`, `expandedNodes`, `onExpandedNodesChange`

**Внутреннее состояние:**
- `checkedItems: Set<string>` - все checked элементы (включая унаследованные)
- `explicitActions: Map<string, 'enabled' | 'disabled'>` - только явно выбранные/отмененные узлы
- `expandedNodes: Set<string>` - раскрытые узлы
- `loadingNodes: Set<string>` - узлы в процессе загрузки

**Поведение:**
- Управляет состоянием checked/unchecked для всех элементов
- Генерирует минимальный конфиг при изменениях
- Применяет приходящий конфиг к UI
- Отслеживает какие узлы загружены чтобы избежать дублирующих запросов

### `generateMinimalConfig<T>()` - генерирует конфиг

```typescript
function generateMinimalConfig<T>(
  explicitActions: Map<string, 'enabled' | 'disabled'>
): TreeSyncConfig
```

**INPUT:** 
- `explicitActions` - Map явных действий пользователя (только эти элементы в конфиге)

**OUTPUT:** 
- Минимальный конфиг `{ enabled, disabled }` для восстановления состояния

**Алгоритм:**
1. Для каждого элемента в `explicitActions`
2. Если action = 'enabled' → добавить ID в `config.enabled`
3. Если action = 'disabled' → добавить ID в `config.disabled`
4. Вернуть `{ enabled, disabled }`

---

## Критические баги и их решения

### ❌ Bug 1: Добавление всех потомков в конфиг
**Проблема:** Когда пользователь выбирает parent, в конфиг добавляются ID ВСЕХ его потомков вместо только parent ID.

**Решение:** 
- Использовать `explicitActions` Map вместо простого Set
- Генерировать конфиг ТОЛЬКО из явных действий в `explicitActions`
- Не рекурсивно добавлять потомков

**Проверка:** При клике на parent в конфиге должен быть только один ID этого parent.

### ❌ Bug 2: Добавление детей при раскрытии ветки
**Проблема:** Когда пользователь раскрывает ветку и загружаются дети, они автоматически добавляются в конфиг, даже если не были явно выбраны.

**Решение:** 
- `explicitActions` содержит ТОЛЬКО то, что пользователь явно выбрал
- При загрузке дети не добавляются в `explicitActions`
- Дети наследуют состояние от parent

**Проверка:** При раскрытии ветки конфиг не должен меняться.

### ❌ Bug 3: Бесконечные обновления конфига
**Проблема:** При каждом изменении state вызывается `onConfigChange`, что вызывает re-render и новое пересчитывание конфига.

**Решение:** 
1. Debounce 100ms перед вызовом `onConfigChange` в `useEffect`
2. Проверка изменений конфига в App компоненте перед вызовом `setTreeConfig`
3. Флаг `isApplyingConfig` для различия изменений от пользователя vs от применения конфига
4. Генерация конфига отложена на следующий tick через `setTimeout(..., 0)`

**Проверка:** Конфиг в UI обновляется один раз после действия пользователя, не множество раз.

### ❌ Bug 4: "Cannot update a component while rendering a different component"
**Проблема:** React warning при обновлении state в App во время рендера SelectableTreeWithConfig.

**Решение:**
- Обернуть `onNodeLoad` в `useCallback` в App компоненте
- Использовать `setTimeout(..., 0)` для отложения `setState` вызовов
- Убедиться что все callbacks стабильны через `useCallback`

**Проверка:** Нет warning'ов в консоли при клике на узел или раскрытии ветки.

### ❌ Bug 5: Дублирование двойной загрузки (React.StrictMode)
**Проблема:** В режиме разработки React 18 запускает эффекты дважды для проверки побочных эффектов.

**Решение:** 
- Использовать `loadedParentsRef` Set для отслеживания уже загруженных узлов
- Использовать `isMounted` флаг в async функциях для предотвращения обновления после unmount
- Использовать `AbortController` для отмены API запросов

**Проверка:** Никаких дублирующих API запросов даже в StrictMode.

---

## Алгоритм генерации минимального конфига

```
1. Создать пустые массивы enabled и disabled

2. Для каждой записи в explicitActions Map:
   - Если action = 'enabled' → добавить ID в enabled массив
   - Если action = 'disabled' → добавить ID в disabled массив

3. Вернуть { enabled, disabled }
```

**Это просто!** Все сложные вычисления происходят при применении конфига (вычисление inherited состояния).

---

## Реализационные советы

1. **Используйте Map для явных действий**
   - `explicitActions: Map<itemId, 'enabled' | 'disabled'>`
   - Генерация конфига проще: просто итерировать по entries Map'а

2. **Используйте Set для быстрого поиска**
   - `checkedItems: Set<string>` - O(1) lookup вместо O(n)
   - `expandedNodes: Set<string>` - для раскрытых узлов
   - `loadedParents: Set<string>` - отслеживание загруженных узлов

3. **Кешируйте конфиг Sets в useMemo**
   - `enabledSet = useMemo(() => new Set(config.enabled), [config.enabled])`
   - `disabledSet = useMemo(() => new Set(config.disabled), [config.disabled])`
   - O(1) lookup при применении конфига

4. **Используйте useRef для флагов**
   - `isApplyingConfig: Ref<boolean>` - не вызывает re-render
   - `loadedParentsRef: Ref<Set<string>>` - отслеживание загруженных узлов

5. **Используйте useCallback для стабилизации функций**
   - Все функции передаваемые как props должны быть в `useCallback`
   - Правильные зависимости чтобы избежать лишних обновлений

6. **Используйте плоский filter для поиска детей**
   - `items.filter(it => it.parentId === parentId)` - O(n) но просто
   - Лучше чем рекурсия или вложенная структура

7. **Debounce для onConfigChange**
   - `setTimeout(() => onConfigChange(...), 100)` в useEffect
   - Предотвращает множественные обновления при быстрых кликах

8. **setTimeout для setState в callbacks**
   - `setTimeout(() => setState(...), 0)` гарантирует что setState произойдет после рендера
   - Избегает React warning'ов о обновлении state во время рендера

---

## Flow диаграмма

```
User clicks checkbox
    ↓
handleToggle (useCallback)
    ↓
setCheckedItems + setExplicitActions (batch update)
    ↓
Both useEffects trigger
    ↓
checkedState recalculates (useMemo)
    ↓
Config generation useEffect triggers (debounced 100ms)
    ↓
generateMinimalConfig() creates config from explicitActions only
    ↓
onConfigChange callback called
    ↓
App's updateConfigIfItWasChanged called
    ↓
setTimeout(..., 0) → setTreeConfig (after render completes)
    ↓
App re-renders with new config
```

---

## Таблица состояний

| Действие | checkedItems | explicitActions | config.enabled | config.disabled | Результат |
|----------|--------------|-----------------|----------------|-----------------|-----------|
| Загрузка конфига | derives from config | из конфига | ["A"] | [] | A и все потомки checked |
| Клик на A | {A, A.1, A.2} | {"A": "enabled"} | ["A"] | [] | Только A в конфиге |
| Развернуть A | {A, A.1, A.2} | {"A": "enabled"} | ["A"] | [] | Конфиг не меняется |
| Клик на A.1 | {A, A.2} | {"A": "enabled", "A.1": "disabled"} | ["A"] | ["A.1"] | A enabled, A.1 явно disabled |
| Клик на A (второй раз) | {} | {} | [] | [] | Все unchecked |
