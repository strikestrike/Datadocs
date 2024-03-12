import { get } from "svelte/store";
import { datadocsFileSystemManagerStore } from "../../../../app/store/writables";

/*
export const initDatadocsData: Array<DatadocsObjectNode> = [
  {
    id: "1",
    parent: null,
    type: "folder",
    name: "Documents",
    created: 1695666203000,
  },
  {
    id: "1_1",
    parent: "1",
    type: "folder",
    name: "Customers",
    created: 1695666203000,
  },
  {
    id: "1_2",
    parent: "1",
    type: "folder",
    name: "Continents",
    created: 1695666203000,
  },
  {
    id: "1_2_1",
    parent: "1_2",
    type: "workbook",
    name: "Asia",
    created: 1695666203000,
    lastOpened: 1699899803000,
  },
  {
    id: "1_2_2",
    parent: "1_2",
    type: "workbook",
    name: "Europe",
    created: 1695666203000,
    lastOpened: 1699295003000,
  },
  {
    id: "1_2_3",
    parent: "1_2",
    type: "workbook",
    name: "Africa",
    created: 1695666203000,
    lastOpened: 1699295003000,
  },
  {
    id: "1_3",
    parent: "1",
    type: "workbook",
    name: "Config",
    created: 1695666203000,
    lastOpened: 1700072603000,
  },
  {
    id: "1_4",
    parent: "1",
    type: "workbook",
    name: "System",
    created: 1695666203000,
    lastOpened: 1696011803000,
  },
  {
    id: "1_5",
    parent: "1",
    type: "folder",
    name: "Data",
    created: 1695147803000,
  },
  {
    id: "1_6",
    parent: "1",
    type: "folder",
    name: "Admins",
    created: 1695147803000,
  },
  {
    id: "1_7",
    parent: "1",
    type: "folder",
    name: "Collections",
    created: 1695147803000,
  },
  {
    id: "1_8",
    parent: "1",
    type: "workbook",
    name: "Songs",
    created: 1695147803000,
    lastOpened: 1695925403000,
  },
  {
    id: "1_9",
    parent: "1",
    type: "workbook",
    name: "Singers",
    created: 1695147803000,
    lastOpened: 1699899803000,
  },
  {
    id: "1_11",
    parent: "1",
    type: "workbook",
    name: "Workbook 6",
    created: 1695147803000,
    lastOpened: 1699295003000,
  },
  {
    id: "1_12",
    parent: "1",
    type: "workbook",
    name: "Workbook 8",
    created: 1695147803000,
    lastOpened: 1699899803000,
  },
  {
    id: "2",
    parent: null,
    type: "workbook",
    name: "Workbook 5",
    created: 1695147803000,
    lastOpened: 1695752603000,
  },
  {
    id: "3",
    parent: null,
    type: "workbook",
    name: "Workbook 1",
    created: 1695147803000,
    lastOpened: 1699295003000,
  },
  {
    id: "4",
    parent: null,
    type: "workbook",
    name: "Workbook 3",
    created: 1695147803000,
    lastOpened: 1699295003000,
  },
];
*/

export function getDatadocsFileSystemManager() {
  return get(datadocsFileSystemManagerStore);
}
