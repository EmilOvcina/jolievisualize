import type { ElkNode } from 'elkjs/lib/elk-api';
import { services, vscode } from './data';
import { addServiceToNetwork, getServiceNetworkId, removeFromNetwork } from './network';
import { PopUp, current_popup } from './popup';
import { createAggregator } from './patterns';

export const getAllServices = (services: Service[][]) => {
	return services.flatMap((t) => t.flatMap((s) => getRecursiveEmbedding(s)));
};

export const embed = async (service: Service, parent: Service, netwrkId: number) => {
	const oldParent = service.parent;
	await disembed(service, true);
	service.parent = parent;
	if (!parent.embeddings) parent.embeddings = [];
	if (!service.inputPorts) service.inputPorts = [];
	if (!parent.outputPorts) parent.outputPorts = [];
	parent.embeddings.push(service);

	const parentPort = getParentPortName(service, parent);
	if (parentPort) {
		service.parentPort = parentPort;
		return;
	}
	current_popup.set(
		new PopUp(
			`Create new local ports for ${service.name} and ${parent.name}`,
			['input port name', 'output port name', 'protocol', 'interfaces'],
			300,
			(vals) => {
				const tmp_interfaces = [];
				vals
					.find((t) => t.field === 'interfaces')
					?.val.split(',')
					.forEach((str) => tmp_interfaces.push({ name: str.trim() }));

				const newIP: Port = {
					file: service.file,
					location: `!local_${service.name}${service.id}`,
					protocol: vals.find((t) => t.field === 'protocol').val,
					name: vals.find((t) => t.field === 'input port name').val,
					interfaces: tmp_interfaces
				};

				const newOP: Port = {
					file: service.file,
					location: `!local_${service.name}${service.id}`,
					protocol: vals.find((t) => t.field === 'protocol').val,
					name: vals.find((t) => t.field === 'output port name').val,
					interfaces: tmp_interfaces
				};

				service.parentPort = vals.find((t) => t.field === 'output port name').val;

				service.inputPorts.push(newIP);
				parent.outputPorts.push(newOP);
			},
			async () => {
				if (oldParent) {
					service.parent = oldParent;
					parent.embeddings = parent.embeddings.filter((t) => t.id !== service.id);
					await embed(service, oldParent, netwrkId);
				} else {
					addServiceToNetwork(service, netwrkId);
					await disembed(service, true);
				}
			}
		)
	);
};

export const disembed = async (service: Service, isEmbedSubroutine = false) => {
	if (!service.parent) return false;
	const parent = service.parent;
	service.parent = undefined;

	const parentPort = parent.outputPorts.find((t) => t.name === service.parentPort);
	const parentPortName = parentPort?.name;
	if (getNumberOfTotalInstances(service) === 1 || isEmbedSubroutine) {
		const portsToRemove = service.inputPorts
			.filter((ip) => ip.location.startsWith('!local'))
			.map((ip) => {
				return {
					filename: ip.file,
					portName: ip.name,
					portType: 'inputPort',
					serviceName: service.name
				};
			});

		if (parentPort && parentPort.location.startsWith('!local')) {
			portsToRemove.push({
				filename: parentPort.file,
				portName: parentPortName,
				portType: 'outputPort',
				serviceName: parent.name
			});
			if (parent.outputPorts)
				parent.outputPorts = parent.outputPorts.filter((t) => t.name !== parentPortName);
		}

		if (service.inputPorts)
			service.inputPorts = service.inputPorts.filter((ip) => !ip.location.startsWith('!local'));

		if (portsToRemove.length > 0 && vscode)
			vscode.postMessage({ command: 'removePorts', detail: { ports: portsToRemove } });
	} else {
		if (parent.outputPorts)
			parent.outputPorts = parent.outputPorts.filter((t) => t.name !== parentPortName);
		current_popup.set(
			new PopUp(
				`Create new port for aggregator`,
				['name', 'protocol', 'location'],
				300,
				(vals) => {
					const oldPort: Port = {
						name: parentPort.name,
						location: parentPort.location,
						protocol: parentPort.protocol,
						file: parentPort.file,
						interfaces: parentPort.interfaces
					};
					parentPort.location = vals.find((t) => t.field === 'location').val;
					if (vscode)
						vscode.postMessage({
							command: 'renamePort',
							detail: {
								editType: 'location',
								oldPort,
								newPort: parentPort
							}
						});
					parent.outputPorts.push(parentPort);
					// TODO add aggregator
					createAggregator([service]);
				},
				async () => {
					const tmpSvcNetworkId = getServiceNetworkId(service);
					removeFromNetwork(service, tmpSvcNetworkId);
					service.parent = parent;
					parent.outputPorts.push(parentPort);
					parent.embeddings.push(service);
					service.parentPort = getParentPortName(service, parent);
				}
			)
		);
	}
	if (vscode && parent)
		vscode.postMessage({
			command: 'removeEmbed',
			detail: {
				filename: parent.file,
				serviceName: parent.name,
				embedName: service.name,
				embedPort: service.parentPort
			}
		});
	service.parentPort = undefined;
	if (parent.embeddings) parent.embeddings = parent.embeddings.filter((t) => t.id !== service.id);
	return parent;
};

export const getServiceFromCoords = (e: MouseEvent, services: Service[][]) => {
	const elemBelow = getElementBelowGhost(e)[0];
	return elemBelow.tagName === 'polygon' ? getServiceFromPolygon(elemBelow, services) : undefined;
};

export const getHoveredPolygon = (e: MouseEvent) => {
	const elemBelow = getElementBelowGhost(e)[0];
	return elemBelow.tagName === 'polygon' ? elemBelow : undefined;
};

export const isAncestor = (child: Service, anc: Service) => {
	if (!child.parent) return false;
	let parent = child.parent;
	while (parent.parent) {
		if (parent.id === anc.id) return true;
		parent = parent.parent;
	}
	return parent.id === anc.id;
};

export const renderGhostNodeOnDrag = (
	serviceNode: ElkNode,
	e: MouseEvent,
	startX: number,
	startY: number
) => {
	const polygon = document.querySelector('#' + serviceNode.id).children[0];
	const text = document.querySelector('#' + serviceNode.id + ' > text');
	const rect = polygon.getBoundingClientRect();

	const scaleFull = document.querySelector('svg > g').getAttribute('transform');
	const scale = +scaleFull.substring(scaleFull.indexOf('scale(') + 6, scaleFull.length - 1);

	const sx = (rect.left + e.pageX - startX) / scale;
	const sy = (rect.top + e.pageY - startY) / scale;

	const ghostPoly = document.querySelector('#tmp > polygon');
	ghostPoly.setAttribute('points', polygon.getAttribute('points'));
	ghostPoly.setAttribute('class', polygon.getAttribute('class'));
	ghostPoly.setAttribute('style', `stroke-width: 0.4; opacity: 0.6;`);

	const ghostText = document.querySelector('#tmp > text');
	ghostText.setAttribute('class', text.getAttribute('class'));
	ghostText.setAttribute('style', text.getAttribute('style'));
	ghostText.setAttribute('x', text.getAttribute('x'));
	ghostText.setAttribute('y', text.getAttribute('y'));
	ghostText.innerHTML = text.innerHTML;

	const tmp = document.querySelector('#tmp');
	tmp.setAttribute('transform', `scale(${scale}) translate(${sx},${sy})`);
	document.querySelector('main').appendChild(tmp);
};

const getElementBelowGhost = (e: MouseEvent) => {
	if (document.querySelector('#tmp'))
		document.querySelector('#tmp').setAttribute('style', 'display: none;');
	const elemBelow = document.elementsFromPoint(e.clientX, e.clientY);
	if (document.querySelector('#tmp')) document.querySelector('#tmp').removeAttribute('style');

	return elemBelow;
};

const getServiceFromPolygon = (elem: Element, services: Service[][]) => {
	return getAllServices(services).find(
		(t) => t.name + t.id === elem.parentElement.getAttribute('id')
	);
};

const getRecursiveEmbedding = (service: Service, result: Service[] = []) => {
	result.push(service);
	service.embeddings?.forEach((embed) => {
		result = result.concat(getRecursiveEmbedding(embed));
	});
	return result;
};

const getNumberOfTotalInstances = (service: Service) => {
	const allServices = getAllServices(services);
	return allServices.filter((t) => t.name === service.name && t.file === service.file).length - 1;
};

const getParentPortName = (inSvc: Service, outSvc: Service): string | undefined => {
	if (!outSvc.outputPorts || !inSvc.inputPorts) return undefined;
	let res: string | undefined = undefined;
	outSvc.outputPorts.forEach((op) => {
		if (res) return;
		inSvc.inputPorts.forEach((ip) => {
			if (ip.location === op.location) {
				res = op.name;
				return;
			}
		});
	});
	return res;
};
