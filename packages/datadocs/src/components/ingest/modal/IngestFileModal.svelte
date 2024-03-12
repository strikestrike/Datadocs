<script context="module">
  export const ssr = false;
  export const prerender = false;
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import {
    ModalContentWrapper,
    CLOSE_MODAL_CONTEXT_NAME,
  } from "../../common/modal";
  import { temporaryFileForIngesting } from "../../../app/store/writables";
  import IngestFileForm from "../form/IngestFileForm.svelte";
  import {
    getDuckDBManagerInstance,
    ingestOrImportFile,
  } from "../../../app/store/store-db";
  import type { FormInIngestHandler } from "../form/IngestFileForm.svelte";
  import type { Writable } from "svelte/store";
  import { insertTableViewToManagedFiles } from "../../panels/Sources/manager/databaseStateManager";

  const fileName = $temporaryFileForIngesting.name;
  const modalTitle = `Ingest data from "${fileName}"`;

  let closeModal: () => any = getContext(CLOSE_MODAL_CONTEXT_NAME);

  async function ingestHandler(
    form: FormInIngestHandler,
    status: Writable<string | Error>,
  ) {
    if (!form?.tableName) throw new Error(`Table name is required`);

    const file = await $temporaryFileForIngesting.getFile();
    if (!file) return;

    const tableName = form.tableName;
    await ingestOrImportFile(file, tableName, "ingest");
    await insertTableViewToManagedFiles({
      name: tableName,
      type: "table",
      fileName: file.name,
    });

    const dbManager = getDuckDBManagerInstance();
    const connID = await dbManager.createConnection();
    await dbManager.closeConnection(connID);
  }
</script>

<ModalContentWrapper title={modalTitle} isMovable={false}>
  <IngestFileForm {ingestHandler} on:close={closeModal} />
</ModalContentWrapper>
