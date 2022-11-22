# caddy-baron
Downloads Caddy for use in npm/npx scripts

- Downloads the latest version of Caddy, unless you define the CADDYVERSION env var, eg
````
cross-env CADDYVERSION=v2.6.1 npm run start
````