// @ts-ignore
import ChartWorker from './chart.worker';
// @ts-ignore
import CoordinatesWorker from './coordinates.worker';
// @ts-ignore
import DBWorker from './db.worker';
// @ts-ignore
import Worker from './filter.worker';

export const worker = Worker();
export const dbWorker = DBWorker();
export const posWorker = CoordinatesWorker();
export const chartWorker = ChartWorker();
