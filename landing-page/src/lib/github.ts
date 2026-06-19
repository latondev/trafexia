export interface RepoStats {
  stars: number;
  forks: number;
  version: string;
}

const GITHUB_HEADERS = {
  "User-Agent": "Trafexia-Landing/1.0",
  "Accept": "application/vnd.github.v3+json"
};

export async function getRepoStats(): Promise<RepoStats> {
  const defaults: RepoStats = { stars: 833, forks: 319, version: "v1.0.8" };

  try {
    const repoRes = await fetch("https://api.github.com/repos/danieldev23/trafexia", {
      headers: GITHUB_HEADERS,
      next: { revalidate: 3600 }
    });

    if (repoRes.ok) {
      const repoData = await repoRes.json();
      if (typeof repoData.stargazers_count === "number") {
        defaults.stars = repoData.stargazers_count;
      }
      if (typeof repoData.forks_count === "number") {
        defaults.forks = repoData.forks_count;
      }
    }

    // Try releases first, then fall back to tags
    const releaseRes = await fetch("https://api.github.com/repos/danieldev23/trafexia/releases/latest", {
      headers: GITHUB_HEADERS,
      next: { revalidate: 3600 }
    });

    if (releaseRes.ok) {
      const releaseData = await releaseRes.json();
      if (typeof releaseData.tag_name === "string") {
        defaults.version = releaseData.tag_name;
      }
    } else {
      // Fallback: fetch tags
      const tagsRes = await fetch("https://api.github.com/repos/danieldev23/trafexia/tags?per_page=1", {
        headers: GITHUB_HEADERS,
        next: { revalidate: 3600 }
      });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        if (Array.isArray(tagsData) && tagsData.length > 0 && typeof tagsData[0].name === "string") {
          defaults.version = tagsData[0].name;
        }
      }
    }

    return defaults;
  } catch {
    return defaults;
  }
}
