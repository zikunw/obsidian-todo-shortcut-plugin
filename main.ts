import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFolder, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	taskDirectory: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	taskDirectory: 'Daily_TODO'
}

const enum TaskType {
	Reading = 'Reading',
	Work = 'Work',
	Exercise = 'Exercise',
	Other = 'Other'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// create ribbon
		const ribbonIconEl = this.addRibbonIcon('glasses', 'Add Daily Task', (ev: MouseEvent) => {
			new CreateTaskModal(this.app, (taskName, taskType) => {
				
				const taskPath = this.createTodayTask();
				if (taskPath === null) {
					return;
				}
				console.log(taskPath);

				this.addTaskToToday(taskPath, taskName, taskType);

			}).open();
		})

		// status bar
		const statusBarEl = this.addStatusBarItem();
		const ratio = await this.getTodayRatio();
		statusBarEl.createEl('span', {text: `Daily Task: ${ratio}`});

		// refresh status bar every 5 seconds
		setInterval(async () => {
			const ratio = await this.getTodayRatio();
			statusBarEl.empty();
			statusBarEl.createEl('span', {text: `Daily Task: ${ratio}`});
		}, 5000);

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

	getTodayDate(): string {
		// get today's date
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth() + 1;
		const day = today.getDate();
		const dateString = `${year}-${month}-${day}`;
		return dateString;
	}

	createTodayTask(): string | null {
		const taskDirectory = this.app.vault.getAbstractFileByPath(this.settings.taskDirectory);
			
		// if the taskDirectory is not a directory, throw an error
		if (taskDirectory instanceof TFile) {
			new Notice(`Task Directory (${this.settings.taskDirectory}) is not a directory!`);
			return null;
		}

		// if the taskDirectory does not exist, create it
		if (taskDirectory === null) {
			this.app.vault.createFolder(this.settings.taskDirectory);
			new Notice(`Task Directory (${this.settings.taskDirectory}) created!`);
		}

		const dateString = this.getTodayDate();

		// check if the file already exists
		const taskFile = this.app.vault.getAbstractFileByPath(`${this.settings.taskDirectory}/${dateString}.md`);
		if (taskFile instanceof TFolder) {
			new Notice(`Task File (${dateString}.md) is a directory!`);
			return null;
		}
		if (taskFile === null) {
			this.app.vault.create(`${this.settings.taskDirectory}/${dateString}.md`, '');
			new Notice(`Task File (${dateString}.md) created!`);
		}

		// return the path to the file
		return `${this.settings.taskDirectory}/${dateString}.md`;
	}

	addTaskToToday(taskPath:string, taskName: string, taskType: TaskType) {
		const task = `- [ ] ${taskName} (${taskType})\n`;
		// get the TFile object
		const taskFile = this.app.vault.getAbstractFileByPath(taskPath);
		if (taskFile instanceof TFile) {
			this.app.vault.append(taskFile, task);
		}
	}

	async getTodayRatio(): Promise<string> {
		const taskPath = this.createTodayTask();
		if (taskPath === null) {
			return '';
		}
		const taskFile = this.app.vault.getAbstractFileByPath(taskPath);
		if (taskFile instanceof TFile) {
			const content = await this.app.vault.read(taskFile);
			const lines = content.split('\n');
			let total = 0;
			let completed = 0;
			for (let line of lines) {
				if (line.startsWith('- [ ]')) {
					total += 1;
				} else if (line.startsWith('- [x]')) {
					completed += 1;
					total += 1;
				}
			}
			if (total === 0) {
				return '0%';
			}
			return `${Math.round(completed / total * 100)}%`;
		}
		return 'error'
	}
}

class CreateTaskModal extends Modal {
	taskName: string;
	taskType: TaskType = TaskType.Reading;
	onSubmit: (taskName: string, taskType: TaskType) => void;

	constructor(app: App, onSubmit: (taskName: string, taskType: TaskType) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;
		
		contentEl.createEl('h2', {text: 'Create a new daily task'});

		new Setting(contentEl)
			.setName('Task Name')
			.addText((text) =>
				text.onChange((value) => {
					this.taskName = value;
				}
			));
		
		new Setting(contentEl)
			.setName('Task Type')
			.addDropdown((dropdown) => {
				dropdown.addOption(TaskType.Reading, 'Reading');
				dropdown.addOption(TaskType.Work, 'Work');
				dropdown.addOption(TaskType.Exercise, 'Exercise');
				dropdown.addOption(TaskType.Other, 'Other');
				dropdown.onChange((value) => {
					this.taskType = value as TaskType;
				});
			});

		new Setting(contentEl)
			.addButton((btn) =>
			  btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
				  this.close();
				  this.onSubmit(this.taskName, this.taskType);
				}));
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
