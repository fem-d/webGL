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
![]()

这个策略唯一的问题是每帧的动画计算时间过长，如果这样的话，你最好简化你的动画代码。

### Web Workers: Real multithreading in JavaScript
尽管Web Workers不属于这个学习教程，但是如果你的程序特别注重性能而且你需要保证以一个相同的频率更新，你可以考虑使用**Web Workers**。

### Connecting matrix stacks and JavaScripts timers
理论来自实践，现在让我们看一个简单的场景，这个场景中会有一个移动的圆锥和一个移动的圆。我们使用矩阵栈来实现局部转换，使用定时器来做动画。

[]()
![]()

### Parametric curves
在很多情况下我们并不知道运动的物体在某一时间下的具体位置，但是我们能知道它们的轨迹。这些轨迹被称作参数化曲线，有趣的是，这个名字的由来是因为它的位置只依赖于时间。

现实中有许多参数化曲线。比如在游戏里射击的子弹，下山的车或者是弹跳的球。在前面的每个例子中都有一个等式用于描述它们的运动轨迹。下面的图展示了自由下落的参数化曲线。
![]()
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
			Scene.loadObject('modles/geometry/ball.json', 'ball'+i);		}	}
	
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
			step -= 1;		}
		initialTime = +new Date();	}
	
	function startAnimation() {
		initialTime = +new Date();
		setInterval(onFrame, animationRate/1000);	}
	
#### Running the animation
在<code>animate</code>方法中我们将全局变量<code>sceneTime</code>传递给每个球的<code>update</code>方法。接着将<code>sceneTime</code>更新。代码如下：

	function animate() {
		for (var i = 0; i < ball.length; i++) {
			ball[i].update(sceneTime);		}
		sceneTime += 33/1000;
		draw();	}






























