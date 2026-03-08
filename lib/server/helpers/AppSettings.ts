import { ClientSettings } from '@/types'
import { keystoneContext } from '../keystone/context'

/**
 * The Singleton class defines an `instance` getter, that lets clients access
 * the unique singleton instance.
 */
export class AppSettings {
  static #instance: AppSettings
  private _settings: ClientSettings | null

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this._settings = null
  }

  /**
   * The static getter that controls access to the singleton instance.
   *
   * This implementation allows you to extend the Singleton class while
   * keeping just one instance of each subclass around.
   */
  public static get instance(): AppSettings {
    if (!AppSettings.#instance) {
      AppSettings.#instance = new AppSettings()
    }
    return AppSettings.#instance
  }

  private async _loadSettings() {
    // Load app settings from the database, it is also treated as a singleton
    // and will always have the id of "1".
    this._settings = (await keystoneContext.sudo().query.Settings.findOne({
      where: { id: '1' },
      query: `
        # Identity
        siteName
        baseUrl

        # SEO
        metaTitle
        metaDescription
        ogImage {
            id
            filesize
            width
            height
            extension
            url
        }
        robots

        # Access Control
        isPrivate
        allowSignup
        maintenanceMode
        maintenanceMessage

        # Analytics
        gaTrackingId

        # Social
        socialLinks

        # Branding
        theme {
            id
            name
            radius
            fontPrimary
            fontSecondary
            lightMode
            darkMode
        }
      `,
    })) as ClientSettings
  }

  /**
   * Finally, any singleton can define some business logic, which can be
   * executed on its instance.
   */
  public async settings() {
    if (!this._settings) {
      await this._loadSettings()
    }
    //serialize json object for client
    return JSON.parse(JSON.stringify(this._settings))
  }
}
