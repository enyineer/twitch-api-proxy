import { input } from '@inquirer/prompts';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';

interface Configuration {
  clientId: string;
  clientSecret: string;
}

export class Config {
  private path: string;

  constructor() {
    const folder = `${homedir()}/.config/twitch-proxy`;
    mkdirSync(folder, { recursive: true });
    this.path = `${folder}/config.json`;
  }

  async require(key: string, text?: string) {
    const value = await this.get(key);

    if (value === undefined) {
      const newValue = await input({
        message: text ?? `Please provide ${key}`,
        validate(value) {
          if (value.trim().length === 0) {
            return "Cannot be empty";
          }
          return true;
        },
      });
      await this.set(key, newValue);
      return newValue;
    }
    
    return value;
  }

  async get(key: string): Promise<string | undefined> {
    const config = await this.read();
    return config[key];
  }

  async set(key: string, value: string) {
    const config = await this.read();
    config[key] = value;
    await this.write(config);
  }

  async delete(key: string) {
    const config = await this.read();
    delete config[key];
    await this.write(config);
  }

  private async read(): Promise<Record<string, string | undefined>> {
    const file = Bun.file(this.path);

    if (await file.exists()) {
      const json = await file.json();
      return json;
    }

    return {};
  }

  private async write(config: Record<string, string | undefined>) {
    await Bun.write(this.path, JSON.stringify(config, null, 2));
  }
}
