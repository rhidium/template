<div align="center">
  <a href="https://rhidium.xyz"><img src="https://github.com/rhidium/core/assets/57721238/e6d25fa1-07cb-4284-a02a-f73fe7ef3878" width="100" alt="logo" /></a>

  ![Font_PNG](https://github.com/rhidium/core/assets/57721238/9ccc5763-8336-4d1e-8187-a738bafdc519)

  <p>
    <a href="https://discord.gg/mirasaki"><img src="https://img.shields.io/discord/793894728847720468?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/@rhidium/core"><img src="https://img.shields.io/npm/v/@rhidium/core.svg?maxAge=3600" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/@rhidium/core"><img src="https://img.shields.io/npm/dt/@rhidium/core.svg?maxAge=3600" alt="npm downloads" /></a>
  </p>
</div>

# @rhidium/template

This is a Discord bot template that fully utilizes the [rhidium framework](https://rhidium.xyz). From essential system related commands to detailed command usage/statistics and integrated re-usable embed and placeholder functionality - this template aims to provide everything you need to develop powerful, scalable Discord bots fast and efficiently.

> With Rhidium, you can focus on what's really important: **Creating meaningful features**

Excited to begin? [Get started!](#installation)

## Features (non-exhaustive)

We've compromised a list a list of

- Powerful, dynamic [middleware](https://rhidium.xyz/classes/Middleware.CommandMiddleware.html) system
- Type-safe, re-usable [controllers](https://rhidium.xyz/modules/Commands.Controllers.html)
- Dynamic [Component](https://rhidium.xyz/modules/Commands.html) Handlers/File-Loaders
- Synchronized local & API commands, automatic refreshes
- Fully localized, convenience localization for commands
- Colorful console logging & verbose, organized file logging
- Wide range of everyday utilities
- CRON and interval jobs

### Developer Friendly

This template focuses on simplicity and robustness for developers. The primary example of this is that components are resolved from directories, not extended from a class and imported elsewhere - as commonly seen across other templates. It's our mission to get you started on your project fast, so you can focus on the important things: implementing meaningful features.

- Check out the [API Reference](https://rhidium.xyz/)
- Made with [TypeScript](https://www.typescriptlang.org/) and [discord.js](https://discord.js.org/)
- [PM2](https://pm2.io/), [Docker](https://www.docker.com/), [docker compose](https://docs.docker.com/compose/) configurations provided

### Functionality

- Detailed command usage statistics and metrics
- User configurable embed utilities, easily extendable to new functionality
- Dynamic placeholder structure, easily extendable to new data
- Discord logging for errors, guild join/leave etc.
- Administrator and Moderator permission level roles and channels
- Member Join messages, uses both Embed and Placeholder functionality as a complete integration
- Developer utility commands
- User information commands

### Scaling

This template grows with you and your bot. Opt-in to sharding & clustering (`x` shards for `n` processes) as you reach new milestones, all functionality included is sharding + clustering friendly by design.

- Supports [sharding](https://discordjs.guide/sharding), which is required when your bot reaches 2500+ servers
- Supports [clustering](https://www.npmjs.com/package/discord-hybrid-sharding), which allows you to seamlessly run your bot over multiple processes

## Database

This TypeScript project uses [Prisma](https://www.prisma.io/docs/getting-started/quickstart) TypeORM with `postgresql` adapter.

Available adapters: `cockroachdb`, `mongodb`, `postgresql`

- If you make changes to the schema, use the `prisma db push` command to push the new schema state to the database.
- If you want to use an existing database (pull the schema from existing database), use the `prisma db pull` command.
- Use `prisma migrate dev` to create migrations, apply them to the database, and generate artifacts (e.g. Prisma Client)
- When using CockroachDB, the `autoincrement()` default function is defined only on BigInt fields. Change `autoincrement()` to `sequence()` if you want an autoincrementing Int field.

### Mongo

The MongoDB adapter can chosen to minimize required setup for this project. Converting to Mongo adapters should (mostly) only include adding `_id` `@map`'ing and adding `@db.ObjectId` for `@id`'s (an up-to-date [mongo schema file](./prisma/schema.mongo.prisma) is included for your convenience). Do note, Prisma migrations aren't supported for the MongoDB adapter.

## Configuration

The full configuration for this project can be found [here](./config.example.json).

- `pnpm config-editor` - starts the configuration editor, edit [the script](./scripts/config-editor.mjs) if needed
- `pnpm update-schema` - generate a new JSON Schema, `config-editor` automatically does this
- `pnpm generate-schema` - CLI alternative to `update-schema`, included for completeness

The `.env` file is not required, but overwrites by developers in these files are still respected. For example, you can run the production build with sharding and clustering in development mode by setting `NODE_ENV` in `.env`

## Installation

Are you familiar with Docker? If so, you can use the `docker-compose.yml` or `Dockerfile` to get started quickly. Otherwise, follow the steps below.

### Pre-requisites

- A [Discord Application](https://wiki.mirasaki.dev/docs/discord-create-application#go-to-discord-developer-portal)
- [Node.js](https://nodejs.org/en/) v16.6.0 or newer
- [MongoDB](https://www.mongodb.com/) v4.4 or newer

### Setup Instructions

- Download the [latest release](<https://github.com/rhidium/template/releases`>) or `git clone git@github.com:rhidium/template.git` the repo
- Run `pnpm setup:linux` or `pnpm setup:windows` in the newly created folder
- Edit the newly created `config.json` file and provide your configuration
  - Alternatively, use `pnpm setup:config` if you prefer a web-based editor
  - Hit `ctrl+c` to stop the application once you've clicked "Save"
- Start the application: `pnpm start`

## Scripts

Here's some example scripts to get you started with your favorite runtime:

> Please note, you should run these from the **directory root**

### [PM2](https://pm2.io/)

```bash
pm2 start
pm2 stop
pm2 restart
pm2 reset
pm2 delete
```

### [Docker](https://www.docker.com/)

```bash
# Build
docker build --tag rhidium-template .
# Start
docker run -it -p 3000:3000 --env-file ./.env -d --name my-discord-bot rhidium-template
# Logs
docker logs my-discord-bot -f
# Stop
docker stop my-discord-bot
# Restart
docker restart my-discord-bot
# Kill
docker rm -f my-discord-bot
# Purge
docker rm -fv my-discord-bot
# Shell
docker run -it --rm my-discord-bot sh
```

> Forever Free, open-source, and ISC licensed, meaning you're in full control
