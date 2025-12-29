import { google } from 'googleapis'

export async function getGBPClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({ access_token: accessToken })

  return google.mybusinessbusinessinformation({
    version: 'v1',
    auth: oauth2Client
  })
}

export async function getGBPAccounts(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({ access_token: accessToken })

  // Use Account Management API
  const response = await fetch(
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GBP accounts')
  }

  return response.json()
}

export async function getGBPLocations(accessToken: string, accountId: string) {
  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GBP locations')
  }

  return response.json()
}

export async function createGBPPost(
  accessToken: string,
  locationName: string,
  content: string,
  callToAction?: { actionType: string; url: string }
) {
  const postData: any = {
    languageCode: 'de',
    summary: content,
    topicType: 'STANDARD'
  }

  if (callToAction) {
    postData.callToAction = callToAction
  }

  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to create post')
  }

  return response.json()
}

export async function replyToReview(
  accessToken: string,
  reviewName: string,
  comment: string
) {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to reply to review')
  }

  return response.json()
}
