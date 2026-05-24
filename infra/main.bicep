@description('Name of the Static Web App')
param appName string = 't20-intelligence-console'

@description('Azure region for the resource')
param location string = 'eastasia'

@description('SKU tier for the Static Web App')
@allowed(['Free', 'Standard'])
param sku string = 'Free'

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: appName
  location: location
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    buildProperties: {
      appLocation: 'webapp'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
