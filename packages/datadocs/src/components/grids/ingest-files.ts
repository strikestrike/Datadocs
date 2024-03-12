import IngestFileModal from "../../components/ingest/modal/IngestFileModal.svelte";
import { temporaryFileForIngesting } from "../../app/store/writables";
import { openModal } from "../common/modal";

/** random value */
const openFilePickerId = "2ff9627e724841bb9631b373a537277f";

const csvType: FilePickerAcceptType = {
  description: "CSV",
  accept: { "text/csv": [".csv"] },
};
const parquetFile: FilePickerAcceptType = {
  description: "Apache Parquet",
  accept: { "application/vnd.apache.parquet": [".parquet"] },
};

export function handleOnIngest() {
  _handleOnIngest().catch((e) => {
    console.error(e);
  });
}

async function _handleOnIngest() {
  const files = await window.showOpenFilePicker({
    multiple: false,
    id: openFilePickerId,
    types: [csvType, parquetFile],
  });
  if (files.length <= 0) return;
  const [file] = files;
  console.log(file);
  temporaryFileForIngesting.set(file);
  openModal({
    component: IngestFileModal,
    isMovable: false,
    isResizable: false,
    minWidth: 375,
    minHeight: 200,
    preferredWidth: Math.min(window.innerWidth - 20, 720),
  });
}
