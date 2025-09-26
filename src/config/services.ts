// Service discovery configuration for multi-app architecture
export const serviceUrls = {
  development: {
    autoMovie: 'http://localhost:3010',
    taskService: 'http://localhost:8001',
    brainService: 'http://localhost:8002',
    agentsService: 'http://localhost:8003',
    neo4j: 'http://localhost:7474',
    redis: 'http://localhost:6379',
    mongodb: 'http://localhost:27017',
    // MCP Domain Services (Future Phase 4)
    storyMcp: 'http://localhost:8010',
    charactersMcp: 'http://localhost:8011',
    visualsMcp: 'http://localhost:8012',
    audioMcp: 'http://localhost:8013',
    assetsMcp: 'http://localhost:8014',
    // Monitoring
    prometheus: 'http://localhost:9090',
    grafana: 'http://localhost:3001',
    healthApi: 'http://localhost:8100',
  },
  staging: {
    autoMovie: 'https://auto-movie.ngrok.pro',
    taskService: 'https://tasks.ngrok.pro',
    brainService: 'https://brain.ngrok.pro',
    agentsService: 'https://agents.ngrok.pro',
    neo4j: 'https://neo4j.ngrok.pro',
    // MCP Domain Services
    storyMcp: 'https://story.ngrok.pro',
    charactersMcp: 'https://characters.ngrok.pro',
    visualsMcp: 'https://visuals.ngrok.pro',
    audioMcp: 'https://audio.ngrok.pro',
    assetsMcp: 'https://assets.ngrok.pro',
    // Monitoring
    prometheus: 'https://metrics.ngrok.pro',
    grafana: 'https://dashboard.ngrok.pro',
    healthApi: 'https://health.ngrok.pro',
  },
  production: {
    autoMovie: 'https://auto-movie.ft.tc',
    taskService: 'https://tasks.ft.tc',
    brainService: 'https://brain.ft.tc',
    agentsService: 'https://agents.ft.tc',
    neo4j: 'https://neo4j.ft.tc',
    // MCP Domain Services
    storyMcp: 'https://story.ft.tc',
    charactersMcp: 'https://characters.ft.tc',
    visualsMcp: 'https://visuals.ft.tc',
    audioMcp: 'https://audio.ft.tc',
    assetsMcp: 'https://assets.ft.tc',
    // Monitoring
    prometheus: 'https://metrics.ft.tc',
    grafana: 'https://dash-board.ft.tc',
    healthApi: 'https://health.ft.tc',
  },
}

export const getServiceUrl = (service: keyof typeof serviceUrls.development) => {
  const env = (process.env.NODE_ENV as keyof typeof serviceUrls) || 'development'
  const envConfig = serviceUrls[env] || serviceUrls.development
  return (envConfig as any)[service] || serviceUrls.development[service]
}

export const getCurrentEnvironment = () => {
  if (process.env.NODE_ENV === 'production') return 'production'
  if (process.env.VERCEL_ENV === 'preview') return 'staging'
  return 'development'
}

// Media CDN URLs
export const mediaCdnUrls = {
  development: 'http://localhost:3010/media',
  staging: 'https://media-dev.ft.tc',
  production: 'https://media.ft.tc',
}

export const getMediaCdnUrl = () => {
  const env = getCurrentEnvironment()
  return mediaCdnUrls[env]
}
