import { autoType, tsvParse } from 'd3-dsv';
import { map, orderBy, reduce } from 'lodash/fp';

import { dataDb } from 'api/dbs';

import { isWeb } from '../envTest';
import { COLORS, resourceTypeParents } from './constants';

const convertArrayToObject = reduce((acc, cur: any) => ({ ...acc, [cur.id]: cur }), {});

const setItemDataType = async (data, itemType) => {
  const parentGroup: any = await dataDb.getItem(resourceTypeParents[itemType]);
  const citiesGroup: any = itemType === 'machines' ? await dataDb.getItem('cities') : null;

  const mappedData = map((item: any) => {
    // this additional info is used later by the Globe
    if (itemType === 'cities') {
      item.originalName = item.name;
      item.name = item.state && item.state !== 'N/A' ? `${item.name}, ${item.state}` : item.name;
    }

    // rename "ip_address" with "name", so it can be used inside the search panel
    if (itemType === 'machines') {
      item.name = item.ip_address;
      item.utilization = item.utilization ? Number(item.utilization.toFixed(2)) : 0;
      delete item.ip_address;
    }

    if (itemType === 'regions') {
      item.plotType = item.type;
      item.color = COLORS[item.type] || COLORS.other;
    }

    if ((itemType === 'cities' || itemType === 'regions') && !isWeb) {
      item.utilization = Number(((item.utilization * 100) / item.capacity).toFixed(2)) || 0;
    }

    // this additional info is used later by the Globe
    item.type = itemType;

    // the "parentName" is used inside the search;
    // it is displayed only when the user types something
    if (parentGroup && item.parentId && parentGroup[item.parentId]) {
      item.parentName = parentGroup[item.parentId].name;

      // if the item is "machine", then grab the city too
      if (itemType === 'machines' && citiesGroup) {
        try {
          const cityId = parentGroup[item.parentId].parentId;
          const cityName = citiesGroup[cityId].name;
          item.parentName = `${cityName}, ${item.parentName}`;
        } catch (error) {
          console.log(error);
        }
      }
    }

    return item;
  })(data);

  return itemType === 'machines' || itemType === 'regions' ? mappedData : convertArrayToObject(mappedData);
};

const processTsvData = async (data, resourceType) => {
  const parsedData = tsvParse(data, autoType);
  const processedData = await setItemDataType(parsedData, resourceType);
  return dataDb.setItem(resourceType, processedData);
};

export const saveDataToDb = async (data: any) => {
  const [continents, countries, cities, regions, machines] = data;
  await processTsvData(continents, 'continents');
  await processTsvData(countries, 'countries');
  await processTsvData(cities, 'cities');
  if (isWeb) return;

  // the regions and machines are downloaded only by the NOCC version or Desktop app
  await processTsvData(regions, 'regions');
  return processTsvData(machines, 'machines');
};

/**
 * The search list must receive an array but some data is saved as an object
 * inside the db in order to improve performance
 * @param resourceType
 */
export const getObjResourceFromDb = async (resourceType) => {
  const data: any = await dataDb.getItem(resourceType);
  const list = Object.values(data);
  return orderBy(['name'], ['asc'])(list);
};

export const getData = () =>
  Promise.all(
    [
      getObjResourceFromDb('continents'),
      getObjResourceFromDb('countries'),
      getObjResourceFromDb('cities'),
      !isWeb && getObjResourceFromDb('regions'),
      !isWeb && dataDb.getItem('machines'),
    ].filter(Boolean)
  );
