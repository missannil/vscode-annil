import path from "path";
import { getNearestJosnFilePath } from "./getNearestFilePath";
import { readFileByJsonc } from "./readFileByJsonc";

type TsconfigPath = string;

export type TsAliasPaths = Record<string, string[] | undefined>;

export type TsConfig = {
  compilerOptions?: {
    baseUrl?: string;
    paths?: TsAliasPaths;
  };
};

export type TsConfigInfo = {
  fsPath: string;
  config: TsConfig;
};
type TsconfigCache = Record<TsconfigPath, TsConfig | undefined>;

type AppConfigPath = string;

export type AppConfig = {
  resolveAlias?: Record<string, string>;
};

type AppConfigCache = Record<AppConfigPath, AppConfig | undefined>;

type ProjectConfigPath = string;

export type ProjectConfig = {
  miniprogramRoot: string;
};
type ProjectConfigCache = Record<ProjectConfigPath, ProjectConfig | null>;
/**
 * 小程序相关配置
 */
class MiniprogramConfig {
  #projectConfigCache: ProjectConfigCache = {};
  #tsConfigCache: TsconfigCache = {};
  #appConfigCache: AppConfigCache = {};
  private getNearestProjectConfigPath(fsPath: string): string | null {
    return getNearestJosnFilePath(fsPath, "project.config.json");
  }
  public getProjectConfig(fsPath: string): ProjectConfig {
    const projectConfigPath = this.getNearestProjectConfigPath(fsPath);
    if (projectConfigPath === null) {
      throw new Error(`未找到 project.config.json 文件`);
    }
    const projectConfigCache = this.#projectConfigCache[projectConfigPath];
    if (projectConfigCache) return projectConfigCache;

    const projectConfig = readFileByJsonc(projectConfigPath) as ProjectConfig | null;
    if (projectConfig === null) {
      throw new Error(`读取 project.config.json 失败`);
    }
    this.#projectConfigCache[projectConfigPath] = projectConfig;

    return projectConfig;
  }
  public getTsConfigInfo(fsPath: string): TsConfigInfo {
    const tsConfigPath = getNearestJosnFilePath(fsPath, "tsconfig.json");
    if (tsConfigPath === null) {
      throw new Error(`未找到 tsconfig.json 文件`);
    }
    const tsconfigCacheCache = this.#tsConfigCache[tsConfigPath];
    if (tsconfigCacheCache) {
      return {
        fsPath: tsConfigPath,
        config: tsconfigCacheCache,
      };
    }

    const tsConfig = readFileByJsonc(tsConfigPath) as TsConfig;
    if (tsConfig === null) {
      throw new Error(`读取 tsconfig.json 失败`);
    }
    this.#tsConfigCache[tsConfigPath] = tsConfig;

    return {
      fsPath: tsConfigPath,
      config: tsConfig,
    };
  }
  // 获取app.json的内容
  public getAppConfig(fsPath: string): AppConfig | null {
    const projectConfigPath = this.getNearestProjectConfigPath(fsPath);
    if (projectConfigPath === null) return null;
    const projectConfig = this.getProjectConfig(projectConfigPath);
    if (projectConfig === null) return null;
    const miniprogramRootPath = projectConfig.miniprogramRoot;
    const appConfigPath = path.resolve(projectConfigPath, miniprogramRootPath, "app.json");
    const appConfigCache = this.#appConfigCache[appConfigPath];
    if (appConfigCache) return appConfigCache;
    const appConfig = readFileByJsonc(appConfigPath) as AppConfig | null;
    if (appConfig === null) return null;
    this.#appConfigCache[appConfigPath] = appConfig;

    return appConfig;
  }

  public constructor() {}
}

export const miniprogramConfig = new MiniprogramConfig();
