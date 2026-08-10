# darq-fe

Frontend for akkoma

WIP

## Deploying on the Darqoma server

Build and deploy the frontend with:

```sh
./scripts/deploy.sh
```

`pnpm run deploy` is available as a convenience alias.

The deployment script synchronizes `dist/` to
`/opt/akkoma/instance/static/frontends/darq-fe/main`, which is the static
directory currently configured by Darqoma. Set `DARQ_FE_DEPLOY_DIR` to override
that path after migrating the instance data directory. It loads NVM from
`/root/.nvm` and uses the newest installed LTS release, so installing a newer
LTS does not require editing the script. Set `DARQ_FE_NVM_DIR` if NVM moves.
