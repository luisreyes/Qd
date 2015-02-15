var qd = qd || {};
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