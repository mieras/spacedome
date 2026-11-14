import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: { projectId: '6fcexd1b', dataset: 'production' },
  typegen: {
    path: './src/**/*.{ts,tsx,astro}',
    schema: './sanity.schema.json',
    generates: './sanity.types.ts',
    overloadClientMethods: true,
  },
});
