'use strict';
/*! qd - v0.0.0 - 2015-02-15 */
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

	var model, buttons, language, saveModel,
	isDirty = false,
	isTriedToSave = false,
	isValidAll = false,
	fields,
	arrFields = [],
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
		
		setSelected(0);
		setGlobalStyles();
		setSaveModel();
	}

	function updateIsDirty(){
		
		var tempModel = {
			title: fields.title.input.value,
			phone: fields.phone.input.value,
			message: fields.message.input.value
		};

		isDirty = (JSON.stringify(tempModel) !== JSON.stringify(saveModel));
	}

	function bindings(){
		
		language = navigator.language.substr(3,2);
		
		model = document.querySelector('template[is="auto-binding"]');
		
		model.views = {};
		model.isAdd = false;
		model.isEdit = false;
		model.views.titles = ['Dashboard', 'Create', 'Edit', 'Settings', 'About' ];

		init();

		model.go = function(e,d,s){
			var viewId = s.getAttribute('view');
			setSelected(viewId);
		};

		model.back = function(){
			
			if(!model.views.node) {model.views.node = document.querySelector('#app-views'); }
			// Go to dashboard
			setSelected(0);
		};

		model.save = function(){
			onSave();
		};

		model.validate = function(e,d,s){
			validate(s);
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
		
	}



	function setSelected(index){

		if(isDirty){
			
			confirmExit(model.selected, parseInt(index));

		}else{

			model.selected = parseInt(index);
			
			switch(model.selected){

				case 1:
					model.isAdd = true;
					if(!fields){ setFields(); }
					resetValidations();
					break;

				case 2:
					model.isEdit = true;
					if(!fields){ setFields(); }
					resetValidations();
					break;
				
				default:
					model.isAdd = false;
					model.isEdit = false;
					isDirty = false;
					isTriedToSave = false;
					break;
			}

		}

	}

	function confirmExit(from, to){

		if(!buttons){bindButtons();}
		
		var dialog = document.querySelector('#addEdit-confirm-exit');
		dialog.open();
		console.log('To: '+ to +' From: '+ from);

	}

	function setSaveModel(model){
		if(!model){

			saveModel = {};
			
			arrFields.forEach( function(e){
				saveModel[e] = '';
			});

		}else{
			saveModel = model;
		}
	}

	function setFields(){
		fields = {};
		arrFields = ['title', 'phone', 'message'];
		
		for(var i = 0; i <= arrFields.length; i++){
			var currFieldTitle = arrFields[i];
			fields[currFieldTitle] = {};
			fields[currFieldTitle].decorator = document.querySelector('#addEdit-'+currFieldTitle+'-decorator');
			fields[currFieldTitle].input = document.querySelector('#addEdit-'+currFieldTitle+'-input');
		}
	}

	function setButtons(){
		buttons = {
			addEdit: {
				cancel: document.querySelector('#addEdit-button-dialog-cancel'),
				discard: document.querySelector('#addEdit-button-dialog-discard')
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


	}

	function setGlobalStyles(){
		CoreStyle.g.paperInput.labelColor = colors.primaryTextColor;
		CoreStyle.g.paperInput.focusedColor = colors.accentColor;
		CoreStyle.g.paperInput.invalidColor = colors.error;
	}

	function onSave(){
		isTriedToSave = true;
		validateAll();

		if(isValidAll){
			
			setSaveModel(getValuesFromFields());

			save();
		}


	}



	function save(){
		console.log('SAVE ENTRY');
		console.log(saveModel);
		document.querySelector('#dashboardTA').value = JSON.stringify(saveModel);
		isDirty = false;
		setSelected(0);
	}

	function validateAll(){

		blurAllFields();

		isValidAll = true;
		
		arrFields.forEach( function(e){
			
			// Validate each field
			if(e !== 'phone'){
				//Regular Item validation
				fields[e].decorator.isInvalid = !fields[e].input.validity.valid;
			}else{
				// Special validation for phone
				fields[e].decorator.isInvalid = !isValidNumber(fields[e].input.value, language);
			}

			// If any invalid field... set to false to avoid save
			if(fields[e].decorator.isInvalid) { isValidAll = false; }
			
		});
	}

	function getValuesFromFields(){
		var model = {};
		arrFields.forEach( function(e){
			model[e] = fields[e].input.value;
		});

		return model;
	}

	function blurAllFields(){
		arrFields.forEach( function(e){
			fields[e].input.blur();
		});
	}

	function clearAllFields(){
		arrFields.forEach( function(e){
			fields[e].input.value = '';
			fields[e].decorator.updateLabelVisibility();
		});
		
		resetValidations();
	}

	function resetValidations(){
		arrFields.forEach( function(e){
			fields[e].decorator.isInvalid = false;
		});
	}

	function validate(input){
		if(input.value){
			var type = input.getAttribute('type'),
			decorator = input.parentNode.localName === 'paper-input-decorator' ? input.parentNode : input.parentNode.parentNode;
			
			decorator.isInvalid = type === 'tel' ? !isValidNumber(input.value, language) : !input.validity.valid;
		}
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