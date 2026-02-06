import type { GithubRepoResponse } from "./types/repo.ts";
import type { GithubRepoSearchResponse } from "./types/search.ts";

export class GithubSearchRequest {
  url: string;

  constructor(
    query: string,
    type: 'repositories' | 'users' | 'issues' | 'languages'
  ) {
    const q = encodeURIComponent(query);
    this.url = `https://api.github.com/search/${type}?q=${q}`;
  }

  async fetch(): Promise<any> {
    const res = await fetch(this.url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }


    return res.json() as Promise<GithubRepoSearchResponse>;
  }
}

export class GithubRepoRequest {
    url: string;

    constructor(
      user: string,
      repo: string
    ) {
      this.url = `https://api.github.com/repos/${user}/${repo}`;
    };

    async fetch(): Promise<GithubRepoResponse> {
      const res = await fetch(this.url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }

      return res.json() as Promise<GithubRepoResponse>;
    }

}

export class GithubLanguagesRequest {
    url: string;

    constructor(
      user: string,
      repo: string
    ) {
      this.url = `https://api.github.com/repos/${user}/${repo}/languages`;
    };

    async fetch(): Promise<Record<string, number>> {
      const res = await fetch(this.url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }

      return res.json() as Promise<Record<string, number>>;
    }

}