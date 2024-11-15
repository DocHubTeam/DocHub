const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { marked } = require('marked');
const keywordExtractor = require('keyword-extractor');

class DocumentIndexer {
  constructor(baseDir = 'public/documentation') {
    this.baseDir = baseDir;
    this.docTypes = {
      markdown: this.processMarkdown,
      OpenAPI: this.processOpenAPI,
      plantuml: this.processPlantuml
    };

    // Configure marked for header extraction
    this.headers = [];
    marked.use({
      headerIds: false,
      walkTokens: token => {
        if (token.type === 'heading') {
          this.headers.push({
            level: token.depth,
            text: token.text
          });
        }
      }
    });
  }

  // Main indexing function
  async indexDocuments() {
    const index = {};
    const yamlFiles = this.findYamlFiles(this.baseDir);

    for (const yamlFile of yamlFiles) {
      try {
        const yamlContent = yaml.load(fs.readFileSync(yamlFile, 'utf8'));
        if (yamlContent.docs) {
          const docsIndex = await this.processDocsSection(yamlContent.docs, path.dirname(yamlFile));
          Object.assign(index, docsIndex);
        }
      } catch (error) {
        console.error(`Error processing ${yamlFile}:`, error);
      }
    }

    return index;
  }

  // Find all YAML files recursively
  findYamlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.findYamlFiles(fullPath));
      } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  // Process docs section from YAML
  async processDocsSection(docs, yamlDir) {
    const index = {};

    for (const [docId, doc] of Object.entries(docs)) {
      if (!doc.source || !doc.type) continue;

      const processor = this.docTypes[doc.type];
      if (!processor) {
        console.warn(`Unknown document type: ${doc.type} for ${docId}`);
        continue;
      }

      try {
        const sourcePath = path.join(yamlDir, doc.source);
        const { content, headers, keywords } = await processor.call(this, sourcePath);
        
        index[docId] = {
          metadata: {
            id: docId,
            location: doc.location,
            description: doc.description,
            type: doc.type,
            subjects: doc.subjects || []
          },
          content,
          headers,
          keywords,
          sourcePath: path.relative(this.baseDir, sourcePath)
        };
      } catch (error) {
        console.error(`Error processing ${docId}:`, error);
      }
    }

    return index;
  }

  // Extract keywords from text
  extractKeywords(text) {
    return keywordExtractor.extract(text, {
      language: "russian",
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true
    });
  }

  // Document type processors
  async processMarkdown(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Reset headers array before parsing
    this.headers = [];
    
    // Parse markdown and extract headers
    const parsedContent = marked.parse(content);
    const headers = [...this.headers]; // Copy headers array
    
    // Extract keywords from raw content
    const keywords = this.extractKeywords(content);

    return {
      content: content, // Store original markdown
      parsedContent, // Store HTML version
      headers,
      keywords
    };
  }

  async processOpenAPI(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const parsedContent = yaml.load(content);
    
    // Extract keywords from title, description and operation summaries
    const keywords = this.extractKeywords([
      parsedContent.info?.title,
      parsedContent.info?.description,
      ...Object.values(parsedContent.paths || {})
        .flatMap(path => Object.values(path)
          .map(op => op.summary))
    ].filter(Boolean).join(' '));

    return {
      content,
      parsedContent,
      headers: [],
      keywords
    };
  }

  async processPlantuml(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Extract keywords from PlantUML comments and labels
    const keywords = this.extractKeywords(
      content.replace(/[@{}]/g, ' ')
    );

    return {
      content,
      headers: [],
      keywords
    };
  }
}

module.exports = DocumentIndexer; 