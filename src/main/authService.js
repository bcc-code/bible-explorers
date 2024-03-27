import { jwtDecode } from 'jwt-decode'
import url from 'url'
import keyService from './keyService.js'

const config = {
    auth0Domain: 'login.bcc.no',
    clientId: 'XGnvXPLlcqw22EU84VsQeZs3oO7VYl34',
    scope: 'openid profile offline_access',
}

const { auth0Domain, clientId, scope } = config
const redirectUri = 'http://localhost/callback'
const refreshKey = 'refresh-token'

let accessToken = null
let profile = null
let refreshToken = null

export const getAccessToken = () => {
    return accessToken
}

export const getProfile = () => {
    return profile
}

export const getAuthenticationURL = () => {
    return `https://${auth0Domain}/authorize?` + `scope=${scope}&` + 'response_type=code&' + `client_id=${clientId}&` + `redirect_uri=${redirectUri}`
}

export const refreshTokens = async () => {
    let refreshToken = await keyService.getToken(refreshKey)

    if (refreshToken) {
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: {
                grant_type: 'refresh_token',
                client_id: clientId,
                refresh_token: refreshToken,
            },
        }

        try {
            fetch(`https://${auth0Domain}/oauth/token`, options)
                .then((response) => response.json())
                .then(async (data) => {
                    accessToken = data.access_token
                    profile = jwtDecode(data.id_token)
                    refreshToken = data.refresh_token

                    if (refreshToken) {
                        await keyService.setToken(refreshKey, refreshToken)
                    }
                })
        } catch (error) {
            await logout()
            throw error
        }
    } else {
        throw new Error('No available refresh token.')
    }
}

export const loadTokens = async (callbackURL) => {
    const urlParts = url.parse(callbackURL, true)
    const query = urlParts.query

    const exchangeOptions = {
        grant_type: 'authorization_code',
        client_id: clientId,
        code: query.code,
        redirect_uri: redirectUri,
    }

    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(exchangeOptions),
    }

    try {
        fetch(`https://${auth0Domain}/oauth/token`, options)
            .then((response) => response.json())
            .then(async (data) => {
                accessToken = data.access_token
                profile = jwtDecode(data.id_token)
                refreshToken = data.refresh_token

                if (refreshToken) {
                    await keyService.setToken(refreshKey, refreshToken)
                }
            })
    } catch (error) {
        await logout()
        await fetch(getLogOutUrl(), options)
        throw error
    }
}

export const logout = async () => {
    await keyService.deleteToken(refreshKey)
    accessToken = null
    profile = null
    refreshToken = null
}

export const getLogOutUrl = () => {
    return `https://${auth0Domain}/v2/logout`
}
