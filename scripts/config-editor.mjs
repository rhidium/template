import { readFileSync } from 'fs';

(async () => {
  let jsonEditor;
  try  {
    jsonEditor = await import('@rhidium/json-editor');
  }
  catch {
    console.error('Please install @rhidium/json-editor: "npm i -D @rhidium/json-editor"');
    process.exit(1);
  }

  const {
    startJSONEditor,
  } = jsonEditor;
  
  const jsonSchema = readFileSync('./config.schema.json', { encoding: 'utf-8' });
  
  startJSONEditor({
    port: 3000,
    dataFilePath: './config.json',
    createBackup: true,
    schemaString: jsonSchema,
  });
})();
