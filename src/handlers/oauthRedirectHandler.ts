import { port, redirectUri } from '..';
import type { AuthorizationResponse } from '../authGate';
import { Config } from '../config';
import { logger } from '../logger';
import type { UserData } from '../userdata';
import type { Handler } from './Handler';

export const handleOauthRedirectRequest: Handler = async (request: Request) => {
  const requestUrl = new URL(request.url);

  const error = requestUrl.searchParams.get('error');
  if (error) {
    const errorDescription = requestUrl.searchParams.get('error_description');
    throw new Response(undefined, {
      status: 400,
      statusText: `${errorDescription} (${error})`,
    });
  }

  const code = requestUrl.searchParams.get('code');
  if (!code) {
    throw new Response(undefined, {
      status: 400,
      statusText: 'code not provided',
    });
  }

  const config = new Config();
  const clientId = await config.require('clientId');
  const clientSecret = await config.require('clientSecret');

  const body = new URLSearchParams();
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  body.set('code', code);
  body.set('grant_type', 'authorization_code');
  body.set('redirect_uri', redirectUri);

  const tokens = await fetch("https://id.twitch.tv/oauth2/token", {
    method: 'POST',
    body: body,
  });

  if (tokens.status !== 200) {
    throw new Response(undefined, {
      status: 500,
      statusText: 'Could not get authorization tokens',
    });
  }

  const data = await tokens.json() as AuthorizationResponse;

  await config.set('accessToken', data.access_token);
  await config.set('refresh_token', data.refresh_token);
  await config.set('token_type', data.token_type);
  if (data.scope) {
    await config.set('scope', data.scope.join(' '));
  } else {
    await config.delete('scope');
  }

  logger.info(`Received authorization tokens from OAuth flow`);

  const username = await config.require('username');

  logger.info(`Trying to get user info for ${username}`);

  const response = await fetch(`http://127.0.0.1:${port}/helix/users?login=${username}`);

  if (response.status !== 200) {
    throw new Error(`Could not get user data for ${username}`);
  }

  const userdataBody = await response.text();

  try {
    const userdata = JSON.parse(userdataBody) as UserData;

    if (userdata.data.length !== 1) {
      throw new Error(`Received ambiguous User Data (${userdata.data.length})`);
    }
    
    await config.set('id', userdata.data[0].id);

    logger.info(`Found user ${username}, id: ${userdata.data[0].id} - Initialization completed!`);
  } catch (error) {
    throw new Error(`Could not get user data (${response.status}): ${body}`);
  }

  return new Response('Logged in successfully!', {
    status: 200,
  });
}