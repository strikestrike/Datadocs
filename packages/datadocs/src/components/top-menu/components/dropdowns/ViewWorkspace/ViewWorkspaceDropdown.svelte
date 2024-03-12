<script lang="ts">
  import { getListDefaultWorkspaces, getListCustomWorkspaces } from "../../../../../app/store/store-workspaces";
  import ViewWorkspaceElement from "./ViewWorkspaceElement.svelte";
  import ViewWorkspaceReset from "./ViewWorkspaceReset.svelte";
  import ViewWorkspaceAdd from "./ViewWorkspaceAdd.svelte";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";

  const defaultWorkspaces = getListDefaultWorkspaces();
  const customWorkspaces = getListCustomWorkspaces();
  let element: HTMLElement = null;

  const startDefaultIndex = 0;
  const startCustomIndex = defaultWorkspaces.length;
  const resetIndex = startCustomIndex + customWorkspaces.length;
  const addIndex = resetIndex + 1;

  const configList: KeyControlConfig[] = [];
  const options: KeyControlActionOptions = {
    configList: configList,
  };
</script>

<div
  bind:this={element}
  class="default-dropdown-box-shadow h-[inherit] overflow-y-auto overflow-x-hidden bg-white rounded min-w-[300px] max-w-[300px]"
  use:keyControlAction={options}
>
  <div class="flex flex-col flex-nowrap py-1.5">
    {#each defaultWorkspaces as workspace, index}
      <ViewWorkspaceElement
      {workspace}
      index={startDefaultIndex + index}
      keyControlActionOptions={options}
      scrollContainer={element}/>
    {/each}

    {#each customWorkspaces as workspace, index}
      <ViewWorkspaceElement
      {workspace}
      index={startCustomIndex + index}
      keyControlActionOptions={options}
      scrollContainer={element}/>
    {/each}

    <div class="block">
      <div class="border-b border-[#E6E6E6] h-1px my-2.5"/>
    </div>
  
    <ViewWorkspaceReset
      index={resetIndex}
      keyControlActionOptions={options}
      scrollContainer={element}
    />

    <ViewWorkspaceAdd
      index={addIndex}
      keyControlActionOptions={options}
      scrollContainer={element}
    />
  </div>
</div>
