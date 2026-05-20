export const users = [
  {
    name: 'Admin',
    email: 'admin@example.com',
    recoveryPhrase: 'Password123!',
    isAdmin: true,
  },
  {
    name: 'Bob Dylan',
    email: 'bob@example.com',
    recoveryPhrase: 'Password123!',
  },
  // Membership status test accounts — one per status value
  {
    name: 'Active Member',
    email: 'active@example.com',
    recoveryPhrase: 'Password123!',
  },
  {
    name: 'Pending Member',
    email: 'pending@example.com',
    recoveryPhrase: 'Password123!',
  },
  {
    name: 'Expired Member',
    email: 'expired@example.com',
    recoveryPhrase: 'Password123!',
  },
  {
    name: 'Failed Member',
    email: 'failed@example.com',
    recoveryPhrase: 'Password123!',
  },
  {
    name: 'Blocked Member',
    email: 'blocked@example.com',
    recoveryPhrase: 'Password123!',
  },
]

// userEmail links each profile to its user after the User.afterOperation hook
// has already auto-created a bare profile. seedProfiles() updates that profile
// in-place rather than creating a second one.
export const profiles = [
  {
    userEmail: 'admin@example.com',
    nickname: 'Admin',
    description: 'Sysop',
    location: 'Planet Earth',
    image: {
      title: 'Admin',
      source: './seed-data/assets/avatar-admin.png',
      altText: 'admin profile image',
    },
  },
  {
    userEmail: 'bob@example.com',
    nickname: 'Bobby',
    description: 'builder of things',
    location: 'Canada',
    image: {
      title: 'Bobby',
      source: './seed-data/assets/avatar-user.jpg',
      altText: 'user profile image',
    },
  },
]

export const membershipTiers = [
  {
    name: 'Member',
    description: 'Free access to community content.',
    priceInCents: 0,
    paymentType: 'free' as const,
    isActive: true,
    contentAccessPatterns: ['/courses/**'],
  },
  {
    name: 'Pro',
    description: 'One-time purchase — lifetime access to all courses.',
    priceInCents: 9900,
    paymentType: 'one_time' as const,
    isActive: true,
    contentAccessPatterns: ['/courses/**', '/pages/**'],
  },
  {
    name: 'Premium',
    description: 'Monthly subscription — full access plus premium content.',
    priceInCents: 1999,
    paymentType: 'subscription' as const,
    recurringInterval: 'month' as const,
    isActive: true,
    contentAccessPatterns: ['/**'],
  },
]

export const settings = [
  {
    siteName: 'hyperlocal',
    baseUrl: 'http://localhost:7777',
    metaTitle: 'hyperlocal — run your own private club',
    metaDescription:
      'Deploy, brand, and monetize a private online community on your own domain. No algorithms, no platform cut.',
    copyright: '- built with hyperlocal -',
    isPrivate: false,
    allowSignup: true,
    theme: {
      create: {
        name: 'Default',
        fontHeading: "'Lobster', serif",
        fontBody: "'Open Sans', sans-serif",
      },
    },
  },
]
