<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import { vscode } from '../lib/data';
	import InterfaceSidebar from './InterfaceSidebar.svelte';
	import PortSidebar from './PortSidebar.svelte';
	import SelectionSidebar from './SelectionSidebar.svelte';
	import ServiceSidebar from './ServiceSidebar.svelte';
	import { current_sidebar_element, noSidebar } from '../lib/sidebar';
	import TypeSidebar from './TypeSidebar.svelte';

	let resizeMode = false;
	let x = 0;

	const resizeStart = (event: MouseEvent) => {
		if (resizeMode) return;
		resizeMode = true;
		x = window.innerWidth - event.clientX;
	};

	const resize = (event: MouseEvent) => {
		if (!resizeMode) return;
		x -= event.movementX;
	};

	const undoChange = async (event: MessageEvent<any>) => {
		if (event.data.command === 'undo') {
			// TODO implement undo functionality
		}
	};

	const dispatcher = createEventDispatcher();
	const sendVSCodeCommand = (event: CustomEvent, command: string) => {
		//TODO move down under vscode check
		dispatcher('reloadgraph');
		if (vscode === undefined) return;
		vscode.postMessage({
			command,
			detail: event.detail
		});
	};
</script>

<svelte:window
	on:mouseup|stopPropagation={() => {
		resizeMode = false;
	}}
	on:mousemove={resize}
	on:message|stopPropagation={undoChange}
/>
{#if $current_sidebar_element.hist_type >= 0}
	<div
		class="absolute top-0 right-0 w-11/12 sm:w-1/2 lg:w-4/12 xl:w-3/12 h-full bg-gray-800 overflow-hidden"
		style={x == 0 ? '' : `width: ${x}px; min-width: 200px`}
		in:fly={{ duration: 150, x: 1000 }}
		out:fly={{ duration: 1000, x: 2000 }}
	>
		<div
			on:mousedown|stopPropagation={resizeStart}
			class={vscode !== undefined
				? 'w-2 h-full bg-gray-200 absolute cursor-col-resize'
				: 'w-2 h-full bg-gray-900 absolute cursor-col-resize'}
		/>
		<div class="m-auto w-full min-w-fit text-white px-6 select-none">
			<div class="font-mono text-xl mt-4">
				<p
					class="w-fit cursor-pointer"
					on:click={() => {
						current_sidebar_element.set(noSidebar);
					}}
					on:keypress={() => {
						current_sidebar_element.set(noSidebar);
					}}
				>
					X
				</p>
			</div>
			{#if $current_sidebar_element.hist_type === 1}
				<PortSidebar
					port={$current_sidebar_element.port}
					portType={$current_sidebar_element.portType}
					parentID={$current_sidebar_element.port_parentID}
					on:editPort={(e) => sendVSCodeCommand(e, 'renamePort')}
					on:opensidebar
				/>
			{/if}
			{#if $current_sidebar_element.hist_type === 0}
				<ServiceSidebar
					service={$current_sidebar_element.service}
					on:opensidebar
					on:popup
					on:reloadgraph
					on:editService={(e) => sendVSCodeCommand(e, 'renameService')}
				/>
			{/if}
			{#if $current_sidebar_element.hist_type === 2}
				<InterfaceSidebar interf={$current_sidebar_element.interf} on:opensidebar />
			{/if}
			{#if $current_sidebar_element.hist_type === 3}
				<TypeSidebar type={$current_sidebar_element.type} on:opensidebar />
			{/if}
			{#if $current_sidebar_element.hist_type === 4}
				<SelectionSidebar serviceList={$current_sidebar_element.serviceList} />
			{/if}
		</div>
	</div>
{/if}