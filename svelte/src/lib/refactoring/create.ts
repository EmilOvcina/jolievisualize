import { interfaces, vscode } from '../data';
import { openPopup } from '../popup';

/**
 * Opens a popup with the necessary fields to create a new port.
 * the port is created and added to the system.
 * the port is then send to vscode.
 * @param type Type of port to create, "Input" or "Output"
 * @param service service to add the port to.
 */
export const createPort = (type: string, service: Service): void => {
	openPopup(
		`Create new ${type.toLowerCase()} port`,
		[{ field: 'name' }, { field: 'protocol' }, { field: 'location' }, { field: 'interfaces' }],
		(vals: { field: string; val: string }[]) => {
			if (vals.filter((t) => t.val === '' && t.field !== '' && t.field !== 'interfaces').length > 0)
				return false;
			const tmp_interfaces: { name: string }[] = [];
			if (vals.find((t) => t.field === 'interfaces').val.trim() !== '')
				vals
					.find((t) => t.field === 'interfaces')
					?.val.split(',')
					.forEach((str) => tmp_interfaces.push({ name: str.trim() }));

			const newPort: Port = {
				name: vals.find((t) => t.field === 'name')?.val,
				protocol: vals.find((t) => t.field === 'protocol')?.val,
				location: vals.find((t) => t.field === 'location')?.val,
				interfaces: tmp_interfaces.length == 0 ? undefined : tmp_interfaces,
				file: service.file
			};

			let isFirst = true;
			let range: CodeRange;
			if (type === 'Input') {
				if (!service.inputPorts) service.inputPorts = [];
				isFirst = service.inputPorts.length === 0;
				range = isFirst
					? service.ranges.find((t) => t.name === 'svc_name')
					: service.inputPorts[0].ranges.find((t) => t.name === 'port');
				service.inputPorts.push(newPort);
			} else {
				if (!service.outputPorts) service.outputPorts = [];
				isFirst = service.outputPorts.length === 0;
				range = isFirst
					? service.ranges.find((t) => t.name === 'svc_name')
					: service.outputPorts[0].ranges.find((t) => t.name === 'port');
				service.outputPorts.push(newPort);
			}

			if (!vscode) return;
			vscode.postMessage({
				command: `create.port`,
				save: true,
				fromPopup: true,
				detail: {
					file: service.file,
					portType: type === 'Input' ? 'inputPort' : 'outputPort',
					isFirst,
					range: range.range,
					port: {
						name: vals.find((t) => t.field === 'name')?.val.trim(),
						protocol: vals.find((t) => t.field === 'protocol')?.val.trim(),
						location: vals.find((t) => t.field === 'location')?.val.trim(),
						interfaces: tmp_interfaces.map((t) => {
							return { file: interfaces.find((i) => i.name === t.name)?.file, name: t.name };
						})
					}
				}
			});
			return true;
		}
	);
};
