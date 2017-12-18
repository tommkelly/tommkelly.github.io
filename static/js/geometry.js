function Point(x, y){
	this.x = x;
	this.y = y;
	this.pix = null;
}

function Segment(a, b){
	this.a = a;
	this.b = b;
	this.pix = null;
}

function Hull(){
	this.edges = [];
	this.vertices = [];
	this.utangent = -1;
	this.ltangent = -1;
}

function ORIENT(a, b, c){
	return -(b.x*c.y + a.x*b.y + a.y*c.x - b.x*a.y - c.x*b.y - c.y*a.x);
}