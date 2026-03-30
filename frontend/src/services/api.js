import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 120000, 
  headers: {
    "X-API-Key": import.meta.env.VITE_API_KEY || "fallback_dev_key",
    "Content-Type": "application/json"
  }
})

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    if (status === 429) throw new Error("RATE_LIMIT")
    if (status === 403) throw new Error("AUTH_ERROR")
    if (status === 404) throw new Error("NO_DATA")
    throw new Error(err.response?.data?.detail || "SERVER_ERROR")
  }
)

export const getAvailableRaces = (year) => 
  api.get(`/api/races?year=${year}`)

export const getDrivers = (year) =>
  api.get(`/api/drivers?year=${year}`)

export const getLapTimes = (year, race, session) =>
  api.get(`/api/lap-times?year=${year}&race=${race}&session=${session}`)

export const getTireStrategy = (year, race) =>
  api.get(`/api/tire-strategy?year=${year}&race=${race}`)

export const getRivalryStats = (year, d1, d2) =>
  api.get(`/api/rivalry?year=${year}&driver1=${d1}&driver2=${d2}`)

export const getTelemetry = (year, race, driver, lap) =>
  api.get(`/api/telemetry?year=${year}&race=${race}&driver=${driver}&lap=${lap}`)

export const getFantasyPicks = (race, year) =>
  api.post('/api/fantasy-picks', { race, year })
