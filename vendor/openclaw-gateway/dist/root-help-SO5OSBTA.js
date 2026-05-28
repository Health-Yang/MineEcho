import { T as collectUniqueCommandDescriptors, _ as getSubCliEntries, b as getCoreCliCommandDescriptors, w as addCommandDescriptorsToProgram } from "./argv-86ytN5P4.js";
import { n as VERSION } from "./version-BjFOZC7j.js";
import { t as configureProgramHelp } from "./help-icOLRzWV.js";
import { t as getPluginCliCommandDescriptors } from "./cli-DugU6Y7s.js";
import { Command } from "commander";
//#region src/cli/program/root-help.ts
async function buildRootHelpProgram(renderOptions) {
	const program = new Command();
	const pluginDescriptors = renderOptions?.includePluginDescriptors === true || renderOptions?.config ? await getPluginCliCommandDescriptors(renderOptions.config, renderOptions.env, { pluginSdkResolution: renderOptions.pluginSdkResolution }) : [];
	configureProgramHelp(program, {
		programVersion: VERSION,
		channelOptions: [],
		messageChannelOptions: "",
		agentChannelOptions: ""
	}, { commandsWithSubcommands: new Set(pluginDescriptors.filter((descriptor) => descriptor.hasSubcommands).map((descriptor) => descriptor.name)) });
	addCommandDescriptorsToProgram(program, collectUniqueCommandDescriptors([
		getCoreCliCommandDescriptors(),
		getSubCliEntries(),
		pluginDescriptors
	]));
	return program;
}
async function renderRootHelpText(renderOptions) {
	const program = await buildRootHelpProgram(renderOptions);
	let output = "";
	const originalWrite = process.stdout.write.bind(process.stdout);
	const captureWrite = ((chunk) => {
		output += String(chunk);
		return true;
	});
	process.stdout.write = captureWrite;
	try {
		program.outputHelp();
	} finally {
		process.stdout.write = originalWrite;
	}
	return output;
}
async function outputRootHelp(renderOptions) {
	process.stdout.write(await renderRootHelpText(renderOptions));
}
//#endregion
export { outputRootHelp };
