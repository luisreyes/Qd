'use strict';
/*! qd - v0.0.0 - 2015-02-17 */
// Source: dev/scripts/qd.js
var qd = {};
qd.core = (function() {
	'use strict';
	
	function init(){
		qd.actions.bindings();
	}

	return {
		init: init
	};

})();
// Source: dev/scripts/qd.actions.js
qd.actions = (function(){
	'use strict';

	var model,
	buttons,
	language,
	saveModel,
	toast,
	fields,
	currentGuid,
	repeatCtrl,
	repeatInput,
	pageName,
	isDirty = false,
	isTriedToSave = false,
	isValidAll = false,
	fieldTypes = [],
	colors = {
		darkPrimaryColor: '#0288D1',
		defaultPrimaryColor: '#03A9F4',
		lightPrimaryColor: '#B3E5FC',
		textPrimaryColor: '#FFFFFF',
		accentColor: '#FFC107',
		primaryTextColor: '#212121',
		secondaryTextColor: '#727272',
		dividerColor: '#B6B6B6',
		error: '#F44336'
	};

	function init(){
		
		updateEntryList();
		setSelected(0);
		setGlobalStyles();
	}

	function updateIsDirty(){
		
		var tempModel = getValuesFromFields();

		isDirty = (JSON.stringify(tempModel) !== JSON.stringify(saveModel));
	}

	function bindings(){
		
		language = navigator.language.substr(3,2);
		
		model = document.querySelector('template[is="auto-binding"]');
		
		model.views = {};
		model.isAdd = false;
		model.isEdit = false;
		//model.repeat = 'None';
		model.toast = { message: 'Hello', type: 'info'};
		model.views.titles = ['Dashboard', 'Create', 'Edit', 'Settings', 'About' ];
		
		init();

		model.go = function(e,d,s){
			var viewId = s.getAttribute('view');
			setSelected(viewId, s);
		};

		model.back = function(){
			
			if(!model.views.node) {model.views.node = document.querySelector('#app-views'); }
			// Go to dashboard
			setSelected(0);
		};

		model.save = function(){
			onSave();
		};

		model.delete = function(){
			onDelete();
		};

		model.validate = function(e,d,s){
			validate(s);
		};

		model.contacts = function(){
			onGetContacts();
		};

		model.toggle = function(){
			this.isActive = this.isActive ? false : true;
			
			if(!this.isActive){
				callToast('Message will not be sent', 'warning');
			}

			updateIsDirty();
		};

		model.input = function(e,d,s){

			// Check if Input if Phone and Run Format
			if( s.getAttribute('type') === 'tel' ){ s.value = formatLocal(language, s.value); }

			// After having tried to save auto validate
			if(isTriedToSave){
				validate(s);
			}

			// Update isDirty Flag
			updateIsDirty();
		};

		model.openRepeatDialog = function(){
			model.repeat = fields[pageName].repeat.input.value.toLowerCase();
			repeatDialog();
		};

		model.setrepeat = function(e,d,s){
			var selectedValue = s.getAttribute('label');
			fields[pageName].repeat.input.value = selectedValue;
			fields[pageName].repeat.decorator.updateLabelVisibility(selectedValue);
			repeatCtrl.close();
			updateIsDirty();
		};
		
	}

	function updateEntryList(){
		var list = [];
			
		for (var i = localStorage.length - 1; i >= 0; i--) {
			var guid = localStorage.key(i);
			list.push( JSON.parse( localStorage.getItem(guid) ) );
		}

		model.activelist = list;

	}

	function setSelected(index, element){

		if(isDirty){
			
			confirmExit();

		}else{

			model.selected = parseInt(index);
			
			switch(model.selected){

				case 1:
					if(!fields){ setFields(); }
					pageName = 'add';
					resetForNewEntry();
					model.isAdd = true;
					break;

				case 2:
					if(!fields){ setFields(); }
					pageName = 'edit';
					resetValidations();
					currentGuid = element.getAttribute('guid');
					setEditFIelds(currentGuid);
					model.isEdit = true;
					break;
				
				default:
					model.isAdd = false;
					model.isEdit = false;
					break;
			}

		}

	}

	function setEditFIelds(guid){
		var editModel = JSON.parse(localStorage.getItem(guid));
		
		fieldTypes.forEach( function(e){
			fields[pageName][e].input.value = editModel[e];
			
			if(e !== 'guid') {
				fields[pageName][e].decorator.updateLabelVisibility(editModel[e]);
			}

		});

		model.isActive = editModel.isactive;

	}

	function resetForNewEntry(){
		isDirty = false;
		isTriedToSave = false;
		model.isActive = true;
		resetValidations();
		blurAllFields();
		clearAllFields();
		setNewGuid();
		resetDateTime();
	}

	function resetDateTime(){
		fields[pageName].date.input.placeholder = 'Date';
		fields[pageName].time.input.placeholder = 'Time';
	}

	function setNewGuid(){
		fields[pageName].guid.input.value = guid();
	}

	function confirmExit(){

		if(!buttons){bindButtons();}
		
		var dialog = document.querySelector('#addEdit-confirm-exit');
		navigator.vibrate([50,50,50]);
		dialog.open();

	}

	function confirmDelete(){

		if(!buttons){bindButtons();}
		
		var dialog = document.querySelector('#addEdit-confirm-delete');
		navigator.vibrate([50,50,50]);
		dialog.open();

	}

	function repeatDialog(){
		repeatCtrl = document.querySelector('#addEdit-select-repeat');
		repeatInput = document.querySelector('#addEdit-select-input');
		repeatCtrl.open();
		//debugger;
	}

	function callToast(message, type){
		if(!toast){ toast = document.querySelector('#app-toast'); }

		model.toast.message = message;
		model.toast.icon = getIconType(type);
		model.toast.type = type;
		

		toast.show();
	}

	function getIconType(type){
		var val;
		switch(type){
			case 'success':
				val = 'check-circle';
				break;
			case 'info':
				val = 'info';
				break;
			case 'warning':
				val = 'warning';
				break;
			case 'error':
				val = 'cancel';
				break;
			default:
				val = '';
				break;
		}

		return val;
	}


	function setSaveModel(model){
		if(!model){

			saveModel = {};
			
			fieldTypes.forEach( function(e){
				saveModel[e] = '';
			});

			saveModel.isactive = true;
			saveModel.repeat = 0;

		}else{
			saveModel = model;
		}
	}

	function setFields(){
		fields = { add:{}, edit:{} };
		fieldTypes = ['guid', 'title', 'phone', 'message', 'date', 'time', 'repeat'];
		
		var i = 0,
		currFieldTitle = null;
		
		for(i; i < fieldTypes.length; i++){

			currFieldTitle = fieldTypes[i];
			
			fields.add[currFieldTitle] = {};
			fields.edit[currFieldTitle] = {};
			
			if(currFieldTitle !== 'guid') {
				fields.add[currFieldTitle].decorator = document.querySelector('#add-'+currFieldTitle+'-decorator');
				fields.edit[currFieldTitle].decorator = document.querySelector('#edit-'+currFieldTitle+'-decorator');
			}
			
			fields.add[currFieldTitle].input = document.querySelector('#add-'+currFieldTitle+'-input');
			fields.edit[currFieldTitle].input = document.querySelector('#edit-'+currFieldTitle+'-input');
		}
	}

	function setButtons(){
		buttons = {
			addEdit: {
				cancel: document.querySelector('#addEdit-button-dialog-cancel'),
				discard: document.querySelector('#addEdit-button-dialog-discard'),
				delete: document.querySelector('#addEdit-button-dialog-delete')
			}
		};
	}

	function bindButtons(){

		setButtons();

		document.addEventListener('backbutton', function(){
			// Go to dashboard
			setSelected(0);
		}, false);

		buttons.addEdit.discard.addEventListener('touchend', function(){
			isDirty = false;
			model.back();
			blurAllFields();
			clearAllFields();
		});

		buttons.addEdit.delete.addEventListener('touchend', function(){
			deleteEntry();
		});


	}

	function setGlobalStyles(){
		CoreStyle.g.paperInput.labelColor = colors.primaryTextColor;
		CoreStyle.g.paperInput.focusedColor = colors.darkPrimaryColor;
		CoreStyle.g.paperInput.invalidColor = colors.error;
	}

	function onSave(){
		isTriedToSave = true;
		validateAll();

		if(isValidAll){
			setSaveModel(getValuesFromFields());
			save();
		}else{
			navigator.vibrate([50,50,50]);
			callToast('Required fields are not correct', 'error');
		}

	}


	function onDelete(){
		confirmDelete();

	}


	function save(){
		
		// Save to localStorage
		localStorage.setItem( saveModel.guid, JSON.stringify( saveModel ) );
		updateEntryList();
		isDirty = false;
		setSelected(0);

		setTimeout(function(){
			callToast('Message Saved', 'success');
		},250);
	}

	function deleteEntry(){
		// Remove to localStorage
		localStorage.removeItem( currentGuid );
		updateEntryList();
		isDirty = false;
		blurAllFields();
		clearAllFields();
		setSelected(0);

		setTimeout(function(){
			callToast('Message Deleted', 'info');
		},250);
		
		
	}

	function validateAll(){

		blurAllFields();

		isValidAll = true;
		fieldTypes.forEach( function(e){
			if(e !== 'guid'){

				if(fields[pageName][e].input.hasAttribute('required')){
					// Validate each field
					if(e !== 'phone'){
						//Regular Item validation
						fields[pageName][e].decorator.isInvalid = !fields[pageName][e].input.validity.valid;
					}else{
						// Special validation for phone
						fields[pageName][e].decorator.isInvalid = !isValidNumber(fields[pageName][e].input.value, language);
					}
				}
				
				// If any invalid field... set to false to avoid save
				if(fields[pageName][e].decorator.isInvalid) { isValidAll = false; }
			}
		});
	}

	function getValuesFromFields(){
		var sm = {};

		fieldTypes.forEach( function(e){
			sm[e] = fields[pageName][e].input.value;
		});

		sm.isactive = model.isActive;
		return sm;
	}

	function onGetContacts(){
		
		// Invoke Contacts from the phone
		navigator.contacts.pickContact(function(contact){
			
			var pickedPhone = formatLocal(language, contact.phoneNumbers[0].value);
			fields[pageName].phone.input.value = pickedPhone;
			fields[pageName].phone.decorator.updateLabelVisibility();

		},
			function(err){
				console.log('Error: ' + err);
			}
		);
	}

	function blurAllFields(){
		fieldTypes.forEach( function(e){
			if(fields[pageName][e].input){
				fields[pageName][e].input.blur();
			}
		});
	}

	function clearAllFields(){
		fieldTypes.forEach( function(e){
			fields[pageName][e].input.value = '';
			if(e !== 'guid') { fields[pageName][e].decorator.updateLabelVisibility(); }
		});
		
		resetValidations();
	}

	function resetValidations(){
		fieldTypes.forEach( function(e){
			if(e !== 'guid'){ fields[pageName][e].decorator.isInvalid = false; }
		});
	}

	function validate(input){
		if(input.value){
			var type = input.getAttribute('type'),
			decorator = input.parentNode.localName === 'paper-input-decorator' ? input.parentNode : input.parentNode.parentNode;
			
			decorator.isInvalid = type === 'tel' ? !isValidNumber(input.value, language) : !input.validity.valid;
		}
	}

	function guid() {
		
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}

		return s4() + s4();
	}

	return {
		bindings: bindings
	};
})();
// Source: dev/scripts/qd.animations.js
qd.animations = (function(){
	'use strict';
	
	var fadeout = function(node){
		var animation = document.getElementById('animation-fadeout');
		animation.target = node;
		animation.play();
	};

	return {
		fadeout: fadeout
	};
})();