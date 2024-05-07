const { execSync } = require('child_process')

module.exports = async function (configuration) {
    const filePath = configuration.path
    const directoryId = process.env.WINDOWS_DIRECTORY_ID
    const clientId = process.env.WINDOWS_CLIENT_ID
    const clientSecret = process.env.WINDOWS_CLIENT_SECRET

    try {
        execSync(
            `AzureSignTool sign -du "https://explorers.biblekids.io" -kvu "https://bccm-code-sign2.vault.azure.net" -kvt ${directoryId} -kvi ${clientId} -kvs ${clientSecret} -kvc "HSM-CS" -tr "http://timestamp.digicert.com" -v ${filePath}`,
            { stdio: 'inherit' }
        )
        console.log(`Successfully signed ${filePath}`)
    } catch (error) {
        console.error(`Failed to sign ${filePath}`)
        throw error
    }
}
