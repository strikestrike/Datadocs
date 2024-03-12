<script lang="ts">
  import { onMount, getContext } from "svelte";
  import {
    ModalContentWrapper,
    CLOSE_MODAL_CONTEXT_NAME,
  } from "../../common/modal";
  import { validator } from "@felte/validator-yup";
  import { createForm } from "felte";
  import CreateOrOpenFirestoreForm from "../form/CreateOrOpenFirestore.svelte";
  import type { FormResult } from "../form/form";
  import { schema } from "../form/form";
  import { requestAllFirestoreDocs } from "../../../api/firestore";
  import { firestoreDocs } from "../../../app/store/store-firestore-docs";
  import { getActiveGrids } from "../../../app/store/grid/get-instance";

  let closeModal: Function = getContext(CLOSE_MODAL_CONTEXT_NAME);
  const formContext = createForm({
    extend: validator({ schema }),
    onSubmit: (values: FormResult) => {
      // addDatabaseTree(values);
      console.log(getActiveGrids());
      closeModal();
    },
  });
  onMount(() => {
    const docs = $firestoreDocs;
    if (docs.data.length === 0)
      firestoreDocs.update((it) => ({ ...it, loading: true }));

    requestAllFirestoreDocs().then((docs) => {
      firestoreDocs.set({ loading: false, data: docs });
    });
  });
</script>

<ModalContentWrapper title="Open Firestore document" isMovable={false}>
  <CreateOrOpenFirestoreForm on:close={() => closeModal()} {formContext} />
</ModalContentWrapper>
