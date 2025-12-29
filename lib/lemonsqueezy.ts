const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!
const LEMONSQUEEZY_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID! // 5€/month plan

export async function createCheckoutUrl(email: string, userId: string) {
  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: {
              user_id: userId
            }
          },
          product_options: {
            redirect_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`
          }
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: LEMONSQUEEZY_STORE_ID
            }
          },
          variant: {
            data: {
              type: 'variants',
              id: LEMONSQUEEZY_VARIANT_ID
            }
          }
        }
      }
    })
  })

  const data = await response.json()
  return data.data?.attributes?.url
}

export async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  const crypto = await import('crypto')
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const digest = hmac.digest('hex')

  return signature === digest
}

export async function getSubscription(subscriptionId: string) {
  const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
      'Accept': 'application/vnd.api+json'
    }
  })

  return response.json()
}
