import { Settings, Page } from "@prisma/client";
import { keystoneContext } from "../keystone";

/**
 * The Singleton class defines an `instance` getter, that lets clients access
 * the unique singleton instance.
 */
export class AppSettings {
  static #instance: AppSettings;
  private _settings: Settings | null;
  private _pages: Page[] | null;

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this._settings = null;
    this._pages = null;
  }

  /**
   * The static getter that controls access to the singleton instance.
   *
   * This implementation allows you to extend the Singleton class while
   * keeping just one instance of each subclass around.
   */
  public static get instance(): AppSettings {
    if (!AppSettings.#instance) {
      AppSettings.#instance = new AppSettings();
    }
    return AppSettings.#instance;
  }

  private async _loadSettings() {
    // Load app settings from the database, it is also treated as a singleton
    // and will always have the id of "1".
    this._settings = (await keystoneContext.query.Settings.findOne({
      where: { id: "1" },
      query:
        "title description copyrightText isPrivate robots homePage { title slug } theme { colorPrimary colorPrimaryDark fontPrimary fontSecondary }",
    })) as Settings;
  }

  private async _loadPages() {
    // Load app settings from the database, it is also treated as a singleton
    // and will always have the id of "1".
    this._pages = (await keystoneContext.query.Page.findMany({
      where: { status: { equals: "public" } },
      query: "title description slug",
    })) as Page[];
  }

  /**
   * Finally, any singleton can define some business logic, which can be
   * executed on its instance.
   */
  public async settings() {
    if (!this._settings) {
      await this._loadSettings();
    }
    // marshall data to react app
    return JSON.parse(JSON.stringify(this._settings));
  }

  public async pages() {
    if (!this._pages) {
      await this._loadPages();
    }
    // marshall data to react app
    return JSON.parse(JSON.stringify(this._pages));
  }
}
