const electron = require('electron');
const app = electron.app;
const path = require('path');
const ElectronPreferences = require('electron-preferences');

const Preferences = new ElectronPreferences({
	dataStore: path.resolve(app.getPath('userData'), 'preferences.json'),
	defaults: {
		general: {
			autostart: true,
		},
		bindings: {
			screenshot: 'Alt+Shift+S',
			clipboard: 'Alt+Shift+C',
			notes: 'Alt+Shift+N',
		},
	},
	sections: [
		{
			id: 'general',
			label: 'General',
			icon: 'home-52',
			form: {
				groups: [
					{
						label: 'General',
						fields: [
							{
								label: 'Open drop automatically after you log into this computer',
								key: 'autostart',
								type: 'radio',
								options: [
									{ label: 'Yes', value: true },
									{ label: 'No', value: false },
								],
							},
						]
					}
				]
			}
		},
		{
			id: 'screenshots',
			label: 'Screenshots',
			icon: 'camera-20',
			form: {
			}
		},
		{
			id: 'notes',
			label: 'Notes',
			icon: 'edit-78',
			form: {
			}
		},
		{
			id: 'bindings',
			label: 'Bindings',
			icon: 'favourite-31',
			form: {
				groups: [
					{
						label: 'Bindings',
						fields: [
							{
								label: 'Screenshot shortcut',
								key: 'screenshot',
								type: 'accelerator',
								modifierRequired: true,
							},
							{
								label: 'Clipboard shortcut',
								key: 'clipboard',
								type: 'accelerator',
								modifierRequired: true,
							},
							{
								label: 'Note shortcut',
								key: 'notes',
								type: 'accelerator',
								modifierRequired: true,
							},
						]
					}
				]
			}
		},
	],

	browserWindowOpts: {
		'title': 'Preferences',
		'width': 900,
		'maxWidth': 1000,
		'height': 700,
		'maxHeight': 1000,
		'resizable': false,
		'maximizable': false,
	},
	css: 'src/screens/assets/settings/style.css',
	debug: false,
});

module.exports = Preferences;