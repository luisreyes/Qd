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