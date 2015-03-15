# WebGL基础学习篇（Lesson 8）
___

> 选取（picking）是指通过点选的方式选择3D场景中的物体。最常用的设备就是鼠标。但是，选取同样也可以使用其他设备（如触屏或者触感设备）。在这章中我们会看到在WebGL中如何选取。

### 大纲

* 使用鼠标选取WebGL场景中的物体
* 创建并使用offscreen framebuffers
* 什么是renderbuffers，它们如何被framebuffers使用
* 从framebuffers中读取像素
* 使用颜色标签来实现基于颜色的物体选取

### Picking

事实上任何3D显卡程序都需要给用户提供与屏幕上场景交互的机制。比如，你写了这么一个游戏，你需要指向你的目标并施展动作。同样地，如果你写的是CAD程序，你会希望选取一个物体并修改它的属性。在这章中，我们会看到WebGL中这些基础交互的实现。

我们可以这样选择物体，从摄像机的角度（也就是视线）像场景中射入一条光线，计算光线经过了哪些物体。这被叫做光线投射算法（ray casting），它需要探测光线和物体的接触。但是，它非常复杂以至于我们不会在这个初学教程中详细介绍。取而代之的是，我们会使用基于物体颜色的选取。这个方法更易于实现而且也更利于大家了解选取的工作原理。

最基础的思想就是将每个物体都渲染成不同的颜色，并且将场景渲染到offscreen framebuffer中。接着，当用户点击屏幕时，我们使用offscreen framebuffer中的数据获取点击坐标对应的颜色。因为之前我们提前设置了物体颜色，我们可以判定是哪个物体被选中了并且赋予它相应的动作。下图描述了整个过程：

![](http://gtms01.alicdn.com/tps/i1/TB1rWCoHpXXXXXRXXXXtZE4FpXX-1236-952.png)

#### Setting up an offscreen framebuffer

在第二章我们看到framebuffer是WebGL渲染的终点。当你看屏幕时，其他就是在看framebuffer中的内容。

与渲染到默认framebuffer中不一样，我们还可以将场景渲染在屏幕之外。这也是选取（picking）的第一步。为此，我们需要创建一个framebuffer并告诉WebGL我们需要将它作为默认的。

为了创建一个framebuffer，我们至少需要用于保存颜色和深度信息。我们需要保存每个在framebuffer中的fragment的颜色，以此来创建图像；相对的，我们需要深度信息来保证重叠的物体保持一致。如果我们没有深度信息，那么就不能分辨出两个重叠的物体谁在前谁在后了。

我们使用一个纹理来存储颜色，使用renderbuffer来存储深度信息。

#### Creating a texture to store colors

创建纹理的方式相当简单，我们在上一章中已经讲过了。如果你不知道，那么可以看一下上一章的内容。

	var canvas = document.getElementById('canvas-element-id');
	var width = canvas.width;
	var height = canvas.height;
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
这里唯一的区别是我们并没有使用图像来绑定纹理，因此当我们调用<code>texImage2D</code>时，最后的参数是null。这样也是可以的，我们仅仅是声明了存储offscreen framebuffer的空间。

同时，需要注意的是，高度和宽度我们使用的是canvas的尺寸。

#### Creating a Renderbuffer to store depth information

Renderbuffers被用于为framebuffer中的buffer提供存储空间。深度buffer是renderbuffer的一个例子。它总是与screen framebuffer相关联，而screen framebuffer正是WebGL的默认渲染目标。

创建renderbuffer的代码是这样的：

	var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
	
代码的第一行创建了一个renderbuffer。和其他buffer一样，在使用前我们需要绑定它。第三行决定了renderbuffer的存储大小。

注意存储大小与纹理的大小一致。这样我们通过每个framebuffer中的fragment都能获取到一个颜色（存储在纹理中）和一个深度值（存储在renderbuffer中）。

#### Creating a framebuffer for offscreen rendering

我们需要创建一个framebuffer并将它和纹理以及renderbuffer绑定起来。我们看看如何执行。

首先，我们创建一个framebuffer：

	var framebuffer = gl.createFrameBuffer();
	
一如既往，我们需要绑定它：

	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	
绑定之后，使用以下方法绑定纹理：

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	
之后，绑定renderbuffer：

	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	
最后，我们再做点扫尾工作：

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
当之前创建的framebuffer解绑后，WebGL状态机会自动回去渲染screen framebuffer。

### Assigning one color per object in the scene

我们会根据颜色来选取物体。如果物体很善良或者有阴影那么通过它的颜色就不能统一。然而，我们是根据颜色来选取物体，因此我们需要保证每个物体的颜色是统一的。

我们可以在ESSL中设置<code>gl_FragColor</code>来告诉fragment shader使用物体散射属性来作为唯一颜色。这里我们假设每个物体都有一个独特的颜色。

物体统一了颜色后，我们要创建一个新的ESSL uniform来存储拾取颜色并保证它在所有offscreen framebuffer中渲染的物体是唯一的。这样，物体在屏幕上看着是一样的，但是在offscreen framebuffer中它们的颜色是唯一的。我们将在后面详细讲解。

例如，物体都有一个自己独特的颜色：
![](http://gtms03.alicdn.com/tps/i3/TB18KGjHpXXXXX9XFXX0HYu3XXX-644-450.png)

现在让我们看看如何使用我们创建的framebuffer来渲染offscreen的场景。

### Rendering to an offscreen framebuffer

为了实现通过offscreen framebuffer进行选取，每次onscreen更新时，offscreen都必须与onscreen同步。如果两者不同步，那么就会出现多余的物体或是少了物体等等，从而造成不一致的情况。

不一致的情况会阻碍我们读取offscreen framebuffer中的颜色，从而造成无法选取物体。这里选取颜色也是物体的标签。

为了实现同步，我们创建了<code>render</code>方法，这个方法中会调用两次<code>draw</code>函数。第一次是再offscreen buffer绑定时，第二次是onscreen的默认buffer绑定时。代码如下所示：

	function render() {
		// off-screen rendering
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.uniform1i(Program.uOffscreen, true);
		draw();
		
		// on-screen rendering
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.uniform1i(Program.uOffscreen, false);
		draw();	}
	
我们通过<code>uOffscreen</code>来告诉ESSL何时使用diffuse color。fragment shader的代码如下所示：

	void main(vode) {
		if(uOffscreen) {
			gl_FragColor = uMaterialDiffuse;
			return;		}
		...	}

下面的图表展示了<code>render</code>的行为：

![](http://gtms04.alicdn.com/tps/i4/TB14V7gGXXXXXXXaFXXGTyy9FXX-1094-698.png)

相应的，每次场景有变化时，我们都应该调用<code>render</code>而不再是<code>draw</code>函数了。

	var app = null;
	function runWebGLApp() {
		app = new WebGLApp("canvas-element-id");
		app.configureGLHook = configure;
		app.loadSceneHook = load;
		app.drawSceneHook = render;
		app.run();	}

我们同样需要更新摄像头交互所使用的函数钩子。原本它是被设置为<code>draw</code>函数的。因此如果我们不改变它，我们必须等待500ms，当<code>drawSceneHook</code>被调用时才同步，而这显然是不行的。

> 这里说的和代码有关，不懂的同学请阅读下webGL库。如果看到这里还读不懂代码的话，麻烦从头认真看起。

我们改变相应的<code>configure</code>方法：

	function configure() {
		...
		camera = new Camera(CAMERA_ORBITING_TYPE);
		camera.goHome([0, 0, 40]);
		camera.setFocus([0.0, 0.0, 0.0]);
		camera.hooRenderer = render;	}
	
### Cliking on the canvas

接下来我们需要在用户点击场景中的物体时获取鼠标的坐标，并且从offscreen framebuffer中读取具体的颜色值。

为此，我们需要使用canvas元素上的onmouseup事件：

	var canvas = document.getElementById('my-canvas-id');
	canvas.onmouseup = function(ev) {
		// capture coordinates from the ev event
		...	}
	
### Reading pixels from the offscreen framebuffer

我们现在可以去offscreen buffer读取对应坐标的颜色值了。
![](http://gtms04.alicdn.com/tps/i4/TB1mMSSGFXXXXb2apXXUxkTKVXX-1144-536.png)

WebGL允许我们使用<code>readPixels</code>来读取framebuffer中的值。
![](http://gtms02.alicdn.com/tps/i2/TB1qBTkGFXXXXcxaXXXwZClGXXX-1240-812.png)

记住WebGL是以状态机的方式工作的，而且只有在有效状态下操作才有效。因此我们必须确保offscreen framebuffer是当前绑定的。为此，我们需要使用<code>bindFramebuffer</code>来绑定，将所有要点结合起来，代码就是这样的：

	// read one pixel
	var readout = new Unit8Array(1*1*4);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.readPixels(coords.x, coords.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, readout);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
> 这里我们使用了1 * 1 * 4来表示读出值的大小。它的来源是1像素的宽度乘以高度乘以4个通道，也就是RGBA。

### Looking for hits

我们现在看看从offscreen framebuffer中取到的颜色是否能和场景中的物体对应上。记住我们使用了颜色作为物体标签。如果有物体匹配上了，我们称之为命中（hit），没有则叫丢失（miss）。

当查看命中时，我们将取到的颜色和各个物体的diffuse color比较。这里有个需要思考的地方：每个颜色通道范围都是[0, 255]，而diffuse color的范围是[0, 1]。因此，我们需要考虑到这点，使用<code>compare</code>函数：

	function compare(readout, color) {
		return (Math.abs(Math.round(color[0]*255) - readout[0]) <= 1 && Math.abs(Math.round(color[1]*255) - readout[1]) <= 1 && Math.abs(Math.round(color[2]*255) - readout[2]) <= 1);	}
	
这里我们将diffuse color扩大到[0, 255]，再在各通道上对比。注意我们并不需要比较alpha通道。如果我们有两个颜色相同但是alpha不同的物体，我们可以使用它做比较，但是这并不在我们这个场景的考虑范围内。

还要注意的是，比较并不是绝对准确的，因为我们处理的是[0, 1]这个范围内的小数。因此我们需要考虑细微的差别。当然这个魔法数字会影响整个实现。

现在我们只要遍历一遍场景中的所有物体来看是否命中。我们将使用两个辅助变量：found返回true表示有命中，pickedObject表示命中的物体。

	var pickedObject = null, ob = null;
	for(var i = 0, max = Scene.objects.length; i < max; i++) {
		ob = Scene.objects[i];
		if (compare(readout, ob.diffuse)) {
			pickedObject = ob;
			break;		}	}
	
### Processing hits

处理命中是一个很广泛的概念。它通常跟你的程序相关，比如你的程序是一个CAD程序，你可能想获取屏幕上物体的属性，也可能想移动它或者改变它的尺寸。相反，如果你在开发一个游戏，你可能想选取你的角色去战斗。这部分代码我们会留给读者自己去决定。然而，我们在之后提供了一个简单的例子，例子中你可以拖动物体。

现在让我们来看一个简单的例子：

[选取物体](http://gonghao.alidemo.cn/exercise/chapter8/ex8-1.html)

[<源码>](https://github.com/fem-d/webGL/blob/master/chapter8/ex8-1.html)

![](http://gtms02.alicdn.com/tps/i2/TB1MUjJGVXXXXc5aXXXA_zUJpXX-1460-812.png)

#### Picker architecture

下面的图详细说明了<code>Picker</code>对象所做的事情：

![](http://gtms03.alicdn.com/tps/i3/TB1Jvb7GFXXXXXDaXXXHxO_5pXX-1084-702.png)

在相应的用户操作环节都提供了不同的回调函数来实现具体的逻辑，详细的可以查看代码。

### Implementing unique object labels

如果一个场景中有多个相同颜色的物体，我们在前面提到的使用diffuse color来作为物体的标签这种方法就不适用了。在后面的实践中，我们将实现物体唯一标签。这些物体在offscreen framebuffer中将使用颜色标签而不是diffuse colors，而onscreen framebuffer中的物体颜色则可以相同。

我们将分两步实现这个场景。在第一部分，我们将创建一个随机的圆锥和圆柱的场景，每个物体都有一个唯一的标签；第二部分我们将配置picker的工作方式。

1. **创建一个随机场景**：

	我们需要给每个物体添加：

		- 一个随机位置
		- 一个唯一颜色标识
		- 一个可重复的diffuse color
		- 一个用来决定物体大小的缩放因子
	

2. 首先我们先来实现<code>positionGenrator</code>方法：

		function positionGenrator() {
			var x = Math.floor(Math.random()*60);
			var z = Math.floor(Math.random()*60);
			var flagX = Math.floor(Math.random()*10);
			var flagZ = Math.floor(Math.random()*10);
			
			if (flagX >= 5) {x = -x;}
			if (flagZ >= 5) {z = -z;}			return [x, 0, z];		}
			
	这里我们使用<code>Math.random</code>来生成随机的x和z坐标值。由于它只生成正值，所以我们使用了flagX和flagZ来随机生成负值。另外我们希望物体的初始位置在xz平面上，所以y始终为0。
	
3. 现在让我们来实现<code>objectLabelGenerator</code>给物体添加唯一标签：

		var colorset = {};
		function objectLabelGenerator() {
			var color = [Math.random(), Math.random(), Math.random(), 1.0];
			var key = color[0] + ':' + color[1] + ':' + color[2];
			
			if (key in colorset) {
				return uniqueColorGenerator();			} else {
				colorset[key] = true;
				return color;			}		}
		
	这里我们还是使用<code>Math.random</code>来生成随机颜色。如果colorset里已经有key值了那么我们就调用<code>objectLabelGenerator</code>，否则就使用使用key值。
	
4. 再来就是<code>diffuseColorGenerator</code>方法：

		function diffuseColorGenerator(index) {
			var c = (index % 30 /60) + 0.2;
			return [c,c,c,1];		}
		
	这个方法返回的颜色并不是唯一的，入参index代表的是物体在场景中的编号。首先使用index余30，这样每30个物体就会有一次冲突，接着除以60，保证范围在[0, 0.5]，接着加0.2保证最小值为0.2，这样物体颜色不会太暗。
	
5. 最后就是<code>scaleGenerator</code>方法了：

		function scaleGenerator() {
			var f = Math.random() + 0.3;
			return [f, f, f];		}
		
	这个方法让我们可以设置不同的物体大小，0.3是最小的缩放值。
	现在我们往场景中添加100个物体，最后我们会测试是否可以选取它们。
	
6. 现在<code>load</code>方法是这样的了：

		function load() {
			Floor.build(80, 5);
			Floor.pcolor = [0.0, 0.0, 0.0, 1.0];
			Scene.addObject(Floor);
			
			var positionValue, scaleFactor, objectLabel, objetType, diffuseColor;
			
			for (var i = 0; i < 100; i++) {
				positionValue = positionGenerator();
				objectLabel = objectLabelGenerator();
				scaleFactor = scaleGenerator();
				diffuseColor = diffuseColorGenerator(i);
				objectType = Math.floor(Math.random()*2);
				
				switch(objectType) {
					case 1:
						Scene.loadObject('models/geometry/sphere.json', 'ball_'+i, {
							position: positionValue,
							scale: scaleFactor,
							diffuse: diffuseColor,
							pcolor: objectLabel						});
						break;
					case 0:
						Scene.loadObject('models/geometry/sphere.json', 'cylinder_'+i, {
							position: positionValue,
							scale: scaleFactor,
							diffuse: diffuseColor,
							pcolor: objectLabel
						});
						break;				}			}		}
		
	注意，这里选取颜色用<code>pcolor</code>属性表示。
	
7. **在fragment shader中使用唯一标识**

	在渲染器中，我们使用<code>uPickingColor</code>这个uniform来表示pcolor，根据<code>uOffscreen</code> uniform来判断是否在fragment shader中使用：
	
		uniform vec4 uPickingColor;
		... // other uniforms and varyings
		main(void) {
			if (uOffscreen) {
				gl_FragColor = uPickingColor;
				return;			} else {
				... // on-screen rendering			}		}	
		
8. 像前面说的，我们使用<code>render</code>保持offscreen和onscreen buffer的同步：

		function render() {
			// off-screen rendering
			gl.bindFramebuffer(gl.FRAMEBUFFER, picker.framebuffer);
			gl.uniform1i(prg.uOffscreen, true);
			draw();
			
			// on-screen rendering
			gl.uniform1i(prg.uOffscreen, showPickingImage);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			draw();		}
		
9. **让picker工作起来**

	首先在<code>configure</code>方法中，我们设定好回调函数：
	
		picker = new Picker(canvas);
		picker.hitPropertyCallback = hitProperty;
		picker.addHitCallback = addHit;
		picker.removeHitCallback = removeHit;
		picker.processHitsCallback = processHits;
		picker.moveCallback = movePickedObjects;
		
	当然，接下来就是实现这些回调函数。
	
10. 首页是<code>hitProperty</code>函数，相当简单：

		function hitProperty(ob) {
			return ob.pcolor;		}
		
	这里我们告诉picker使用<code>pcolor</code>来对比onscreen和offscreen framebuffer。
	
11. 现在要实现<code>addHit</code>和<code>removeHit</code>方法。我们希望拾取时diffuse color会被设置为picking color。为此我们增加了一个临时的变量来存储之前的diffuse color以便后面恢复它：

		function addHit(ob) {
			ob.previous = ob.diffuse.slice(0);
			ob.diffuse = ob.pcolor;
			render();		}
		
		function removeHit(ob) {
			ob.diffuse = ob.previous.slice(0);
			render();		}
		
12. 现在是<code>processHits</code>方法：

		function processHits(hits) {
			var ob;
			for (var i = 0; i < hits.length; i++) {
				ob = hits[i];
				ob.diffuse = ob.previous;			}
			render();		}
		
	记住<code>processHits</code>是在选取状态下调用的。这个函数会接收一个参数：<code>hits</code>，它包含了被检测到的物体。这个函数中，我们要将diffuse color重新设置回去。
	
13. 最后一个需要实现的回调函数是<code>movePickedObjects</code>：

		function movePickedObjects(hits, interactor, dx, dy) {
			if (hits == 0) return;
			var camera = interactor.camera;
			var depth = interactor.alt;
			var factor = Math.max(Math.max(camera.position[0], camera.position[1]), camera.position[2]) / 1000;
			
			var scaleX, scaleY;
			for (var i = 0, max = hits.length; i < max; i++) {
				scaleX = vec3.create();
				scaleY = vec3.create();
				if (depth) {
					// moving along the camera normal vector
					vec3.scale(camera.normal, dy * factor, scaleY);				} else {
					// moving along the plane defined by the up and right
					// camera vectors
					vec3.scale(camera.up, -dy * factor, scaleY);
					vec3.scale(camera.right, dx * factor, scaleX);				}
				vec3.add(hits[i].position, scaleY);
				vec3.add(hits[i].position, scaleX);			}
			render();		}

	这个函数允许我们移动<code>hits</code>中的物体。里面的参数的含义分别是：
	
	- hits：被选中的物体列表
	- interactor：在configure中配置的camera interactor对象
	- dx：选中事件在canvas上的x坐标
	- dy：选中事件在canvas上的y坐标

好了，现在展示最终的结果：

[选取100个物体](http://gonghao.alidemo.cn/exercise/chapter8/ex8-2.html)

[<源码>](https://github.com/fem-d/webGL/blob/master/chapter8/ex8-2.html)

![](http://gtms03.alicdn.com/tps/i3/TB1gyGxHXXXXXcXapXXBP3H1pXX-1846-794.png)

在这章中，我们学习了如何在WebGL中实现基于颜色选取。基于diffuse color选取物体并不是一个好的主意，特别是一个场景中有多个一样颜色的物体时，更好的方式是选取一个唯一的属性。我们通常把这个叫做选取（颜色/物体）标签。

在讨论选取算法时，我们学到WebGL提供了生成offscreen framebuffers的机制，而且onscreen会渲染默认的framebuffer中的内容。

我们还学习了framebuffer和renderbuffer之间的区别。我们看到renderbuffer是一个和framebuffer绑定的特殊buffer，它被用于存储不能用纹理表示的信息（如深度值）。相对的是，纹理可用于存储颜色。

另外一个framebuffer至少要一个纹理存储颜色，一个renderbuffer存储深度信息。

我们讨论了如何将点击坐标转换为canvas中的坐标。framebuffer和canvas的坐标系都是以左上角为(0,0)原点。

另外我们还讨论了picker的实现架构。我们看到选取分为不同的状态，并且每个状态都有一个回调函数。picker回调允许我们在选取进行时实现自己的逻辑。

在下章中，我们将开发一个汽车展览室。我们将学习如何将车的模型从Blender中导入到WebGL。
				































