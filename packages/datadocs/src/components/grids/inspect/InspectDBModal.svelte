<script lang="ts">
  import { getContext } from "svelte";
  import {
    ModalContentWrapper,
    CLOSE_MODAL_CONTEXT_NAME,
  } from "../../common/modal";
  import { temporaryFileForIngesting } from "../../../app/store/writables";
  import ModalFooter from "../../common/modal/ModalFooter.svelte";

  const modalTitle = "Inspect Database";
  let closeModal: () => any = getContext(CLOSE_MODAL_CONTEXT_NAME);
</script>

<ModalContentWrapper title={modalTitle} isMovable={false}>
  <ModalFooter on:close={closeModal} />
</ModalContentWrapper>
