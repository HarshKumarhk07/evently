import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// Simple reverse geocode using Nominatim (OpenStreetMap). No API key required.
export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) throw ApiError.badRequest('lat and lng required');
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'evently/1.0 (+https://example.com)' } });
  if (!r.ok) throw new Error('Reverse geocode failed');
  const data = await r.json();
  res.json({ success: true, data });
});
