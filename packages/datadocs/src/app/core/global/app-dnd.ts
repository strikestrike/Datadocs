/*
 * @Author: lainlee
 * @Date: 2023-04-24 22:16:09
 * @Description:
 */
import type { ContextType } from "src/layout/enums/context";
import type { DND } from "src/layout/enums/dnd";
import { writable } from "svelte/store";

export const DND_INSERT_OBJECT = "insertObject";
export const DND_INSERT_TAB = "insertTab";

export type AppDND = {
  action: DND;
  data: any;
  event?: MouseEvent;
  allowDrop?: ContextType;
};

export const appDnd = writable<AppDND | null>(null);

// const testObj = {
//   action: "workbookTab",
//   type: "workbook",
//   data: {
//     offsetLeft: 20,
//     offsetRight: 45,
//     offsetTop: 20,
//     offsetBottom: 45,
//     pane: {
//       id: "4qur5mj6v17",
//       type: "group",
//       placement: "container:center:main",
//       props: {
//         isSpreadSheetGroup: true,
//         groupType: "spreadsheetGroup",
//       },
//       children: [],
//       size: "auto",
//       content: {
//         view: {
//           id: "wohd3nrb6n",
//           name: "spreadsheet",
//           label: "Grid 844",
//           icon: "object-spreadsheet",
//           config: {
//             transform: {
//               x: 0,
//               y: 0,
//               width: 400,
//               height: 300,
//             },
//           },
//         },
//       },
//     },
//   },
// };
// export const appDnd = writable<AppDND | null>(testObj);
// appDnd.subscribe((value) => {
//   if (!value) {
//     appDnd.set(testObj);
//   }
// });
