(function(target) {

	var KartRenderer = function() {
		this.player = { x: 64, y: 64, direction: 0 };
		this.width = 320;
		this.height = 240;
		this.fog = 1;
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

	var zmul = 120;
	var zadd = 0;
	var zzmul = 1;

	KartRenderer.prototype._project = function(p, head) {
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
		var u2 = uv.u * Math.sin(a) - uv.v * Math.cos(a);
		var v2 = uv.u * Math.cos(a) + uv.v * Math.sin(a);
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
		var data = context.getImageData(0,0,320,240);
		var lines = 120;
		for (var i=0; i<lines; i++) {
			// var inorm = i / lines;
			var bri = 255 - i * 1.7;
			var y = 240 - i;
			var uv0 = this._planeuv(-160, lines-i, -120, this.player.z);
			var uv1 = this._planeuv(160, lines-i, -120, this.player.z);
			uv0 = this._rotateuv(uv0, -this.player.direction-180);
			uv1 = this._rotateuv(uv1, -this.player.direction-180);
			uv0 = this._offsetuv(uv0, { u: this.player.x, v: this.player.y });
			uv1 = this._offsetuv(uv1, { u: this.player.x, v: this.player.y });
			this._texline(data, 0, y, 320, uv0.u, uv0.v, uv1.u, uv1.v, bri);
		}
		context.putImageData(data, 0, 0);
	}

	KartRenderer.prototype.renderMap = function(context) {
		var data = context.getImageData(0,0,100,100);
		var fov = 45;
		var rr = 150 + 125 * Math.sin(time * 3.0);
		var rr2 = 150 + 125 * Math.cos(time * 2.6);
		for (var i=0; i<100; i++) {
			var bri = 255 - i * 2;
			var uc = this.player.x + ((i-50) * Math.cos(this.player.direction * Math.PI / 180.0));
			var vc = this.player.y + ((i-50) * Math.sin(this.player.direction * Math.PI / 180.0));
			var ux = 64 * Math.cos((this.player.direction + 90) * Math.PI / 180.0);
			var vx = 64 * Math.sin((this.player.direction + 90) * Math.PI / 180.0);
			var y = 100 - i;
			var a0 = this.player.direction - fov;
			var a1 = this.player.direction + fov;
			var u0 = uc - ux;
			var v0 = vc - vx;
			var u1 = uc + ux;
			var v1 = vc + vx;
			this._texline(data, 0, 99 - i, 100, u0,v0, u1,v1, bri);
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
		x += 160;
		y += 120;
		return {
			x: x,
			y: y,
			scale: sp.scale,
			visible: sp.visible
		}
	}

	target.KartRenderer = KartRenderer;

})(typeof(exports) != 'undefined' ? exports : this);