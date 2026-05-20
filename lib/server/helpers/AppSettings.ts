import { ClientSettings } from '@/types'
import { keystoneContext } from '../keystone/context'

export class AppSettings {
  static #instance: AppSettings
  private _settings: ClientSettings | null
  private _reloadPromise: Promise<void> | null = null
  private _lastReloadedAt: Date | null = null

  static readonly #SETTINGS_QUERY = `
    # Identity
    siteName
    baseUrl
    copyright

    # SEO
    metaTitle
    metaDescription
    ogImage {
      id
      source {
        publicUrl
      }
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
        fontHeading
        fontBody
        lightMode
        darkMode
    }

    # Root Content
    rootPageIndex {
      id
      slug
      basePath
      heroEnabled
    }
    rootCourse {
      id
      slug
      heroEnabled
    }
    transparentHeader

    # Web3
    allowWeb3Auth
    web3SignInMessage

    # Payments
    receiverWalletAddress
  `

  private constructor() {
    this._settings = null
  }

  public static get instance(): AppSettings {
    if (!AppSettings.#instance) {
      AppSettings.#instance = new AppSettings()
    }
    return AppSettings.#instance
  }

  // Reason: test-only escape hatch — private fields can only be reset from inside the class body
  static _resetForTest() {
    AppSettings.#instance = undefined as unknown as AppSettings
  }

  public get lastReloadedAt(): Date | null {
    return this._lastReloadedAt
  }

  private async _loadSettings() {
    this._settings = (await keystoneContext.query.Settings.findOne({
      where: { id: '1' },
      query: AppSettings.#SETTINGS_QUERY,
    })) as ClientSettings
  }

  public async reload(): Promise<void> {
    // Coalesce concurrent callers — return the in-flight promise if one exists
    if (this._reloadPromise) return this._reloadPromise

    this._reloadPromise = (async () => {
      // Fetch into a temp var first so _settings is never nulled on error
      const fresh = (await keystoneContext.query.Settings.findOne({
        where: { id: '1' },
        query: AppSettings.#SETTINGS_QUERY,
      })) as ClientSettings

      // Atomic swap — only update state after a successful fetch
      this._settings = fresh
      this._lastReloadedAt = new Date()
    })().finally(() => {
      this._reloadPromise = null
    })

    return this._reloadPromise
  }

  public async settings() {
    if (!this._settings) {
      await this._loadSettings()
    }
    return JSON.parse(JSON.stringify(this._settings))
  }
}
