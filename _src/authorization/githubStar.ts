import { vscode } from "#deps";

const GITHUB_AUTH_PROVIDER = "github";
const GITHUB_REPOSITORY = "missannil/annil";
const STAR_CHECK_INTERVAL = 24 * 60 * 60 * 1000;
const STAR_CHECKED_AT_KEY = "authorization.githubStar.checkedAt";
const STARRED_KEY = "authorization.githubStar.starred";
const STAR_ACCOUNT_ID_KEY = "authorization.githubStar.accountId";
const GITHUB_USER_API_URL = "https://api.github.com/user";
const GITHUB_STARRED_API_URL = "https://api.github.com/users";
const GITHUB_STAR_URL = `https://github.com/${GITHUB_REPOSITORY}`;

type GithubRepository = {
  full_name?: string;
};

type CachedStarStatus = {
  checkedAt: number;
  starred: boolean;
};

type StarCheckResult = "starred" | "not-starred" | "not-signed-in" | "unavailable";

/** 通过当前 GitHub 账号检查 Annil 仓库的 Star 状态。 */
export class GithubStarAuthorization {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  /** 启动后静默验证；没有 GitHub 登录时不弹出任何提示。 */
  public startDailyValidation(): vscode.Disposable {
    void this.refreshIfSignedIn();
    const timer = setInterval(() => void this.refreshIfSignedIn(), STAR_CHECK_INTERVAL);

    return new vscode.Disposable(() => clearInterval(timer));
  }

  /** 在 fix-all 执行前验证；只有此时才允许提示登录或 Star。 */
  public async ensureFixAllAccess(): Promise<boolean> {
    // Extension Host 测试不应依赖真实 GitHub 账号和网络。
    if (this.context.extensionMode === vscode.ExtensionMode.Test) return true;

    const result = await this.checkStar(false);
    if (result === "starred") return true;
    if (result === "unavailable") {
      void vscode.window.showWarningMessage("annil: 暂时无法验证 GitHub Star 状态，请联网后重试");

      return false;
    }

    const action = result === "not-signed-in"
      ? await vscode.window.showInformationMessage(
        "annil: 使用 fix-all 前，请先登录 GitHub 并 Star Annil 仓库",
        "登录 GitHub",
        "去 Star Annil",
      )
      : await vscode.window.showInformationMessage(
        "annil: 请 Star Annil GitHub 仓库后免费使用 fix-all",
        "去 Star Annil",
        "登录 GitHub",
      );

    if (action === "登录 GitHub") {
      const signedInResult = await this.checkStar(true);
      if (signedInResult === "starred") return true;
      if (signedInResult === "not-starred") {
        void vscode.window.showInformationMessage("annil: 当前 GitHub 账号还没有 Star Annil", "去 Star Annil")
          .then((selected) =>
            selected === "去 Star Annil"
              ? vscode.env.openExternal(vscode.Uri.parse(GITHUB_STAR_URL))
              : undefined
          );
      }
    } else if (action === "去 Star Annil") {
      await vscode.env.openExternal(vscode.Uri.parse(GITHUB_STAR_URL));
    }

    return false;
  }

  private async refreshIfSignedIn(): Promise<void> {
    await this.checkStar(false);
  }

  // eslint-disable-next-line complexity
  private async checkStar(createIfNone: boolean): Promise<StarCheckResult> {
    let session: vscode.AuthenticationSession | undefined;
    try {
      session = await vscode.authentication.getSession(
        GITHUB_AUTH_PROVIDER,
        ["read:user"],
        { createIfNone },
      );
    } catch {
      return "unavailable";
    }
    if (session === undefined) return "not-signed-in";

    const cached = this.getCachedStatus(session.account.id);
    if (!createIfNone && cached !== undefined && Date.now() - cached.checkedAt < STAR_CHECK_INTERVAL) {
      return cached.starred ? "starred" : "not-starred";
    }

    try {
      const userResponse = await fetch(GITHUB_USER_API_URL, {
        headers: this.getGithubHeaders(session.accessToken),
      });
      if (!userResponse.ok) return "unavailable";

      const user = await userResponse.json() as { login?: string };
      if (user.login === undefined) return "unavailable";

      const starred = await this.hasStarredRepository(user.login, session.accessToken);
      if (starred === undefined) return "unavailable";

      await this.context.globalState.update(STAR_CHECKED_AT_KEY, Date.now());
      await this.context.globalState.update(STARRED_KEY, starred);
      await this.context.globalState.update(STAR_ACCOUNT_ID_KEY, session.account.id);

      return starred ? "starred" : "not-starred";
    } catch {
      return "unavailable";
    }
  }

  private async hasStarredRepository(login: string, accessToken: string): Promise<boolean | undefined> {
    let url: string | undefined = `${GITHUB_STARRED_API_URL}/${encodeURIComponent(login)}/starred?per_page=100`;

    while (url !== undefined) {
      const response = await fetch(url, {
        headers: this.getGithubHeaders(accessToken),
      });
      if (!response.ok) return undefined;

      const repositories = await response.json() as GithubRepository[];
      if (repositories.some((repository) => repository.full_name?.toLowerCase() === GITHUB_REPOSITORY.toLowerCase())) {
        return true;
      }

      url = this.getNextPageUrl(response.headers.get("link"));
    }

    return false;
  }

  private getGithubHeaders(accessToken: string): Record<string, string> {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2026-03-10",
    };
  }

  private getNextPageUrl(linkHeader: string | null): string | undefined {
    const nextLink = linkHeader?.split(",").find((link) => link.includes("rel=\"next\""));

    return nextLink?.match(/<([^>]+)>/)?.[1];
  }

  private getCachedStatus(accountId: string): CachedStarStatus | undefined {
    const checkedAt = this.context.globalState.get<number>(STAR_CHECKED_AT_KEY);
    const starred = this.context.globalState.get<boolean>(STARRED_KEY);
    const cachedAccountId = this.context.globalState.get<string>(STAR_ACCOUNT_ID_KEY);
    if (checkedAt === undefined || starred === undefined || cachedAccountId !== accountId) return undefined;

    return { checkedAt, starred };
  }
}
