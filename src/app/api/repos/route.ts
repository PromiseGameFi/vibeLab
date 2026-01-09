import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !(session as any).accessToken) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const accessToken = (session as any).accessToken;

        // Fetch user's repos from GitHub API
        const response = await fetch(
            "https://api.github.com/user/repos?sort=updated&per_page=50&type=all",
            {
                headers: {
                    Authorization: `token ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "VibeLab-Scanner/1.0",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = await response.json();

        // Return simplified repo data
        const simplifiedRepos = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            url: repo.html_url,
            private: repo.private,
            description: repo.description,
            language: repo.language,
            updatedAt: repo.updated_at,
            pushedAt: repo.pushed_at,
            stargazersCount: repo.stargazers_count,
        }));

        return NextResponse.json({ repos: simplifiedRepos });
    } catch (error) {
        console.error("Repos fetch error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch repos" },
            { status: 500 }
        );
    }
}
