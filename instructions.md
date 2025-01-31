# Global Search Implementation

## Overview
Implement a global search functionality that allows users to search across all entities in the system including components, aspects, and documents with content search.

## Requirements

### UI Requirements
1. Search Input
   - Search input in Menu.vue
   - Trigger search on Enter key or search button click
   - Clear input button
   - Placeholder text "Поиск..."

2. Search Results Display
   - Results shown in main panel using v-data-table
   - Columns:
     - Type (with color-coded chips: 
       - "Компонент" (blue)
       - "Аспект" (green)
       - "Документ" (light blue))
     - Title (clickable link)
     - Score (for relevance sorting)
   - Content matches shown with:
     - "Найдено в содержимом" indicator
     - Content snippet with highlighted matches
   - Sort results by relevance score
   - "Результаты не найдены" message when no matches

### Search Functionality
1. Components Search
   - Search in:
     - Component ID
     - Component title
     - Technologies list
   - Display with:
     - Blue chip labeled "Компонент"
     - Link to component page
     - Score: 5

2. Aspects Search
   - Search in:
     - Aspect ID
     - Aspect title
     - Location
   - Display with:
     - Green chip labeled "Аспект"
     - Link to aspect page
     - Score: 5

3. Document Content Search
   - Search in:
     - Document ID
     - Document title/description
     - Document content
     - Document subjects
   - Display with:
     - Light blue chip labeled "Документ"
     - Link to document
     - Content snippet
     - Score based on match location

### Technical Implementation
1. Build-time Indexing
   - Index documents during build
   - Parse markdown content
   - Extract headers and keywords
   - Store in document-index.json

2. Runtime Search
   - Load document index on startup
   - Access Vuex store for components/aspects
   - Combine search results
   - Sort by relevance score
   - Remove duplicates

3. Search Result Format
   ```javascript
   {
     id: string,           // Entity ID
     title: string,        // Display title
     entity: string,       // "component" | "aspect" | "document"
     link: string,         // Router link
     score: number,        // Relevance score
     matchedInContent?: boolean,  // For documents only
     contentSnippet?: string      // For documents only
   }
   ```

## File Structure
- src/frontend/components/Search/SearchResults.vue - Search results component
- src/frontend/manifest/query.js - Search implementation
- src/build/document-indexer.js - Document indexing
- src/build/index-documents.js - Build script

## Language Requirements
All user interface elements must be in Russian:
1. Search input placeholder: "Поиск..."
2. Entity types:
   - Component: "Компонент"
   - Aspect: "Аспект" 
   - Document: "Документ"
3. Search indicators:
   - "Найдено в содержимом" for content matches
   - "Результаты не найдены" for no results
4. Column headers:
   - "Тип" for entity type
   - "Заголовок" for title
   - "Релевантность" for score
