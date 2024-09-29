# tremolo-ui/site

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Local Development

(on project root dir)

```bash
npm run docs
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

#### i18n

```bash
npm run docs -- --locale ja
```

use `write-translations` command

```bash
npm run docs:wtr -- --locale ja
```

### Build

(on project root dir)

```
npm run build:docs
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Deploy to Vercel  
-> https://tremolo-ui.vercel.app/
