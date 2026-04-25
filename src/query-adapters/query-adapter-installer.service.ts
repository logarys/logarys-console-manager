import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { QueryAdapterMetadata } from "@logarys/query-adapter-contracts";
import { QueryAdapterLoaderService } from "./query-adapter-loader.service.js";

const execFileAsync = promisify(execFile);

export interface InstalledQueryAdapter {
  installId: string;
  path: string;
  metadata: QueryAdapterMetadata;
}

@Injectable()
export class QueryAdapterInstallerService {
  constructor(
    private readonly config: ConfigService,
    private readonly loader: QueryAdapterLoaderService,
  ) {}

  async installFromGit(gitUrl: string, branch = "main"): Promise<InstalledQueryAdapter> {
    this.assertAllowedGitUrl(gitUrl);

    const pluginsDir = this.config.get<string>("QUERY_ADAPTERS_DIR") ?? "/var/lib/logarys/query-adapters";
    const installId = randomUUID();
    const targetDir = path.join(pluginsDir, installId);

    await mkdir(targetDir, { recursive: true });

    await execFileAsync("git", ["clone", "--depth", "1", "--branch", branch, gitUrl, targetDir], {
      timeout: 60_000,
    });

    await execFileAsync("npm", ["ci", "--omit=dev"], {
      cwd: targetDir,
      timeout: 120_000,
    });

    await execFileAsync("npm", ["run", "build"], {
      cwd: targetDir,
      timeout: 120_000,
    });

    await this.assertPackageLooksLikeAdapter(targetDir);

    const metadata = await this.loader.loadFromLocalPath(targetDir);

    return {
      installId,
      path: targetDir,
      metadata,
    };
  }

  private assertAllowedGitUrl(gitUrl: string): void {
    const configured = this.config.get<string>("QUERY_ADAPTER_ALLOWED_GIT_PREFIXES") ?? "https://github.com/logarys/";
    const allowedPrefixes = configured.split(",").map((value) => value.trim()).filter(Boolean);

    if (!allowedPrefixes.some((prefix) => gitUrl.startsWith(prefix))) {
      throw new Error(`Git URL is not allowed: ${gitUrl}`);
    }

    if (gitUrl.includes("..") || gitUrl.includes(";") || gitUrl.includes("&") || gitUrl.includes("|")) {
      throw new Error(`Unsafe Git URL: ${gitUrl}`);
    }
  }

  private async assertPackageLooksLikeAdapter(packagePath: string): Promise<void> {
    const packageJsonPath = path.join(packagePath, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { main?: string; type?: string };

    if (!packageJson.main && packageJson.type !== "module") {
      throw new Error("Adapter package must expose a module entrypoint");
    }
  }
}
