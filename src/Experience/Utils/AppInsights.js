import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const appInsights = new ApplicationInsights({config: {
    connectionString: 'InstrumentationKey=04aece4e-1193-4fb5-933f-e8335d05f926;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/'
} })

export default appInsights