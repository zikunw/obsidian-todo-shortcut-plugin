import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFolder, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	taskDirectory: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	taskDirectory: 'Daily_TODO'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// create ribbon
		const ribbonIconEl = this.addRibbonIcon('glasses', 'Add Daily Task', (ev: MouseEvent) => {
			

		})

		// setting
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	createTodayTask(): boolean {
		const taskDirectory = this.app.vault.getAbstractFileByPath(this.settings.taskDirectory);
			
		// if the taskDirectory is not a directory, throw an error
		if (taskDirectory instanceof TFile) {
			new Notice(`Task Directory (${this.settings.taskDirectory}) is not a directory!`);
			return false;
		}

		// if the taskDirectory does not exist, create it
		if (taskDirectory === null) {
			this.app.vault.createFolder(this.settings.taskDirectory);
			new Notice(`Task Directory (${this.settings.taskDirectory}) created!`);
		}

		// get today's date
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth() + 1;
		const day = today.getDate();
		const dateString = `${year}-${month}-${day}`;

		// check if the file already exists
		const taskFile = this.app.vault.getAbstractFileByPath(`${this.settings.taskDirectory}/${dateString}.md`);
		if (taskFile instanceof TFolder) {
			new Notice(`Task File (${dateString}.md) is a directory!`);
			return false;
		}
		if (taskFile === null) {
			this.app.vault.create(`${this.settings.taskDirectory}/${dateString}.md`, '');
			new Notice(`Task File (${dateString}.md) created!`);
		}

		return true;
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Daily Task Directory')
			.setDesc('Default is /Daily_TODO')
			.addText(text => text
				.setPlaceholder('Enter a directory')
				.setValue(this.plugin.settings.taskDirectory)
				.onChange(async (value) => {
					this.plugin.settings.taskDirectory = value;
					await this.plugin.saveSettings();
				}));
	}
}
