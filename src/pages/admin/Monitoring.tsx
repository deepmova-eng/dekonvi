import { useState, useEffect } from 'react'
import { Activity, AlertCircle, Users, Zap } from 'lucide-react'

export default function MonitoringDashboard() {
    const [stats, setStats] = useState({
        activeUsers: 0,
        errorRate: 0,
        avgResponseTime: 0,
        totalEvents: 0,
    })

    useEffect(() => {
        // Simulation de données pour l'instant
        // Idéalement, fetcher depuis une API qui agrège Sentry/Plausible
        setStats({
            activeUsers: Math.floor(Math.random() * 50) + 10,
            errorRate: Math.random() * 2,
            avgResponseTime: Math.floor(Math.random() * 200) + 100,
            totalEvents: Math.floor(Math.random() * 1000) + 500,
        })

        const interval = setInterval(() => {
            setStats(prev => ({
                activeUsers: Math.floor(Math.random() * 50) + 10,
                errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5)),
                avgResponseTime: Math.floor(Math.random() * 200) + 100,
                totalEvents: prev.totalEvents + Math.floor(Math.random() * 10),
            }))
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Dashboard de Monitoring</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Temps réel</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Utilisateurs actifs</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeUsers}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <AlertCircle size={24} />
                        </div>
                        <span className="text-sm text-gray-500 font-medium">24h</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Taux d'erreur</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.errorRate.toFixed(2)}%</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                            <Zap size={24} />
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Moyenne</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Temps de réponse</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgResponseTime}ms</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Total</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Évènements</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-900">Erreurs récentes (Sentry)</h2>
                    <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">
                            Iframe Sentry (nécessite configuration URL publique)
                        </p>
                        {/* 
            <iframe 
              src="https://sentry.io/organizations/your-org/issues/?project=your-project"
              className="w-full h-full rounded-lg"
              frameBorder="0"
            /> 
            */}
                    </div>
                </section>

                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-900">Analytics (Plausible)</h2>
                    <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">
                            Iframe Plausible (nécessite lien de partage public)
                        </p>
                        {/*
            <iframe
              src="https://plausible.io/share/dekonvi.com?auth=your-token&embed=true&theme=light"
              className="w-full h-full rounded-lg"
              frameBorder="0"
            />
            */}
                    </div>
                </section>
            </div>
        </div>
    )
}
