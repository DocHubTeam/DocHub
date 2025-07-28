const DocumentIndexer = require('./document-indexer');
const fs = require('fs');
const path = require('path');

async function buildDocumentIndex() {
  try {
    const indexer = new DocumentIndexer();
    const index = await indexer.indexDocuments();

    // Create build directory if it doesn't exist
    const buildDir = path.join(__dirname, '../../public/build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Write index to file
    const indexPath = path.join(buildDir, 'document-index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

    console.log(`Document index built successfully: ${indexPath}`);
    console.log(`Total documents indexed: ${Object.keys(index).length}`);
  } catch (error) {
    console.error('Error building document index:', error);
    process.exit(1);
  }
}

buildDocumentIndex(); 