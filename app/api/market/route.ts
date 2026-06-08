import { NextResponse } from "next/server"

type TwelveDataResponse = {
  status?: string
  values?: Array<{ close: string }>
  message?: string
  code?: string
}

type MarketPricesResponse = {
  gold: { price: number }
  silver: { price: number }
  error?: string
}

const API_URL = "https://api.twelvedata.com/time_series"

// Fetches a latest close price for the given symbol from TwelveData.
// Uses `no-store` caching so each request gets fresh market data.
async function fetchPriceFromTwelveData(symbol: string, key: string): Promise<number> {
  const url = new URL(API_URL)
  url.searchParams.set("symbol", symbol)
  url.searchParams.set("interval", "1min")
  url.searchParams.set("outputsize", "1")
  url.searchParams.set("format", "JSON")
  url.searchParams.set("apikey", key)

  const response = await fetch(url.toString(), { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`TwelveData request failed for ${symbol}`)
  }

  const json = (await response.json()) as TwelveDataResponse
  if (json.status === "error") {
    throw new Error(json.message || json.code || "TwelveData error")
  }

  const priceString = json.values?.[0]?.close
  if (!priceString) {
    throw new Error(`Invalid TwelveData response for ${symbol}`)
  }

  const price = Number(priceString)
  if (Number.isNaN(price)) {
    throw new Error(`Invalid price value for ${symbol}`)
  }

  return price
}

export async function GET() {
  const twelveDataKey = process.env.TWELVEDATA_KEY
  if (!twelveDataKey) {
    return NextResponse.json(
      { error: "Market data temporarily unavailable" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }

  try {
    const [goldPrice, silverPrice] = await Promise.all([
      fetchPriceFromTwelveData("XAU/USD", twelveDataKey),
      fetchPriceFromTwelveData("XAG/USD", twelveDataKey),
    ])

    const payload: MarketPricesResponse = {
      gold: { price: goldPrice },
      silver: { price: silverPrice },
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Market API error:", error)
    return NextResponse.json(
      { error: "Market data temporarily unavailable" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}
