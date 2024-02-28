# twitch-proxy

A simple API Proxy for the Twitch Helix API.

It helps by handling the OAuth flow necessary to access the Twitch API. You can then call `http://localhost:6776/helix/<endpoint>` and access token renewal will be handled by this Proxy.

You can then send Requests to this Proxy, for example from your Elgato Stream Deck to call API functionality.

I'm using this Proxy for example to create Polls from my Elgato Stream Deck by using the [Weg Requests Plugin](https://apps.elgato.com/plugins/gg.datagram.web-requests) for my Stream Deck.

# Features

- Brings a webserver that handles the [Authorization code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow) with Twitch
- Proxies all requests to `http://localhost/helix/<endpoint>` to Twitch API making sure to refresh your access token if necessary

# Usage

Go to the [Releases](https://github.com/enyineer/twitch-api-proxy/releases) page and download the Binary for your architecture.

## Create an application

Go to the [Twitch Developer Console](https://dev.twitch.tv/console/apps) and create a new app.

- Chose a name
- Set OAuth Redirect URLs to `http://localhost:6776/oauth2/redirect`
- Chose Category `Broadcaster Suite`
- Chose Client Type `Private`

You will then get a client-id and a client-secret after clicking on `New Secret`. Those are necessary when starting the Proxy for the first time.

## Run it

Run

```bash
$ ./twitch-proxy
```

This will ask for your client-id and client-secret from your Twitch API Application and for your username.

After that, your Browser will open and forward you to Twitch's OAuth page. All Scopes are selected so you can call every API via this Proxy. This is secure because the Authorization Tokens that are being generated are only kept in your local twitch-api config.

If twitch Proxy shows `Logged in successfully!` everything is set up correctly!

## Send a Request

Have a look at the [Twitch API Reference](https://dev.twitch.tv/docs/api/reference/) for Endpoints you can use.

If the Endpoint is for example `PATCH https://api.twitch.tv/helix/channels`, send a PATCH Request to `http://localhost:6776/helix/channels` and the necessary Headers for Authorization will be added to your Request automatically.

Do not add any extra headers (eg. `Authorization` or `Client-Id`).

## Reset twitch-api

If you need to reset your config for twitch-api for any reason, go to your Users Home Directory and then `.config/twitch-api/`. There is a config.json file - if you delete it an then re-run twitch-api, it will ask for your Credentials like on first run.

If you have any other problems, please make sure to create an Issue including your `twitch-proxy.log` file.

# Developers

## Comitting

Make sure to follow the [Conventional Commits Format](https://www.conventionalcommits.org/en/v1.0.0/) when committing.

This Workspaces recommends installing [Conventional Commits Add-On for VS-Code](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits). After installation use CMD+Shift+P / Ctrl+Shift+P and run `Conventional Commits`. Normal commits will not be accepted.

## Install

Make sure you have [bun](https://bun.sh) installed on your machine.

To install dependencies:

```bash
$ bun install
```

## Run

To run the Proxy:

```bash
$ bun run start
```

## Build

To build a compiled binary:

```bash
$ bun run build
```

## Development

To run the Proxy with hot reload in development:

```bash
$ bun run dev
```

## Release

Create a new Git Tag and push it

```bash
$ git tag vX.X.X
$ git push origin vX.X.X
```

This will run the GitHub Action to create a new Release automatically.
