#WebGL基础学习篇（Lesson 1）
____

>2007年，Vladimir Vukicevic， 一个塞尔维亚裔美国软件工程师开始编写一个名为Canvas 3D的OpenGL原型，以适用于即将到来的canvas元素上。2011年3月，他的工作指引着Kronos Group（一个OpenGL背后的非盈利组织）创建了WebGL：一个允许浏览器使用GPU的规范。

###浏览器需求
* Firefox 4.0 or above
* Google Chrome 11 or above
* Safari(OSX 10.6 or above)
* Opera 12 or above

###创建一个Canvas
	<canvas id="canvas-element-id" width="800" height="600">
	Your browser does not support HTML5
	</canvas>
	
###获取WebGL上下文环境
	<script>
		var gl = null;
		function getGLContext() {
			var canvas = document.getElementById("canvas-element-id");
			if (canvas != null) {
				var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
				for (var i = 0; i < names.length; i++) {
					try {
						gl = canvas.getContext(names[i]);					} catch(e) {}
					if (gl) {
						break;					}				}			}		}
	</script>
	
###WebGL是一个状态机
一个WebGL上下文可以被理解为一个状态机：一旦你修改了某个属性，除非你再次修改它否则这个属性会一直保持下来。  
>[示例1：改变Canvas的颜色](https://github.com/fem-d/webGL/blob/master/chapter1/ex1-1.html)