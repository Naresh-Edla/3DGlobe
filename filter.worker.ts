import { toLower } from 'lodash';
import memoizee from 'memoizee';

import { dataDb } from 'api/dbs';

import { viewSettings } from './constants';

export const filter = (data, input) => {
  if (!input.length) return data;
  return data.filter(({ name }) => toLower(name).includes(toLower(input)));
};

export const filterAll = (data, input, view) => {
  const viewConditions = viewSettings[view];
  const items = Object.entries(data).reduce((acc: any, [key, val]: any) => {
    if (viewConditions[key]) return [...acc, ...val];
    return acc;
  }, []);

  return filter(items, input);
};

export const filterByParentId = memoizee(async (nextView: string, parentId: string) => {
  const list: any = await dataDb.getItem(nextView);

  // the "regions" and "machines" are arrays
  if (Array.isArray(list)) {
    return list.filter((item) => item.parentId === parentId);
  }

  return Object.values(list).filter((item: any) => item.parentId === parentId);
});
