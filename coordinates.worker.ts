export const getCoordinates = (item, data, exploreMode) => {
  const { type, parentId } = item;

  if (type === 'regions') {
    const { cities } = data;
    const city = cities.find((city) => city.id === parentId);
    return { ...item, lat: city.lat, lng: city.lng, exploreMode: 'chart' };
  }

  if (type === 'machines') {
    const { regions, cities } = data;
    const region = regions.find((region) => region.id === parentId);
    const city = cities.find((city) => city.id === region.parentId);
    return { ...region, lat: city.lat, lng: city.lng, exploreMode: 'chart' };
  }

  if (type === 'cities') return { ...item, exploreMode: 'map' };
  return { ...item, exploreMode };
};
