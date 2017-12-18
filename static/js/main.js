let Application = PIXI.Application;

$(document).ready(function(){
	let app = new Application({width: 2000, height:500});
	document.body.appendChild(app.view);
});