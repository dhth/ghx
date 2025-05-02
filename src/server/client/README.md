# changes front-end

Local Development
---

Prerequisites

- gleam

```sh
# start local development server
# from project root
cargo run  --serve

cd src/server/_client
# replace dev = True in src/effects.gleam
gleam run -m lustre/dev start
```

Before committing code
---

```sh
# ensure local changes in src/effects.gleam are reverted
cd client

# compile app to js code
gleam run -m lustre/dev build app
```
