import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'
import * as Sentry from '@sentry/react'

function sendToAnalytics(metric: any) {
    // Logger dans Sentry
    Sentry.captureMessage(`Web Vital: ${metric.name}`, {
        level: 'info',
        tags: {
            metric: metric.name,
        },
        extra: {
            value: metric.value,
            rating: metric.rating,
        },
    })

    // Logger dans la console en dev
    if (import.meta.env.DEV) {
        console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating)
    }
}

export function reportWebVitals() {
    onCLS(sendToAnalytics)  // Cumulative Layout Shift
    onINP(sendToAnalytics)  // Interaction to Next Paint (replaces FID)
    onFCP(sendToAnalytics)  // First Contentful Paint
    onLCP(sendToAnalytics)  // Largest Contentful Paint
    onTTFB(sendToAnalytics) // Time to First Byte
}
