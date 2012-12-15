(function(target) {

	var KartRenderer = function() {
		this.player = { x: 64, y: 64, direction: 0 };
		this.width = 320;
		this.height = 240;
		// this.fov = 90;
		this.fog = 0.5;
		this.texturepixels = [];
	}

	KartRenderer.prototype.setFloor = function(context) {
		var texturedata = context.getImageData(0, 0, 256, 256);
		this.texturepixels = texturedata.data;
	}

	KartRenderer.prototype._planeuv = function(dx, dy, dz, head) {
		var dl = Math.sqrt(dx*dx + dy*dy + dz*dz);

		var direction = {
			x: dx / dl,
			y: dy / dl,
			z: dz / dl
		};

		var origin = {
			x: 0,
			y: head,
			z: 0
		};

		var pointOnPlane = {
			x: 0,
			y: 0,
			z: 0
		}

		var planeNormal = {
			x: 0,
			y: -1,
			z: 0
		}

		var a = direction.x * planeNormal.x
				+ direction.y * planeNormal.y
				+ direction.z * planeNormal.z;

    var t = ((pointOnPlane.x * planeNormal.x
    	+ pointOnPlane.y * planeNormal.y
    	+ pointOnPlane.z * planeNormal.z
    	- planeNormal.x * origin.x
    	- planeNormal.y * origin.y
    	- planeNormal.z * origin.z)) / a;

    var P = {
			x: origin.x + (t * direction.x),
			y: origin.y + (t * direction.y),
			z: origin.z + (t * direction.z),
		};

		return {
			u: P.x,
			v: P.z,
			t: t
		}
	}

	KartRenderer.prototype._project = function(p, head) {
		var zmul = this.height / 2;
		var zadd = 0;
		var zzmul = 1;//  * this.fov / 90;

		var mul = zmul / (zadd + p.z * zzmul);
		var x = p.x * mul;
		var y = (p.y + head) * mul;
		return {
			x: -x,
			y: y,
			scale: mul / 1.0,// / (p.z / 150),
			visible: p.z > 0
		}
	}

	KartRenderer.prototype._texline = function(target, x, y, width, u0,v0, u1,v1, bri) {
		var o = (y * target.width) << 2;
		var u = u0;
		var v = v0;
		var ud = (u1 - u0) / width;
		var vd = (v1 - v0) / width;
		var i = width;
		while(i--) {
			var uc = (Math.floor(u) + 512) % 256;
			var vc = (Math.floor(v) + 512) % 256;
			var o2 = ((vc * 256)+uc) * 4;
 			target.data[o++] = (this.texturepixels[o2++] * bri) >> 8;
 			target.data[o++] = (this.texturepixels[o2++] * bri) >> 8;
 			target.data[o++] = (this.texturepixels[o2++] * bri) >> 8;
 			target.data[o++] = 255;
 			u += ud;
 			v += vd;
 		}
	}

	KartRenderer.prototype._rotateuv = function(uv, r) {
		var a = r * Math.PI / 180.0;
		var u2 = uv.u * Math.cos(a) - uv.v * Math.sin(a);
		var v2 = uv.v * Math.cos(a) + uv.u * Math.sin(a);
		return {
			u: u2,
			v: v2
		}
	}

	KartRenderer.prototype._offsetuv = function(uv, delta) {
		uv.u += delta.u;
		uv.v += delta.v;
		return uv;
	}

	KartRenderer.prototype.render = function(context) {
		var data = context.getImageData(0,0,this.width,this.height);
		var lines = this.height / 2;
		for (var i=0; i<lines; i++) {
			var bri = 255 - 255 * i * this.fog / lines;
			var y = this.height - i;
			var uvc = this._planeuv(0, lines-i, -this.height / 2, this.player.z);
			// var uv0 = uvc;
			// var uv1 = uvc;
			// uv0 = this._rotateuv(uv0, -this.fov/2);
			// uv1 = this._rotateuv(uv1, this.fov/2);
		 	var uv0 = this._planeuv(-this.width / 2, lines-i, -this.height / 2, this.player.z);
			var uv1 = this._planeuv(this.width / 2, lines-i, -this.height / 2, this.player.z);
			uv0 = this._rotateuv(uv0, -this.player.direction-0);
			uv1 = this._rotateuv(uv1, -this.player.direction-0);
			uv0 = this._offsetuv(uv0, { u: this.player.x, v: this.player.y });
			uv1 = this._offsetuv(uv1, { u: this.player.x, v: this.player.y });
			this._texline(data, 0, y, this.width, uv0.u, uv0.v, uv1.u, uv1.v, bri);
		}
		context.putImageData(data, 0, 0);
	}

	KartRenderer.prototype.project = function(x, y, z) {
		var uv0 = {
			u: x,
			v: z
		};
		uv0 = this._offsetuv(uv0, { u: -this.player.x, v: -this.player.y });
		uv0 = this._rotateuv(uv0, this.player.direction);
		var x = uv0.u;
		var y = y;
		var z = uv0.v;
		var world = {
			x: x,
			y: y,
			z: z
		}
		var sp = this._project(world, this.player.z);
		var	x = sp.x;
		var	y = sp.y;
		x += this.width / 2;
		y += this.height / 2;
		return {
			x: x,
			y: y,
			scale: sp.scale,
			visible: sp.visible
		}
	}

	target.KartRenderer = KartRenderer;

})(typeof(exports) != 'undefined' ? exports : this);