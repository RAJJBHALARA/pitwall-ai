import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Update this for production
  timeout: 60000, // Long timeout since AI processing or fastf1 might take a while
});

export const fetchSeasons = async () => {
  const response = await api.get('/api/seasons');
  return response.data;
};

export const fetchRaces = async (year) => {
  const response = await api.get(`/api/races?year=${year}`);
  return response.data;
};

export const fetchSessions = async (year, race) => {
  const response = await api.get(`/api/sessions?year=${year}&race=${race}`);
  return response.data;
};

export const fetchLapTimes = async (year, race, session) => {
  const response = await api.get(`/api/lap-times?year=${year}&race=${race}&session=${session}`);
  return response.data;
};

export const fetchTireStrategy = async (year, race) => {
  const response = await api.get(`/api/tire-strategy?year=${year}&race=${race}`);
  return response.data;
};

export const fetchRivalry = async (year, driver1, driver2) => {
  const response = await api.get(`/api/rivalry?year=${year}&driver1=${driver1}&driver2=${driver2}`);
  return response.data;
};

export const fetchFantasyPicks = async (year, race) => {
  const response = await api.post('/api/fantasy-picks', { year, race });
  return response.data;
};

export const fetchLapExplanation = async (year, race, driver, lap) => {
  const response = await api.post('/api/lap-explainer', { year, race, driver, lap });
  return response.data;
};

export const fetchPitWallAlert = async (circuit) => {
  const response = await api.get(`/api/pitwall-alert?circuit=${encodeURIComponent(circuit)}`);
  return response.data;
};

export const fetchCurrentForm = async () => {
  const response = await api.get('/api/current-form');
  return response.data;
};

export const fetchCareerStats = async (driverId) => {
  const response = await api.get(`/api/career?driver=${driverId}`, { timeout: 120000 });
  return response.data;
};

export const fetchCareerComparison = async (driver1Id, driver2Id) => {
  const response = await api.post('/api/career-compare', { driver1_id: driver1Id, driver2_id: driver2Id }, { timeout: 120000 });
  return response.data;
};

// Add interceptor to include API Key
api.interceptors.request.use(config => {
  config.headers['X-API-Key'] = 'fallback_dev_key'; // Default local dev key
  // We can let the environment override later
  return config;
});

export default api;
