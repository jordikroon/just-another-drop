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
		notes: {
			gistAuthKey: null,
		},
		screenshots: {
			provider: null,
			awsAccessKeyId: null,
			awsSecretAccessKey: null,
			awsS3Bucket: null,
			awsDefaultRegion: null,
			awsBaseUrl: null,
			restUploadPath: null,
        }
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
				groups: [
					{
						label: 'Screenshots',
						fields: [
							{
								'label': 'Provider',
								'key': 'provider',
								'type': 'dropdown',
								'options': [
									{ 'label': 'AWS', 'value': 'aws' },
									{ 'label': 'Rest', 'value': 'rest' },
								],
							},
						]
					},
					{
						label: 'AWS Provider Configuration',
						fields: [
							{
								label: 'AWS Access Key ID',
								key: 'awsAccessKeyId',
								type: 'text',
							},
							{
								label: 'AWS Secret Access Key',
								key: 'awsSecretAccessKey',
								type: 'text',
							},
							{
								label: 'AWS S3 Bucket',
								key: 'awsS3Bucket',
								type: 'text',
							},
							{
								label: 'AWS Default Region',
								key: 'awsDefaultRegion',
								type: 'text',
							},
							{
								label: 'Base URL',
								key: 'awsBaseUrl',
								type: 'text',
							},
						]
					},
					{
						label: 'REST Provider Configuration',
						fields: [
							{
								label: 'REST Upload path',
								key: 'restUploadPath',
								type: 'text',
							},
						]
					}
				]
			}
		},
		{
			id: 'notes',
			label: 'Notes',
			icon: 'edit-78',
			form: {
				groups: [
					{
						label: 'Notes',
						fields: [
							{
								'heading': 'Generate token',
								'content': '<p>Go to Developer Settings and generate a <a style="color:white" onclick="javascript:require(\"shell\").openExternal(\"https://www.google.com\")" href="https://github.com/settings/tokens/new?description=drop-v3&scopes=gist" target="_blank">Personal Access Token</a>.<br>Select a long or no expiration time.</p>',
								'type': 'message',
							},
							{
								label: 'Github personal token',
								key: 'gistAuthKey',
								type: 'text',
							},
						]
					}
				]
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
		title: 'Preferences',
		width: 900,
		maxWidth: 1000,
		height: 700,
		maxHeight: 1000,
		resizable: false,
		maximizable: false,
		minimizable: false
	},
	css: 'src/screens/assets/settings/style.css',
	debug: false,
});

module.exports = Preferences;