import open from 'open';
import { Config } from './config';
import { handleOauthRedirectRequest } from './handlers/oauthRedirectHandler';
import { handleHelixRequest } from './handlers/helixHandler';
import { scopes } from './scopes';
import { logger } from './logger';

export const port = 6776;

export const redirectUri = `http://localhost:${port}/oauth2/redirect`;

logger.info(`Starting Twitch Proxy, make sure your applications OAuth Redirect URL is set to ${redirectUri}`);

const config = new Config();

const clientId = await config.require('clientId');
await config.require('clientSecret');
await config.require('username');

const url = new URL('https://id.twitch.tv/oauth2/authorize');
url.searchParams.set('client_id', clientId);
url.searchParams.set('redirect_uri', redirectUri);
url.searchParams.set('response_type', 'code');
url.searchParams.set('scope', scopes);

await open(url.toString());

Bun.serve({
  port: 6776,
  fetch(req) {
    const requestUrl = new URL(req.url);
    if (requestUrl.pathname.startsWith('/helix')) return handleHelixRequest(req);
    if (requestUrl.pathname === '/oauth2/redirect') return handleOauthRedirectRequest(req);

    // Default 404
    throw new Response(undefined, {
      status: 404,
      statusText: 'Not found',
    });
  },
  error(error) {
    if (error instanceof Response) {
      return new Response(`${error.status} ${error.statusText}`, {
        status: error.status,
        statusText: error.statusText,
      });
    }
    logger.error(error.message);
    return new Response(`${error.message}`);
  },
});

logger.info(`Twitch Proxy started successfully, listening on http://127.0.0.1:${port}`);