import { getInstance } from "ts-indexdb";
import { TsIndexDb } from "ts-indexdb/dist/TsIndexDb";

const dbConfig = { skipSave: false, saveInCloud: false };

export const setSkipDbSave = (skip: boolean) => {
  dbConfig.skipSave = skip;
};

export const getDbInstance: () => TsIndexDb = () => {
  if (dbConfig.skipSave)
    return new TsIndexDb({ dbName: "", version: 1, tables: [] });
  return getInstance();
};
