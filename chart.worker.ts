import { compose, filter, map, orderBy } from 'lodash/fp';
import memoizee from 'memoizee';

import { dataDb } from 'api/dbs';

const orderList = orderBy(['plotType', 'utilizationValue'], ['asc', 'desc']);
const filterByParentId = (id) => filter((item: any) => item.parentId === id);
const addDefaultValues = map((el: any) => ({ ...el, plotType: el.plotType || 'other', capacity: el.capacity || 0 }));
const addUtilizationValue = map((el: any) => ({ ...el, utilizationValue: (el.utilization / 100) * el.capacity }));
const addColor = (color) => map((el: any) => ({ ...el, color }));
const addUtilizationAndOrder = compose(orderList, addDefaultValues, addUtilizationValue);
const filterAndOrder = (id) => compose(addUtilizationAndOrder, filterByParentId(id));

export const getRegionsOfCityId = memoizee(async (cityId) => {
  const regions: any = await dataDb.getItem('regions');
  return filterAndOrder(cityId)(regions);
});

export const getMachinesOfRegionId = memoizee(async (regionId, color) => {
  const machines: any = await dataDb.getItem('machines');
  const filteredMachines = filterAndOrder(regionId)(machines);
  return addColor(color)(filteredMachines);
});
