let p_services: Service[];
let p_interfaces: Interface[];
let p_types: Type[];

export const preprocess = (json: Data): Data => {
	p_services = json.services;
	p_interfaces = json.interfaces;
	p_types = json.types;

	p_services.forEach((service) => {
		if (service.embeddings) {
			connectEmbeds(service);
			connectEmbedOutputPorts(service);
		}
		if (service.outputPorts) {
			connectRedirectResources(service.outputPorts);
			joinOutputPortArrows(service);
		}
	});

	return {
		name: json.name ?? undefined,
		placegraph: json.placegraph,
		services: p_services,
		interfaces: p_interfaces,
		types: p_types
	};
};

const joinOutputPortArrows = (service: Service) => {
	const list: Port[] = [];
	service.outputPorts?.forEach((p) => {
		const otherPorts = service.outputPorts?.filter(
			(p2) => p.name !== p2.name && p.location === p2.location
		);
		if (!otherPorts || otherPorts?.length === 0) return;
		otherPorts.forEach((op) => list.push(op));
	});
	list.splice(0, 1);
	if (list.length == 0) return;
	list.forEach((p) => {
		p.cost = false;
	});
};

const connectRedirectResources = (outputPorts: Port[]) => {
	if (outputPorts.find((p) => p.location.includes('/!/')) === undefined) return;

	outputPorts.forEach((p) => {
		if (!p.location.includes('/!/')) return;
		const url = p.location.split('/!/');
		p.location = url[0];
		p.resource = url[1];
	});
};

const connectEmbedOutputPorts = (service: Service) => {
	let newListOfOPs: Port[] = service.outputPorts;
	let embeds: Port[] = [];
	service.embeddings?.forEach((embed) => {
		newListOfOPs = newListOfOPs.filter((t) => t.name !== embed.port);
		const corrOutputPort = service.outputPorts?.find((t) => embed.port === t.name);
		if (corrOutputPort === undefined) return;
		embeds.push(corrOutputPort);
	});
	service.outputPorts = embeds.concat(newListOfOPs);
};

const connectEmbeds = (service: Service) => {
	if (service.embeddings === undefined) return;
	service.embeddings.forEach((embed) => {
		const corrOutputPort = service.outputPorts?.find((t) => embed.port === t.name);
		if (corrOutputPort === undefined) return;

		const embeddedService = p_services.find((s) => s.name === embed.name);
		if (embeddedService === undefined) return;

		const corrInputPort = embeddedService.inputPorts?.find(
			(t) =>
				t.location === 'local' ||
				(t.location == corrOutputPort.location && sharesInterface(t, corrOutputPort))
		);
		if (corrInputPort === undefined) return;

		corrOutputPort.location = `!local_${embed.name}`;
		corrInputPort.location = `!local_${embed.name}`;

		embeddedService.embeddingType = embed.type;
	});
};

const sharesInterface = (p1: Port, p2: Port): boolean => {
	if (p1.interfaces === undefined && p2.interfaces === undefined) return true;
	const listP1 = p1.interfaces.flatMap((t) => t.name);
	const listP2 = p2.interfaces.flatMap((t) => t.name);
	for (let i = 0; i < listP1.length; i++)
		for (let j = 0; j < listP2.length; j++) if (listP1[i] === listP2[j]) return true;
	return false;
};
