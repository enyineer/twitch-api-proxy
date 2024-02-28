import { Config } from './config';
import { logger } from './logger';

export interface AuthorizationResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  scope?: string[];
}

export const withAuthGate = async (request: Request) => {
  const config = new Config();
  const clientId = await config.require('clientId');
  const clientSecret = await config.require('clientSecret');
  let accessToken = await config.get('accessToken');

  if (!accessToken) {
    throw new Error(`No access token acquired. Please re-run oauth flow.`);
  }

  const url = new URL(request.url);
  url.protocol = "https:";
  url.hostname = "api.twitch.tv";
  url.port = "443";
  
  const headers = new Headers();
  headers.set('Client-Id', clientId);
  headers.set('Authorization', `Bearer ${accessToken}`);

  const body = request.body;
  const method = request.method;

  const initialResponse = await fetch(url.toString(), {
    headers,
    method,
    body,
  });

  if (initialResponse.status === 401) {
    logger.info(`Access Token expired, trying to refresh...`);

    const refreshToken = await config.get('refreshToken');

    if (!refreshToken) {
      throw new Error(`No refresh token acquired. Please re-run oauth flow.`);
    }

    const refreshTokenBody = new URLSearchParams();
    refreshTokenBody.set('client_id', clientId);
    refreshTokenBody.set('client_secret', clientSecret);
    refreshTokenBody.set('grant_type', 'refresh_token');
    refreshTokenBody.set('refresh_token', refreshToken);

    const refreshResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: refreshTokenBody,
    });

    if (refreshResponse.status !== 200) {
      logger.error(`Could not refresh access token`);
      throw new Response(undefined, {
        status: 401,
        statusText: 'Could not refresh accessToken',
      });
    }

    const data = await refreshResponse.json() as AuthorizationResponse;

    await config.set('accessToken', data.access_token);
    await config.set('refresh_token', data.refresh_token);
    await config.set('token_type', data.token_type);
    if (data.scope) {
      await config.set('scope', data.scope.join(' '));
    } else {
      await config.delete('scope');
    }

    headers.set('Authorization', `Bearer ${data.access_token}`);
  
    const finalResponse = await fetch(url.toString(), {
      headers,
      method,
      body,
    });

    if (finalResponse.status === 401) {
      logger.error(`Received 401 after refreshing access token`);
      throw new Response(undefined, {
        status: 401,
        statusText: 'Could not access resource with refresh access token',
      });
    }

    const finalBody = await finalResponse.text();
    const corsAdjustedHeaders = finalResponse.headers;
    corsAdjustedHeaders.set('Access-Control-Allow-Origin', '*');
    logger.info(`Proxied ${url.toString()} after refreshing access token`);
    return new Response(finalBody, {
      headers: finalResponse.headers,
      status: finalResponse.status,
      statusText: finalResponse.statusText,
    });
  } else {
    const body = await initialResponse.text();
    const corsAdjustedHeaders = initialResponse.headers;
    corsAdjustedHeaders.set('Access-Control-Allow-Origin', '*');
    logger.info(`Proxied ${url.toString()}`);
    return new Response(body, {
      headers: corsAdjustedHeaders,
      status: initialResponse.status,
      statusText: initialResponse.statusText,
    });
  }
}