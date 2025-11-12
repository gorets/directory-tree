# SelectableTreeWithConfig - Функциональное описание

## Описание функционала SelectableTreeWithConfig

### Основная цель
Реализовать иерархическое дерево с чекбоксами, которое синхронизирует состояние выбора с конфигом в виде двух массивов: `enabled` и `disabled`.

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
- Должны в конфиге появляться **только явно выбранные узлы** (те, что кликал пользователь)
- **НЕ должны включаться** автоматические потомки (которые inherited от parent)
- Конфиг должен быть **минимальным** - содержать только необходимые ID для восстановления состояния

**Применение конфига на UI:**
- Когда приходит конфиг → все элементы из `enabled` становятся checked
- Их потомки (даже если их нет в конфиге) автоматически становятся checked
- Элементы из `disabled` становятся unchecked
- Их потомки (кроме явно enabled) автоматически unchecked

#### 7. **Критический нюанс: различие между явными и унаследованными**

Нужно различать:

```typescript
// Явно выбранные (должны быть в конфиге)
explicitlyChecked = {
  "30277679"  // пользователь кликнул на этот элемент
}

// Все checked (включая унаследованные)
allChecked = {
  "30277679",      // явно selected
  "30284778",      // дитя, унаследовало checked от parent
  "30284524",      // дитя, унаследовало checked от parent
  // ... все потомки
}
```

**Конфиг должен содержать ТОЛЬКО `explicitlyChecked`, а НЕ `allChecked`!**

#### 8. **Debouncing**

Конфиг не должен меняться при каждом клике - нужен debounce (~100ms) перед вызовом `onConfigChange`

---

## Визуальный пример

**Шаг 1: Пусто**
```
☐ Root
  ☐ Child 1
  ☐ Child 2
config: { enabled: [], disabled: [] }
```

**Шаг 2: Кликнули на Root**
```
☑ Root
  ☑ Child 1  ← автоматически checked
  ☑ Child 2  ← автоматически checked
config: { enabled: ["root-id"], disabled: [] }
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

- **`SelectableTreeWithConfig`** - основной компонент
  - Props: `items`, `config`, `onConfigChange`, `onNodeLoad`, и т.д.
  - Должен управлять состоянием checked/unchecked для всех элементов
  - Генерировать минимальный конфиг при изменениях
  - Применять приходящий конфиг к UI

- **`generateMinimalConfig(items, checkedItems, checkedState, getId)`** - генерирует конфиг
  - **INPUT:** только явно выбранные элементы (а не все checked)
  - **OUTPUT:** минимальный конфиг `{ enabled, disabled }`
  - Должна оптимизировать для частичного выбора

---

## Критические баги, которые нужно избежать

### ❌ Bug 1: Добавление всех потомков в конфиг
**Проблема:** Когда пользователь выбирает parent, в конфиг добавляются ID ВСЕХ его потомков вместо только parent ID.

**Решение:** Отслеживать только явно выбранные узлы, не включать унаследованные от parent.

### ❌ Bug 2: Добавление детей при раскрытии ветки
**Проблема:** Когда пользователь раскрывает ветку и загружаются дети, они автоматически добавляются в конфиг, даже если не были явно выбраны.

**Решение:** Различать `checkedItems` (все checked, включая унаследованные) и `explicitlyCheckedItems` (только явно выбранные). Конфиг должен генерироваться ТОЛЬКО из `explicitlyCheckedItems`.

### ❌ Bug 3: Бесконечные обновления конфига
**Проблема:** При каждом изменении state вызывается `onConfigChange`, что вызывает re-render и новое пересчитывание конфига.

**Решение:** 
1. Использовать debounce перед вызовом `onConfigChange`
2. Проверять, действительно ли конфиг изменился перед вызовом callback'а в родительском компоненте
3. Использовать флаг `isApplyingConfig` для различия изменений от пользователя vs от применения конфига

### ❌ Bug 4: Дублирование двойной загрузки (React.StrictMode)
**Проблема:** В режиме разработки React 18 запускает эффекты дважды для проверки побочных эффектов.

**Решение:** Использовать `isMounted` флаг и `AbortController` для очистки при размонтировании.

---

## Алгоритм генерации минимального конфига

```
1. Начать с пустых массивов enabled и disabled
2. Для каждого item в items:
   a. Определить его состояние:
      - fully checked (все дети checked)
      - fully unchecked (все дети unchecked)
      - partial/indeterminate (часть детей checked)
   
   b. В зависимости от parentState (null для roots):
      - null (root level):
        * fully checked → добавить в enabled
        * fully unchecked → пропустить
        * partial → оптимизировать (большинство checked → enabled + disable меньшинство)
      
      - 'enabled' (parent в enabled):
        * fully unchecked → добавить в disabled
        * fully checked → пропустить
        * partial → оптимизировать
      
      - 'disabled' (parent в disabled):
        * fully checked → добавить в enabled
        * fully unchecked → пропустить
        * partial → оптимизировать

3. Вернуть { enabled, disabled }
```

---

## Реализационные советы

1. **Используйте Set вместо Array** для `checkedItems` и `explicitlyCheckedItems` - O(1) lookup вместо O(n)
2. **Кешируйте Set'ы** из конфига: `enabledSet = new Set(config.enabled)` в useMemo
3. **Используйте useRef** для флагов типа `isApplyingConfig` чтобы не вызывать re-render
4. **Используйте useCallback** для функций, передаваемых как deps в useEffect
5. **Отслеживайте loadedParents** чтобы не делать дублирующие API запросы
6. **Используйте плоский filter** для поиска детей вместо рекурсии: `items.filter(it => it.parentId === parentId)`
