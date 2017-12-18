let Application = PIXI.Application;
let Graphics = PIXI.Graphics;
let PIXI_WIDTH = 2000;
let PIXI_HEIGHT = 500;
let RANDOM_POINTS = 15;
let SLEEP_TIME = 500;

function mod(n, m) {
        return ((n % m) + m) % m;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeClickable(stage, pointList){
	let clickPlane = new Graphics();
	clickPlane.beginFill(0x000000);
	clickPlane.drawRect(0,0,PIXI_WIDTH,PIXI_HEIGHT);
	clickPlane.endFill();
	clickPlane.alpha = 0;
	clickPlane.interactive = true;
	clickPlane.on("click", function(mouseData) {
		let pos = mouseData.data.getLocalPosition(mouseData.target);
		let x = pos.x;
		let y = pos.y;
		addPoint(x, y, pointList, stage);
	});
	stage.addChild(clickPlane);
}

function randomPoints(count, pointList, stage) {
	for (let i = 0; i < count; ++i){
		let x = Math.random() * PIXI_WIDTH;
		let y = Math.random() * PIXI_HEIGHT;
		addPoint(x, y, pointList, stage);
	}
}

function drawSegment(a, b, color, stage){
	//console.log("got here");
	let line = new Graphics();
	line.lineStyle(4, color, 1);
	line.moveTo(0, 0);
	line.lineTo(b.x-a.x, b.y-a.y);
	line.x = a.x;
	line.y = a.y;
	stage.addChild(line);
	return line
}

function addPoint(x, y, pointList, stage) {
	let p = new Point(x, y);
	p.pix = new Graphics();
	
	let circle = p.pix;
	circle.beginFill(0xFF0000);
	circle.drawCircle(x, y, 5);
	circle.endFill();

	if (typeof stage !== undefined) {
		stage.addChild(circle);
	}
	if (typeof pointList !== undefined) {
		pointList.push(p);
	}
	return p;
}

async function mergeHull(pointList, stage){
	pointList.sort(function(a,b){return a.x - b.x;})
	await mergeHullHelper(pointList, stage, 0, pointList.length-1);
}

function threeHull(pointList, stage, i, j){
	let hull = new Hull();
	if ((j - i + 1) == 2){
		let a = pointList[i];
		let b = pointList[j];
		
		let ab = new Segment(a, b);
		ab.pix = drawSegment(a, b, 0x00FF00, stage);
		let ba = new Segment(b, a);
		ba.pix = drawSegment(b, a, 0x00FF00, stage);

		hull.vertices = [a, b];
		hull.edges = [ab, ba];
	}
	else if ((j - i + 1) == 3){
		let a = pointList[i];
		let b = pointList[i+1];
		let c = pointList[j];
		if (ORIENT(a, b, c) < 0){
			let temp = b;
			b = c;
			c = temp;
		}
		let ab = new Segment(a, b);
		ab.pix = drawSegment(a, b, 0x00FF00, stage);
		let bc = new Segment(b, c);
		bc.pix = drawSegment(b, c, 0x00FF00, stage);
		let ca = new Segment(c, a);
		ca.pix = drawSegment(c, a, 0x00FF00, stage);

		hull.vertices = [a, b, c];
		hull.edges = [ab, bc, ca];
	}
	return hull;
}

async function mergeHullHelper(pointList, stage, i, j){
	i = Math.max(0, i);
	j = Math.min(pointList.length-1, j);
	//console.log("called with "+i+"and "+j);
	//console.log("about to await");
	//console.log("awaited");
	for (let k = 0; k < pointList.length; ++k){
		if (k >= i && k <= j){
			pointList[k].pix.beginFill(0x00FF00);
		}
		else {
			pointList[k].pix.beginFill(0xFF0000);
		}
		pointList[k].pix.drawCircle(pointList[k].x, pointList[k].y, 5);
		pointList[k].pix.endFill();
	}
	await sleep(SLEEP_TIME);
	if ((j - i + 1) <= 3){
		return threeHull(pointList, stage, i, j);
	}
	let mid = Math.trunc((j - i) / 2) + i;
	let ha = await mergeHullHelper(pointList, stage, i, mid);
	let hb = await mergeHullHelper(pointList, stage, mid+1, j);
	let hull = await merge(ha, hb, stage);
	return hull;
}

async function merge(hulla, hullb, stage) {
	// /let utangent = await upperTangent(hulla, hullb, pointList, stage, i, mid, j);
	let ltangent = await lowerTangent(hulla, hullb, stage);
	let utangent = await upperTangent(hulla, hullb, stage);

	stage.removeChild(ltangent.pix);
	ltangent.pix = drawSegment(ltangent.a, ltangent.b, 0x00FF00, stage);
	stage.removeChild(utangent.pix);
	utangent.pix = drawSegment(utangent.a, utangent.b, 0x00FF00, stage);

	spliceHull(hulla, stage, true);
	spliceHull(hullb, stage, false);

	hulla.edges.push(ltangent);
	hulla.edges = hulla.edges.concat(hullb.edges);
	hulla.edges.push(utangent);

	hulla.vertices = hulla.vertices.concat(hullb.vertices);
	console.log(hulla);
	return hulla;
}

function spliceHull(hull, stage, left) {
	let start = hull.utangent;
	let end = hull.ltangent;
	if (left){
		start = hull.ltangent;
		end = hull.utangent;
	}
	if (start !== end){
		let i = start;
		while (i !== end){
			stage.removeChild(hull.edges[i].pix);
			i = mod(i+1, hull.edges.length);
		}
		let newEdges = [];
		let newVertices = [];
		while (i !== start){
			newEdges.push(hull.edges[i]);
			newVertices.push(hull.vertices[i]);
			i = mod(i+1, hull.edges.length);
		}
		newVertices.push(hull.vertices[start]);
		hull.edges = newEdges;
		hull.vertices = newVertices;
		return hull;
	}
	else {
		for (let i = 0; i < hull.edges.length; ++i){
			stage.removeChild(hull.edges[i].pix);
		}
		hull.edges = [];
		let newVertices = [hull.vertices[start]];
		hull.vertices = newVertices;
		return hull;
	}
}

async function upperTangent(hulla, hullb, stage){
	hulla.utangent = rightmost(hulla);
	hullb.utangent = leftmost(hullb);
	let a = hulla.vertices[hulla.utangent];
	let b = hullb.vertices[hullb.utangent];
	let ab = new Segment(a, b);
	ab.pix = drawSegment(a, b, 0x0000FF, stage);
	await sleep(SLEEP_TIME);
	while(!(upperTangentCond(hulla, ab, true) && upperTangentCond(hullb, ab, false))){
		while (!upperTangentCond(hulla, ab, true)){
			stage.removeChild(ab.pix);
			hulla.utangent = mod((hulla.utangent + 1), hulla.vertices.length);
			//console.log(hulla.ltangent);
			a = hulla.vertices[hulla.utangent];
			ab = new Segment(a, b);
			ab.pix = drawSegment(a, b, 0x0000FF, stage);
			await sleep(SLEEP_TIME);
		}
		while (!upperTangentCond(hullb, ab, false)){
			stage.removeChild(ab.pix);
			hullb.utangent = mod((hullb.utangent - 1), hullb.vertices.length);
			b = hullb.vertices[hullb.utangent];
			ab = new Segment(a, b);
			ab.pix = drawSegment(a, b, 0x0000FF, stage);
			await sleep(SLEEP_TIME);
		}
	}
	return ab;
}

function upperTangentCond(hull, seg, left){
	if (left){
		let pi = mod((hull.utangent + 1), hull.vertices.length);
		let pj = mod((hull.utangent - 1), hull.vertices.length);
		let p1 = hull.vertices[pi];
		let p2 = hull.vertices[pj]
		//console.log(seg.b);
		//console.log(seg.a);
		//console.log(p); 
		return ORIENT(seg.b, seg.a, p1) > 0 && ORIENT(seg.b, seg.a, p2) > 0;
	}
	else {
		let pi = mod((hull.utangent - 1), hull.vertices.length);
		let pj = mod((hull.utangent + 1), hull.vertices.length);
		let p1 = hull.vertices[pi];
		let p2 = hull.vertices[pj];
		return ORIENT(p1, seg.b, seg.a) > 0 && ORIENT(p2, seg.b, seg.a) > 0;
	}
}

async function lowerTangent(hulla, hullb, stage){
	hulla.ltangent = rightmost(hulla);
	hullb.ltangent = leftmost(hullb);
	let a = hulla.vertices[hulla.ltangent];
	let b = hullb.vertices[hullb.ltangent];
	let ab = new Segment(a, b);
	ab.pix = drawSegment(a, b, 0x0000FF, stage);
	await sleep(SLEEP_TIME);
	while(!(lowerTangentCond(hulla, ab, true) && lowerTangentCond(hullb, ab, false))){
		while (!lowerTangentCond(hulla, ab, true)){
			stage.removeChild(ab.pix);
			hulla.ltangent = mod((hulla.ltangent - 1), hulla.vertices.length);
			//console.log(hulla.ltangent);
			a = hulla.vertices[hulla.ltangent];
			ab = new Segment(a, b);
			ab.pix = drawSegment(a, b, 0x0000FF, stage);
			await sleep(SLEEP_TIME);
		}
		while (!lowerTangentCond(hullb, ab, false)){
			stage.removeChild(ab.pix);
			hullb.ltangent = mod((hullb.ltangent + 1), hullb.vertices.length);
			b = hullb.vertices[hullb.ltangent];
			ab = new Segment(a, b);
			ab.pix = drawSegment(a, b, 0x0000FF, stage);
			await sleep(SLEEP_TIME);
		}
	}
	return ab;
}

function lowerTangentCond(hull, seg, left){
	if (left){
		let pi = mod((hull.ltangent + 1), hull.vertices.length);
		let pj = mod((hull.ltangent - 1), hull.vertices.length);
		let p1 = hull.vertices[pi];
		let p2 = hull.vertices[pj]
		//console.log(seg.b);
		//console.log(seg.a);
		//console.log(p); 
		return ORIENT(p1, seg.a, seg.b) > 0 && ORIENT(p2, seg.a, seg.b) > 0;
	}
	else {
		let pi = mod((hull.ltangent - 1), hull.vertices.length);
		let pj = mod((hull.ltangent + 1), hull.vertices.length);
		let p1 = hull.vertices[pi];
		let p2 = hull.vertices[pj];
		return ORIENT(seg.a, seg.b, p1) > 0 && ORIENT(seg.a, seg.b, p2) > 0;
	}
}

function leftmost(hull){
	let mini = 0;
	let minv = hull.vertices[0].x;
	for (let i = 0; i < hull.vertices.length; ++i){
		if (hull.vertices[i].x < mini){
			minv = hull.vertices[i].x;
			mini = i;
		}
	}
	return mini;
}

function rightmost(hull){
	let maxi = 0;
	let maxv = hull.vertices[0].x;
	for (let i = 0; i < hull.vertices.length; ++i){
		if (hull.vertices[i].x > maxi){
			maxv = hull.vertices[i].x;
			maxi = i;
		}
	}
	return maxi;
}

$(document).ready(function(){
	let app = new Application({width: PIXI_WIDTH, height:PIXI_HEIGHT});
	let stage = app.stage;
	let renderer = app.renderer;
	document.body.appendChild(app.view);
	let pointList = [];

	$("#random").click(function(e) {randomPoints(RANDOM_POINTS, pointList, stage);});
	$("#run").click(function(e) {mergeHull(pointList, stage)});

	makeClickable(stage, pointList);

});