# WebGL基础学习篇（Lesson 5）
___

>之前我们已经看到了很多静态的场景，我们通过移动摄像头来进行相应的交互。摄像头的变换适用于所有3D物体，因此我们称它为全局变换。但是，3D物体也可以有自己的行为。比如在一个赛车游戏中，每个车都有不同的速度和轨道。在射击游戏中你的敌人可以躲藏在掩体后或是出来与你决斗或是逃走。通常，每个行为都用一个矩阵变换来建模，并被对应到场景中的物体上。这些被称作局部变换。在这章中，我们将学习不同的使用局部变换的技术。

###大纲

* 全局和局部变换
* 矩阵栈和如何使用它们实现动画
* 使用JavaScript定时器来实现基于时间的动画
* 参数化曲线
* 插值算法

在前一章中，我们学到了如何使用一个变换矩阵来作用于场景。这个全局的变换允许我们创建两种不同的摄像头。一旦我们将摄像头变换作用到物体上，它们就可以变换位置，比如第一人称射击中移动的目标，赛车游戏中奔驰的赛车。

这可以通过修改每个物体的MVMatrix做到。但是，我们修改了MVMatrix，又如何保证它不会干扰到其他的物体呢？毕竟我们只有一个MVMatrix。

解决方法很简单，使用矩阵栈（matrix stacks）。

### Matrix stacks
矩阵栈使得我们在保持唯一的全局MVMatrix时也能使用局部变换到每个物体上。让我们看看它们如何工作。

在每一轮渲染中（调用draw方法）都需要计算新的矩阵以响应摄像头的移动。在将矩阵传到渲染程序前我们需要为每个场景中的物体都更新MVMatrix。我们使用以下步骤：

* 第一步：一旦全局MVMatrix计算完毕，我们就将它存入栈中。
* 第二步：计算每个物体的MVMatrix，包括旋转，位移等变换。这些矩阵被传入程序，并用于显示物体新的位置。
* 第三步：从栈中吐出保存的MVMatrix，重复1到3步直到所有的物体被成功渲染。

下面的图显示了整个过程：
![](http://gtms03.alicdn.com/tps/i3/T1IoOiFQ0XXXbm8Znl-810-528.png)

### Animating a 3D scene
使一个物体具有动画效果可以单单是将局部变换作用在物体上。在上一小节中我们看到可以使用栈恢复原来的MVMatrix以将合适的局部变换作用到下一个需要渲染的物体上。

知道了如何使用局部变换和矩阵栈让物体移动后，我们需要考虑的是：什么时候执行？

如果我们在draw方法（示例中渲染的方法）中执行，那么动画将和渲染频率一致。一个缓慢的渲染流程会导致动画有顿卡的感觉，而一个太快的渲染流程则会导致动画闪现。

因此，我们需要将动画和渲染帧隔离开来。这里JavaScript为我们提供了两个方法：<code>requestAnimationFrame</code>和定时器。

#### requestAnimationFrame function
<code>window.requestAnimationFrame</code>在支持WebGL的浏览器上都可以使用。这个方法只有在浏览器或是选项卡激活时才会调用，否则不会被调用，这样毫无疑问节省了大量CPU，GPU以及内存资源。

使用<code>requestAnimationFrame</code>，我们可以获取硬件允许的渲染频率，当窗口未被激活时它会自动被挂起。如果我们使用了<code>requestAnimationFrame</code>来实现渲染帧，我们就可以使用定时器来周期性计算消耗时间并相应的更新动画。

#### JavaScript timers
我们可以使用两个定时器来隔离渲染帧和动画帧。

在前面的例子中，渲染帧由<code>WebGLApp</code>控制，它会调用<code>draw</code>方法，该方法采用定时器控制。

和<code>requestAnimationFrame</code>方法不同，即使窗口不激活，定时器也会一直在后台运行。这对机器的性能来说并不是一个好事。为了达到和<code>requestAnimationFrame</code>相同的效果，我们可以使用<code>window</code>上的<code>onblur</code>和<code>onfocus</code>来实现。

#### Timing strategies
在这章中，我们将使用第二个定时器来控制动画。它将渲染帧和动画帧隔离开来，我们将这个属性称作动画频率（animation rate）。

但是需要提前知道的是定时器的一个弊端：JavaScript并不是多线程言语。

这意味着如果有多个异步事件在同时触发，浏览器会将它们放入队列中等待执行。而每个浏览器的队列策略都有所不同。

我们有两种开发动画定时器的策略。

#### Animation strategy
第一种是在定时器回调函数中计算消耗时间。伪代码如下所示：

	var initialTime = undefined;
	var elapsedTime = undefined;
	var animationRate = 30;
	
	function animate(deltaT) {
		// calculate object positions based on deltaT
	}
	
	function onFrame() {		
		elaspedTime = (+new Date()) - initialTime;
		if (elaspedTime < anmationRate) return;
		animate(elapsedTime);
		initialTime = +new Date();
	}
	
	function startAnimation() {
		setInterval(onFrame, animationRate/1000);
	}
	
这样做我们可以保证动画帧和回调函数隔离开来。但是如果有较大的延迟，就会出现丢失帧（dropped frames）的情况。这意味着本来应该移动过去的物体会突然出现在最终位置上，想象一下第一人称中射击敌人时敌人突然出现在另一个地方（-_-!）。下面的方法可以解决这个问题。

#### Simulation strategy
有很多程序（如射击游戏）需要我们保持帧的流畅性。因此，我们需要以一个固定的频率来更新物体的位置。我们通过在定时器回调中直接计算下一个位置来解决这个问题。

	var animationRate = 30;
	var deltaPosition = 0.1;
	
	function animate(deltaP) {
		// calculate object positions based on deltaP
	}
	
	function onFrame() {		
		animate(deltaPosition);
	}
	
	function startAnimation() {
		setInterval(onFrame, animationRate/1000);
	}
	
但是当有大量阻塞事件时，由于物体的位置不能根据时间更新，会出现冻结帧（frozen frames）。

#### Combined approach: animation and simulation
通常来说，浏览器在处理阻塞事件时都很有效率，大多数情况下不管使用哪种策略都能达到同样的表现。因此，在回调函数中使用消耗时间还是使用下一个位置只用依据程序而定就行。

但是，仍然有些案例需要将两种策略结合起来。我们可以创建一个回调，它能在每帧中都计算出消耗时间并更新动画。如下所示：

	var initailTime = undefined;
	var elapsedTime = undefined;
	var animationRate = 30;
	var deltaPosition = 0.1;
	
	function animate(delta) {
		// calculate object positions based on delta
	}
	
	function onFrame() {		
		elapsedTime = (+new Date()) - initialTime;
		if (elapsedTime < animationRate) return;
		
		var steps = Math.floor(elapsedTime/animationRate);
		while (steps > 0) {
			animation(deltaPosition);			steps -= 1;		}
		initialTime = +new Date();
	}
	
	function startAnimation() {
		initialTime = +new Date();
		setInterval(onFrame, animationRate/1000);
	}

从上面的代码片段中可以看到，不管两帧间消耗了多少时间，动画都会以固定的频率进行更新。如果程序更新频率是60Hz，那么动画将每帧更新一次；如果是30Hz，也会每帧更新一次；如果是15Hz，每帧会更新两次。关键点就是每次都会移动固定的量，这样的动画更稳定。

下面的图表显示了整个过程：
![](http://gtms01.alicdn.com/tps/i1/TB1ev.jFVXXXXa9XXXXHMbd5pXX-1114-734.png)

这个策略唯一的问题是每帧的动画计算时间过长，如果这样的话，你最好简化你的动画代码。

### Web Workers: Real multithreading in JavaScript
尽管Web Workers不属于这个学习教程，但是如果你的程序特别注重性能而且你需要保证以一个相同的频率更新，你可以考虑使用**Web Workers**。

### Connecting matrix stacks and JavaScripts timers
理论来自实践，现在让我们看一个简单的场景，这个场景中会有一个移动的圆锥和一个移动的圆。我们使用矩阵栈来实现局部转换，使用定时器来做动画。

[第一个动画](http://gonghao.alidemo.cn/exercise/chapter5/ex5-1.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter5/ex5-1.html)>

![](http://gtms01.alicdn.com/tps/i1/TB1BXkcFVXXXXc7XpXXj8IY_pXX-2200-802.png)

### Parametric curves
在很多情况下我们并不知道运动的物体在某一时间下的具体位置，但是我们能知道它们的轨迹。这些轨迹被称作参数化曲线，有趣的是，这个名字的由来是因为它的位置只依赖于时间。

现实中有许多参数化曲线。比如在游戏里射击的子弹，下山的车或者是弹跳的球。在前面的每个例子中都有一个等式用于描述它们的运动轨迹。下面的图展示了自由下落的参数化曲线。
![](http://gtms01.alicdn.com/tps/i1/TB1YhP_FVXXXXasXVXXEra0FFXX-1132-870.png)
我们接下来会使用参数化曲线来创建一个弹跳球的WebGL场景。

#### Initialization steps
我们使用一个全局变量来存储时间（模拟时间）。
	
	var sceneTime = 0;
	
再创建一些全局变量来控制动画：

	var animationRate = 15;
	var elapsedTime = undefined;
	var initialTime = undefined;
	
<code>load</code>方法需要多次加载坐标信息（JSON文件）来获得大量的球。代码如下所示：

	function load() {		
		Floor.build(80, 2);
		Axis.build(82);
		Scene.addObject(Floor);
		
		for (var i = 0; i < NUM_BALLS; i++) {
			var pos = generatePosition();
			ball.push(new BouncingBall(pos[0], pos[1], pos[2]));
			Scene.loadObject('modles/geometry/ball.json', 'ball'+i);		}		}
	
注意到我们使用了<code>ball[]</code>来存储球，这样每次全局时间变更时我们都可以获得球的位置。我们会在后面的小节中谈到如何模拟弹跳的球。

#### Setting up the animation timer
<code>startAnimation</code>和<code>onFrame</code>方法不变：

	function onFrame() {
		elapsedTime = +new Date() - initialTime;
		if (elapsedTime < animationRate) {
			return;		}
		var steps = Math.floor(elapsedTime/animationRate);
		while(steps) {
			animate();
			step -= 1;			}
		initialTime = +new Date();		}
	
	function startAnimation() {
		initialTime = +new Date();
		setInterval(onFrame, animationRate/1000);		}
	
#### Running the animation
在<code>animate</code>方法中我们将全局变量<code>sceneTime</code>传递给每个球的<code>update</code>方法。接着将<code>sceneTime</code>更新。代码如下：

	function animate() {
		for (var i = 0; i < ball.length; i++) {
			ball[i].update(sceneTime);			}
		sceneTime += 33/1000;
		draw();	}
	
参数化曲线的好处就在于我们在移动时并不需要提前知道每个物体的位置。我们用参数化曲线根据时间算出即可。每个球体的<code>update</code>方法会做这个计算。

#### Drawing each ball in its current position
在<code>draw</code>方法中，我们使用矩阵栈在局部变换前保存MVMatrix。代码如下：

	// 得到MVMatrix
	transforms.calculateModelView();
	// 入栈
	transforms.push();
	if (obejct.alias.substring(0, 4) == "ball") {
		var index = parseInt(object.alias.substring(4,8));
		var ballTransform = transform.mvMatrix;
		// 局部变换发生的地方
		mat4.translate(ballTransform, ball[index].position);
		object.diffuse = ball[index].color;	}
	transforms.setMatrixUniforms();
	// 出栈
	trnasforms.pop();
	
好了，在接下来的例子中我们将展示
[跳动的球](http://gonghao.alidemo.cn/exercise/chapter5/ex5-2.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter5/ex5-2.html)>

![](http://gtms04.alicdn.com/tps/i4/TB1vT7bFVXXXXanXFXX3tsY_pXX-2200-800.png)

没错，就是这么简单，但是大家查看动画的时候是否感觉很卡顿？接下来，我们就来优化它。

#### Optimization strategies
在球体数量为500个时，我们就会发现明显的卡顿，使用Profile工具查看可以发现：
![](http://gtms01.alicdn.com/tps/i1/TB1GOtkFVXXXXcAXVXXEqtmKVXX-2078-218.png)

<code>draw</code>方法执行消耗了大量的CPU，我们需要将该方法调优。

##### Optimizing batch performance
我们可以使用缓存来优化动画场景中类似的物体。这正是我们的案例中需要的。每个球体都有不同的位置和颜色，它们是独一无二的。但是这些球体的模型（geometry）是一致的。

在前面的例子中，我们使用<code>load</code>方法创建了50个VBO，每个对应一个球体。同样的模型被加载了50次，而且在每一次的渲染中（draw function），不同的VBO被使用了，即使每个球体的模型都是相同的。

在优化的版本中，我们修改了<code>load</code>和<code>draw</code>方法以使用缓存。首先，模型只加载一次：
	
	Scene.loadObject('model/geometry/ball.json', 'ball');
	
其次，当别名为‘ball’的物体被渲染时，特定的<code>drawBalls</code>方法被调用。这个方法会将相同的uniforms信息设置到球体上。之后，<code>drawBall</code>方法被调用。这个方法将设置每个球体不同的属性（在我们的例子中就是颜色和MVMatrix信息）。

![](http://gtms02.alicdn.com/tps/i2/TB18385FVXXXXXwaXXXnspX_XXX-980-706.png)

##### Performing translations in the vertex shader
如果查看改版的代码，我们会发现我们使用了额外的一步来缓存MVMatrix信息。

简单来说，就是我们只往GPU传递最原始的坐标，然后在vertex shader中执行位移。由于vertex shader是并行的，因此这将极大地提高效率。

接下来，我们这样做：

1. 创建一个uniform并告诉vertex shader是否需要位移（uTranslate）。
2. 创建一个uniform来包含每个球体的位置（uTranslation）。
3. 将这两个uniform映射到javascript 对象上。


	<pre><code>prg.uTranslation = gl.getUniformLocation(prg, "uTranslation");
	gl.unifrom3fv(prg.uTranslation, [0, 0, 0]);
	
	// uTranslate 是否位移
	prg.uTranslate = gl.getUniformLocation(prg, "uTranslate");
	gl.uniform1i(prg.uTranslate, false);</code></pre>

	
4. 在vertex shader中执行位移，我们需要在ESSL中实现。

	<pre><code>vec3 vecPosition = aVertexPosition;
	if (uTranslate) {
		vecPosition += uTranslation;	}
	vec4 vertex = uMVMatrix * vec4(vecPosition, 1.0);</code></pre>
	
5. 在<code>drawBall</code>方法中，我们将每个球体的位置作为参数传入：

	<pre><code>gl.uniform3fv(prg.uTranslation, ball.position);</code></pre>
	
6. 在<code>drawBalls</code>中，我们将uTranslate设置为true：

	<pre><code>gl.uniform1i(prg.uTranslate, true);</code></pre>
	
7. 在<code>draw</code>中我们使用以下的代码设置MVMatrix：

	<pre><code>transforms.setMatrixUniforms();</code></pre>
	
[优化的Bounding Balls](http://gonghao.alidemo.cn/exercise/chapter5/ex5-3.html)
![](http://gtms01.alicdn.com/tps/i1/TB1ztimFVXXXXXhaXXXaeTQ.XXX-2064-360.png)

### Interpolation
Interpolation极大地简化了3D动画。与参数化曲线不同，它不需要我们根据时间去计算位置。当interpolation使用时，我们只需要定义好控制点。这些控制点描述了我们需要它们运动的轨迹。

#### Linear interpolation
我们需要为这个interpolation定义起始点和终止点以及渐移步数。物体将在起始点和终止点的连线上移动。
![](http://gtms01.alicdn.com/tps/i1/TB1NnaTFVXXXXczaXXX_RfNZFXX-498-428.png)

#### Polynomial interpolation
这个方法允许我们创建任意个控制点。物体会从起始点开始依次穿过每个控制点到达终止点。
![](http://gtms04.alicdn.com/tps/i4/TB1qTh.FVXXXXalXVXX8PsnGFXX-912-410.png)

当使用polynomials时，随着控制点的增多，物体的运动曲线会出现我们并不期望的振动，这就是[Runge现象](http://en.wikipedia.org/wiki/Runge%27s_phenomenon)。在下面的图表中，你将看到11个控制点的polynomial以及Runge现象。
![](http://gtms03.alicdn.com/tps/i3/TB1X4zbFVXXXXbQXFXXuuBM2VXX-962-698.png)

#### B-Splines
这个方法和polynomial interpolation很相似，唯一的区别在于控制点并不在物体的运动路径上。也就是说，物体并不穿过控制点。这个方法在计算机图形学中很常见，因为它的曲线更平滑而且控制点更少。B-Splines能很好地解决Runge现象。
![](http://gtms04.alicdn.com/tps/i4/TB1ow0pFVXXXXb.XVXXF73xIpXX-1244-650.png)

在下面的实例中，我们将依次查看这三种方法。






























