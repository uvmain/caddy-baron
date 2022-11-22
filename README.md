# caddy-baron
Downloads Caddy for use in npm/npx scripts

- Downloads the latest version of Caddy
- No dependency on the unmaintained "download" package
- Use with npm-run-all to run Caddy in parallel with your application, eg:

````
"scripts": {
    "caddy": "caddy run --config Caddyfile",
    "local-https": "node server.js",
    "dev": "run-p caddy local-https",
}
````