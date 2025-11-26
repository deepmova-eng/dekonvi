import Plausible from 'plausible-tracker'

const plausible = Plausible({
    domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'dekonvi.com',
    trackLocalhost: import.meta.env.DEV, // Tracker aussi en dev pour tester
    apiHost: 'https://plausible.io',
})

export const { trackPageview, trackEvent } = plausible

// Helper pour tracker les conversions importantes
export const trackConversion = (goal: string, props?: Record<string, any>) => {
    trackEvent(goal, { props })
}

// Events personnalisés
export const analytics = {
    // Listings
    listingViewed: (listingId: string) => {
        trackEvent('Listing Viewed', { props: { listingId } })
    },

    listingCreated: () => {
        trackEvent('Listing Created')
    },

    // Favoris
    favoriteAdded: () => {
        trackEvent('Favorite Added')
    },

    favoriteRemoved: () => {
        trackEvent('Favorite Removed')
    },

    // Messages
    messageSent: () => {
        trackEvent('Message Sent')
    },

    conversationStarted: () => {
        trackEvent('Conversation Started')
    },

    // Auth
    signUp: () => {
        trackEvent('Sign Up')
    },

    signIn: () => {
        trackEvent('Sign In')
    },

    // Premium
    premiumRequested: () => {
        trackEvent('Premium Requested')
    },
}
