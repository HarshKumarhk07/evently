import City from '../models/City.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const listCities = asyncHandler(async (req, res) => {
  const { popular, q, limit = 100 } = req.query;
  const filter = {};
  if (popular === 'true') filter.isPopular = true;
  if (q) filter.cityName = { $regex: q, $options: 'i' };
  const cities = await City.find(filter)
    .sort({ displayOrder: 1, cityName: 1 })
    .limit(Number(limit));
  res.json({ success: true, items: cities });
});

export const getCity = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id);
  if (!city) throw ApiError.notFound('City not found');
  res.json({ success: true, data: city });
});

export const createCity = asyncHandler(async (req, res) => {
  const body = req.body;
  const city = await City.create({
    cityName: body.cityName,
    state: body.state,
    country: body.country,
    image: body.image,
    isPopular: Boolean(body.isPopular),
    location: { type: 'Point', coordinates: [Number(body.lng) || 0, Number(body.lat) || 0] },
    displayOrder: Number(body.displayOrder) || 0,
  });
  res.status(201).json({ success: true, data: city });
});

export const updateCity = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id);
  if (!city) throw ApiError.notFound('City not found');
  const body = req.body;
  city.cityName = body.cityName ?? city.cityName;
  city.state = body.state ?? city.state;
  city.country = body.country ?? city.country;
  city.image = body.image ?? city.image;
  city.isPopular = body.isPopular !== undefined ? Boolean(body.isPopular) : city.isPopular;
  if (body.lat !== undefined && body.lng !== undefined) {
    city.location = { type: 'Point', coordinates: [Number(body.lng) || 0, Number(body.lat) || 0] };
  }
  city.displayOrder = body.displayOrder ?? city.displayOrder;
  await city.save();
  res.json({ success: true, data: city });
});

export const deleteCity = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id);
  if (!city) throw ApiError.notFound('City not found');
  await city.remove();
  res.json({ success: true });
});

export const nearestCity = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 50000 } = req.query; // meters
  if (!lat || !lng) throw ApiError.badRequest('lat and lng are required');
  const point = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
  const cities = await City.find({
    location: {
      $near: { $geometry: point, $maxDistance: Number(maxDistance) },
    },
  }).limit(1);
  if (!cities.length) return res.json({ success: true, data: null });
  res.json({ success: true, data: cities[0] });
});
