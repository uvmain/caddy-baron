# caddy-baron
Downloads the latest Caddy binary for use in npm/npx scripts

- Downloads the latest version of Caddy
- Use with concurrent or npm-run-all to run Caddy in parallel with your application, eg:

````
"scripts": {
    "caddy": "caddy run --config Caddyfile",
    "local-https": "node server.js",
    "dev": "run-p caddy local-https",
}
````

# example Caddyfile
```
dev.localhost {
    handle /api/* {
        reverse_proxy localhost:3000
    }
    handle {
        reverse_proxy localhost:4000
    }
}
```
