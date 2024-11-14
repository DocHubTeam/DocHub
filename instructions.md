# Global Search Implementation

## Overview
Implement a global search functionality that allows users to search across all entities in the system including components, aspects, documents, and document content.

## Requirements

### UI Requirements
1. Search Input
   - Keep existing search input in Menu.vue
   - Maintain current search input style
   - Trigger search on Enter key or search button click
   - Remove menu filtering functionality

2. Search Results Display
   - Show results in main panel
   - Use grid view with columns:
     - Entity type (with color coding)
     - ID
     - Title (clickable link)
   - Sort results by entity ID
   - Use existing grid component styling
   - Show "No results found" message when appropriate
   - Add "Found in content" indicator for matches in document text

### Search Functionality
1. Basic Search (Implemented)
   - Search across components:
     - ID
     - Title
     - Technologies
     - Aspects
   - Search across aspects:
     - ID
     - Title
     - Location
   - Search across documents:
     - ID
     - Title/Description
     - Subjects
     - Location

2. Content Search (Planned)
   - Search within markdown document content
   - Use document source field from YAML:
     ```yaml
     docs:
         dochub.manual:
             location: DocHub/Руководство
             description: Руководство
             type: markdown
             source: introduction.md
             subjects:
               - dochub
               - dochub.front
     ```
   - Index document content during build
   - Cache search results for performance
   - Show content match indicator in results

### Technical Requirements
1. Search Implementation
   - Use JSONata queries for search
   - Implement fuzzy matching for better results
   - Handle all entity types consistently
   - Ensure proper error handling
   - Maintain performance with large datasets

2. Document Content Search (Future)
   - Create search index during build process
   - Index markdown content and headers
   - Implement efficient content searching
   - Consider caching mechanisms
   - Add pagination for large result sets

## Technical Architecture
1. Components
   - Menu.vue: Search input
   - SearchResults.vue: Results display
   - queries.mjs: Search query implementation

2. Data Flow
   - User enters search term
   - JSONata query processes search
   - Results displayed in grid view
   - Links navigate to entities

## YAML Structure
Documents are defined in YAML files with the following structure:
```yaml
docs:
    [document_id]:
        location: [navigation path]
        description: [display text]
        type: [document type]
        source: [content file]
        subjects: [related items]
```

Components and aspects follow their existing YAML structure and are searched using the same mechanism.
