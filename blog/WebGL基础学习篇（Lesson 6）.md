# WebGL基础学习篇（Lesson 6）
___

> 在这章中，我们将更深入地学习WebGL中的颜色。我们首先会学习颜色是如何在WebGL和ESSL中组成并控制的。接着我们会讨论颜色在物体、灯光以及场景中的用途。然后我们会学习WebGL是如何在物体遮挡时进行展现的，这就是深度测试（depth testing）的工作了。与之相反，α混合（alpha blending）让我们在颜色重叠时能将之重叠。我们将使用α混合来构建半透明的物体。

### 大纲

* 在物体上使用颜色
* 给光源上色
* 在ESSL中使用多光源
* 深度测试和z-buffer
* 混合函数和等式（Blending functions and equations）
* 使用面剔除（face culling）创建透明的物体

### Using colors in WebGL

WebGL中的RGB模型包含第四个属性，这个属性被叫做α通道，这样RGB模型就被扩展为了RGBA模型。α通道的取值可以从0.0到1.0。下面的图展示了RGBA的颜色范围，横向是R、G、B通道的范围，而纵向是α通道的范围。
![](http://gtms01.alicdn.com/tps/i1/TB1lU87GXXXXXcFXXXXNlPNVVXX-1064-352.png)

α通道控制了颜色的透明信息，在WebGL 3D场景中我们都使用了它们：

- 物体： 3D物体可以在每个像素上着色或是整个物体被上色（通常是material diffuse属性决定的）。
- 光照：尽管我们在前面的例子中都是使用白光，但这不意味着我们不能使用其他的颜色。
- 场景：我们可以使用<code>gl.clearColor</code>来改变场景中的颜色。

### Use of color in objects
每个像素的最终颜色都是通过ESSL中的<code>gl_FragColor</code>决定的。如果每个fragment都是同一个颜色那么这个物体就是纯色的，反之则不然。

#### Constant coloring
为了得到一个纯色，我们将期望的颜色存储在一个uniform中然后传递给fragment shader。这个uniform通常是物体的 **diffuse material property**。我们还可以结合物体的法线和光源来获得Lambert系数。这样就可以使用它来改变反射光线了。

如下图所示，当不使用法线信息来获取Lambert信息时我们丢失了深度感。注意我们使用的是扩散光。

通常纯色的物体适用于3D游戏中的小物体（assets）。
![](http://gtms03.alicdn.com/tps/i3/TB1cm08GXXXXXbGXXXXxrXf3FXX-856-618.png)

#### Per-vertex coloring
在医学和工程学的可视化程序中，我们都能发现使用颜色地图（color maps）来匹配模型的每个vertices。这些地图根据对应的值来赋予vertex相应的颜色。一个典型的例子就是在表示温度的图形中通常使用蓝色来表示低温处，红色表示高温。

为了实现per-vertex coloring，我们需要定义一个属性来存储每个vertex相应的颜色：
	
	attribute vec4 aVertexColor;
	
接下来，将这个属性赋值给一个varying来传递给fragment shader。注意varying都是自动插值过的，因此每个fragment都会获得一个由周围vertices权重后的颜色。

如果我们需要我们的颜色地图对光线敏感，那我们就需要用vertex的颜色与light的diffuse相乘。这个值会通过varying传递到fragment shader中。下面的例子展示了两种不同的光照情况。左边的图中vertex颜色仅与光照diffuse相乘但是没有给予光源位置信息；而右边的图在给予了光源相对信息后显示了期待的阴影。
![](http://gtms03.alicdn.com/tps/i3/TB1Wd45GXXXXXbnXpXXvifu6pXX-968-730.png)

#### Per-fragment coloring
我们还可以对物体中的每个像素赋予随机的颜色。但是，ESSL并没有提供原生的随机函数。虽然有一些可以生成伪随机数字的算法，但是这些技术的讲解并不在这一学习教程中，有兴趣的同学可以自己查询下。

接下来让我们实践一下：[颜色的第一个示例](http://gonghao.alidemo.cn/exercise/chapter6/ex6-1.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter6/ex6-1.html)>

![](http://gtms04.alicdn.com/tps/i4/TB11fcjGXXXXXbPXXXX.onHFVXX-2204-926.png)

##### 例子讲解
我们详细讲解下在简单模型和复杂模型中颜色都是如何渲染的。
简单模型一共有8个vertex构成，我们给每个vertex都添加了颜色，webGL会在fragment shader时interpolate这些颜色形成我们看到的样子。
![](http://gtms01.alicdn.com/tps/i1/TB1_TAfGXXXXXXRXpXXnEykHFXX-672-470.png)

复杂模型中我们会定义每个面的vertex，也就是说一个vertex会被定义三次，一共有24个vertex，我们可以分别给这24个vertex定义颜色。
![](http://gtms02.alicdn.com/tps/i2/TB1UQEfGXXXXXaqXpXX43f6LXXX-678-470.png)

### Use of color in lights
颜色是光的属性。在第三章中，我们知道光的属性根据反射模型来决定。比如，使用Lambertian reflection model我们只需要光的diffuse属性。然而在Phong reflection model里我们需要三个属性：ambient，diffuse和specular。

> 一般来说，光的位置属性在所有场景中都需要使用，所以前面没有加上它，加上光的位置的话就有四个属性了。

#### Using multiple lights and the scalability problem
正如你所想的，随着越来越多光的使用，我们会有越来越多的uniform需要维护。难以想象为了有三个光，我们需要12个uniform！

#### How many uniforms can we use?
OpenGL的规范规定了我们使用uniforms的数量。

> There is an implementation dependent limit on the amount of storage for uniforms that can be used for each type of shader and if this is exceeded it will cause a complie-time or link-time error.

我们可以使用<code>gl.getParameter</code>来获取WebGL的这些限制：

	gl.MAX_VERTEX_UNIFORM_VECTORS
	gl.MAX_FRAGMENT_UNIFORM_VECTORS
	
实际的限制根据你的浏览器以及显卡而定。
尽管我们有足够的空间，但每个uniform写一个对应的依然让人很头痛。

#### Simplifying the problem
为了简化这个问题（同时减少代码），我们可以假设在所有的光源中相邻的光颜色是相同的。这样对于每个光我们都会减少一个unfiorm。然而，对于更通用的场景这样假设显然不是一个好的方案。

首先让我们看看一个场景中多个光源是怎么样的。首先，我们需要升级我们的代码架构。
> 原书中下一章是架构的升级，这里就不多说了，具体的改动看代码或者看原书。

好了，多光源场景献上：[多光源场景](http://gonghao.alidemo.cn/exercise/chapter6/ex6-2.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter6/ex6-2.html)>

![](http://gtms02.alicdn.com/tps/i2/TB1UIdkGFXXXXaDXVXXKtHrFVXX-2204-804.png)

#### Using uniform arrays to handle multiple lights
如前面所说，为每个光源维护一个uniform让人头痛（虽然上一个例子也是这么做的）。万幸的是，ESSL为我们提供了多个解决这个问题的方案。其中之一就是使用uniform arrays。

这个方案使得我们可以通过在shader中引入光源数组，我们可以遍历数组来获取光源信息。虽然我们仍需定义每个光源但是与ESSL相关的代码可以变得简单。让我们看看这是如何工作的吧。

![](http://gtms02.alicdn.com/tps/i2/TB1TQdoGFXXXXa5XpXX1BN.RFXX-936-680.png)

我们只需要对代码做两个简单的改动。

##### Uniform array declaration
首先我们需要在ESSL中定义我们的光源数组。例如三光源的场景我们有：

	uniform vec3 uPositionLight[3];
	
需要注意的是，ESSL并不支持动态数组，如果你这样写：

	uniform uNumLights;
	uniform vec3 uPositionLight[uNumLights];
	
shader不会编译成功并且你会得到下面的错误：

	ERROR: 0:12 ":constant expression required"
	ERROR: 0:12 ":array size must be a constant integer expression"
	
##### JavaScript array mapping
接下来，我们需要将JavaScript变量映射到程序中。例如，我们有下面三个光源位置：

	var lightPostion1 = [0.0, 7.0, 3.0];
	var lightPostion2 = [2.5, 3.0, 3.0];
	var lightPostion3 = [-2.5, 3.0, 3.0];
	
接着，我们需要获取uniform的引用：

	var location = gl.getUniformLocation(prg, "uPositionLight");
	
接下来是与之前不一样的地方，我们传入了连接好的数组：

	gl.uniform3fv(location, [0.0, 7.0, 3.0, 2.5, 3.0, 3.0, -2.5, 3.0, 3.0]);
	
有两个地方需要注意：

* 使用<code>getUniformLocation</code>的方式与之前一样，即使它现在是一个数组。
* 我们传入的是一个数组，如果你像下面这样做就是错误的：

	<code>gl.uniform3fv(location, [[0.0, 7.0, 3.0], [2.5, 3.0, 3.0], [-2.5, 3.0, 3.0]]);</code>

接下来是使用uniform array实现的[四光图](http://gonghao.alidemo.cn/exercise/chapter6/ex6-3.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter6/ex6-3.html)>

![](http://gtms02.alicdn.com/tps/i2/TB1qMVuGFXXXXcLXXXX4s7DQFXX-2198-806.png)

##### directional point lights
在第三章中，我们对比了点光源（point lights）和径向光源（directional lights）：
![](http://gtms03.alicdn.com/tps/i3/TB1VPBpGFXXXXaBXFXX1y146FXX-760-386.png)

在这章中，我们结合径向光源和点光源创造了第三种光源：径向点光源。这种光同时有位置和径向属性。shaders可以轻易的处理这些带有属性的光。

创建这些光的技巧在于用每个vertex的法线向量减去光线趋向向量（light direction vector）。这样最后得到的向量会生成不同的lambert coefficient并得到我们想要的结果。
![](http://gtms01.alicdn.com/tps/i1/TB1BK0EGFXXXXaNXXXXYFY7.VXX-906-666.png)

[径向点光源](http://gonghao.alidemo.cn/exercise/chapter6/ex6-4.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter6/ex6-4.html)>

![](http://gtms03.alicdn.com/tps/i3/TB12nhUGFXXXXXuXXXXBtOHHXXX-2206-806.png)

##### 深入学习：
在上面的例子中我们使用了径向点光源，让我们看一下shader中的关键代码：

	vec3 directionLight = vec3(uNMatrix * vec4(uLightDirection[i], 1.0));
	vNormal[i] = normal - directionLight;
	
还记得之前说的技巧么，这就是了。

另外注意到我们在fragment shader中有这么一段代码：

	if (lambertTerm > uCutOff) {
		finalColor += uLightDiffuse[i] * uMaterialDiffuse;// * lambertTerm;
	}
	
在这段代码中，我们对于lambertTerm做了限制。至少有两种方法可以限制光的范围，其中一种就是控制lambert coefficient在<code>uCutOff</code>之上。
记住Lambert coefficient表示反射光和表面法线之间的cosin值（在0到1之间）。当光照和表面垂直时，lambert值为1，随着将光线向平行于表面的方向移动，lambert值逐渐减小，直到与表面平行（此时值为0）。
![](http://gtms04.alicdn.com/tps/i4/TB1CJBPGFXXXXaSXXXXI8szRFXX-1054-396.png)

让我们再看看将uCutOff分别设置为0和1的情况，这样能更好的理解。

* uCutOff为0的情况
![](http://gtms04.alicdn.com/tps/i4/TB1RAtpGFXXXXaQXVXXTtAb.FXX-2202-802.png)

* uCutOff为1的情况
![](http://gtms04.alicdn.com/tps/i4/TB1D2NuGFXXXXX0XFXXa8Qb.FXX-2202-804.png)

目前改变lambert值只能改变光照范围的大小，但是我们肯定注意到了，这些光照效果并不真实。原因就是不管lambert值是什么我们的最终颜色是一样的！OK，还记得之前代码里注释掉的内容么？现在我们把注释掉的lambert加入最终颜色的计算吧。

	finalColor += uLightDiffuse[i] * uMaterialDiffuse * lambertTerm;
	
![](http://gtms01.alicdn.com/tps/i1/TB1ID8qGFXXXXXsXVXXz8oa.FXX-2202-800.png)

可以看到效果好了很多。现在我们用指数衰减因子来创建，在shader中使用下面的代码：

	finalColor += uLightDiffuse[i] * uMaterialDiffuse * pow(lambertTerm, 10.0 * uCutOff);
	
这样我们的衰减情况就是指数形式的了，原理如下：
![](http://gtms01.alicdn.com/tps/i1/TB1ciFvGFXXXXXOXFXXMhD3PVXX-1048-600.png)

效果图：
![](http://gtms03.alicdn.com/tps/i3/TB1adxnGFXXXXa8aXXX3tsY_pXX-2200-800.png)

### Use of color in the scene
现在是时候讨论透明度和α混合了。之前我们有说过α通道可以携带物体的透明度信息。但是在上一个例子中我们看到为了实现透明度我们不得不手动的开启α混合功能。当我们在场景中有多个物体时事情就不是这么简单了。接下来让我们看看该如何处理半透明和不透明的物体。

#### Transparency
获取透明物体的第一个方法是使用多边形图案填充（polygon stippling）。这个技术丢失了一些fragments使得我们可以看穿物体，就好像我们在物体的表面打了很多小洞。

openGL通过<code>glPolygonStipple</code>方法来实现多边形图案填充，但在WebGL中没有这个方法。我们可以通过使用fragment shader中的<code>discard</code>命令丢弃fragment来模拟这种方法。

更通常的做法是我们可以使用α通道来携带透明信息。但是如同之前说过的，直接修改α值并不能更新物体的透明度。

创建透明度相当于需要修改我们放在frame buffer中的fragments。想象这么一个场景，一个半透明的物体放在一个不透明的物体前。为了能成功渲染，我们需要透过这个半透明的物体看到不透明的物体。这就需要我们将物体的近面（near fragments）和远面（far fragments）很好地结合起来以达到透明效果。

同样的，当场景中只有一个半透明物体时，也是相同的逻辑。唯一的区别在于，这个例子中物体的后端对应远面（far fragments），前端对应近面（near fragments）。因此远面和近面需要结合。

为了实现透明，我们需要学习两个WebGL的重要概念：深度测试（depth testing）和α混合。

#### Updated rendering pipeline
深度测试和α混合是fragments shader处理fragments后的两个可选步骤。如果深度测试没有开启，那么所有的fragments都自动进行α混合。如果深度测试开启，那么那些测试失败的fragments会在流水线中被丢弃并且不再用于其他操作。即是这些fragments不会被渲染，正如ESSL中的discard命令。

下面的图展示了深度测试和α混合的顺序：
![](http://gtms04.alicdn.com/tps/i4/TB1pvuPGFXXXXXaapXX2ZFq6FXX-864-644.png)
下面让我们看看什么是深度测试以及它和α混合的关系。

### Depth testing
每个被fragment shader处理过的fragment都携带着一个相关的深度值。尽管fragments在屏幕上显示时是二维的，但是深度值保存着物体相对屏幕的距离。深度值存储在一个特殊的WebGL缓存中，它叫做depth buffer或者z-buffer。

在fragment被fragment shader处理后，它就可以用作深度测试了，当然只有深度测试被激活时。比如有个变量<code>gl</code>变量用于表示WebGL环境，我们可以这样激活它：

	gl.enable(gl.DEPTH_TEST);
	
深度测试将fragment的深度值和已存储在depth buffer中的相同位置的fragment深度值做对比。深度测试会决定某个fragment是否会被用于后续工作。

只有通过深度测试的fragment会被继续处理。相反，没通过的都会被抛弃。

当深度测试开启时，正常情况下深度值较小的fragment将会被保留。

深度测试的操作是可交换的。这意味着不论哪个物体先被渲染，只要深度测试开启着，我们得到的结果总是一致的。

让我们查看一个例子。在下面的图中，有一个椎体和球体。我们先看看深度测试关闭的场景：

	gl.disable(gl.DEPTH_TEST);
	
球体首先被渲染，椎体与球体交叉的fragment并没有被丢弃，这是因为我们没有启用深度测试。

现在我们开启深度测试。球体先被渲染，由于椎体交叉的fragment有更高的深度值（它们离屏幕更远），它们在深度测试中就被抛弃了。
![](http://gtms02.alicdn.com/tps/i2/TB1lPiUGFXXXXcnXFXXaWtyLXXX-1144-864.png)

#### Depth function
在一些应用中，我们可能会想改变默认的深度测试。这样我们就需要使用WebGL提供的<code>gl.depthFunc</code>方法。

这个方法只有一个参数，用法如下：
![](http://gtms01.alicdn.com/tps/i1/TB1eMC1GFXXXXafXXXXnwIYYpXX-1308-604.png)

> WebGL中默认关闭深度测试。当开启时，如果没有设定特定的值，gl.LESS会作为默认值。

### Alpha blending
如果fragment通过了深度测试它就可以做α混合了。但是如果深度测试被禁止了，那么所有的fragment都会做α混合。

α混合可以通过以下的方式启用：

	gl.enable(gl.BLEND);
	
对于通过的fragment，α混合操作会从frame buffer中读取相同位置的颜色并且使用线性插值（linear interpolation）创建基于fragment shader计算出的颜色（gl_FragColor）和frame buffer的新颜色。

> α混合同样默认被禁止。

#### Blending function
如果混合启用，接下来就需要定义混合函数。这个函数将决定如何将我们希望显示的颜色（source）和目前frame buffer中已有的颜色（destination）结合起来。

我们可以这样结合：

	Color Output = S * sW + D * dw
	
这里，

* S: source color
* D: destination color
* sW: source scaling factor
* dW: destination scaling factor
* S.rgb: rgb components of the source color
* S.a: alpha component of the source color
* D.rgb: rgb components of the destination color
* D.a: alpha component of the destination color

在这里特别需要注意的是渲染顺序对于source和destination是有影响的。拿前面的例子为例，如果球体先渲染那么它在blending操作中就是destination，因为它的fragments会先存储在frame buffer中。用更通俗的话说，α混合是不可交换的操作。
![](http://gtms01.alicdn.com/tps/i1/TB1kM1SGFXXXXcJXVXXmMgeMXXX-1146-610.png)

#### Separate blending functions
同样我们也可以决定RGB通道和α通道如何混合。我们需要使用<code>gl.blendFuncSeparate</code>方法。

我们需要分别定义函数：

	Color output = S.rgb * sW.rgb + D.rgb * dW.rgb
	Alpha output = S.a * sW.a + D.a * dw.a
	
那么我们就能得到以下：

	Color output = S.rgb * S.a + D.rgb * (1 - S.a)
	Alpha output = S.a * 1 + D.a * 0
	
对应的代码就是：

	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO)
	
这和我们之前使用<code>gl.blendFunc</code>的效果是一样的。

#### Blend equation
我们可能并不希望像之前那样做插值，也许我们想使用一个减去另一个。对于这种情况，WebGL提供了<code>gl.blendEquation</code>函数。这个函数接受一个参数，它决定了source和destination之间的操作。

gl.blendEquation(gl.FUNC_ADD)对应
	
	Color output = S * sW + D * dW
	
gl.blendEquation(gl.FUNC_SUBTRACT)对应
	
	Color output = S * sW - D * dW
	
gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT)对应

	Color output = D * dW - S * sW
	
对于<code>gl.blendEquationSeparate</code>同样也有这些操作。

#### Blend color
WebGL提供了设置因子的参数<code>gl.CONSTANT_COLOR</code>和<code>gl.ONE_MINUS_CONSTANT_COLOR</code>。这些因子可以在<code>gl.blendFunc</code>和<code>gl.blendFuncSeparate</code>中使用。需要注意的是，我们要在blend color决定前设置。我们可以使用<code>gl.blendColor</code>来设置。

#### WebGL alpha blending API
以下是α混合相关的所有API：
![](http://gtms03.alicdn.com/tps/i3/TB12.iTGFXXXXX7XVXXgTBgGXXX-1308-1310.png)

![](http://gtms04.alicdn.com/tps/i4/TB1eM1ZGFXXXXX5XpXXJFHWVXXX-1304-1318.png)

#### Alpha blending modes
根据sW和dW参数的不同，我们可以创建不同的混合模式。在这章中我们将学习如何实现相加，相减，相乘以及插值混合模式。所有的模式都基于以下公式（前面提到过）：

	Color output = S * sW + D * dW
	
##### Additive blending
这仅仅就是将source和destination相加，会得到一个更浅的混合：

	gl.blendFunc(gl.ONE, gl.ONE)
	
即是：
	
	Color output = S * 1 + D * 1
	Color output = S + D
	
因为color值的域仅仅是[0, 1]，所以最大值只能是1。当所有通道都为1时结果就是白色。

##### Subtractive blending
同样，相减可以这样写：

	gl.blendEquation(gl.FUNC_SUBTRACT)
	gl.blendFunc(gl.ONE, gl.ONE)
	
即是：
	
	Color output = S * 1 - D * 1
	Color output = S - D
	
同理，当所有通道为0时显示黑色。

##### Multiplicative blending
我们可以这样书写相乘：

	gl.blendFunc(gl.DST_COLOR, gl.ZERO)
	
即是：

	Color output = S * D + D * 0
	Color output = S * D
	
这样会得到一个更深的混合。

##### Interpolative blending
如果我们设置sW为S.a，并且设置dW为1-S.a，那么

	Color output = S * S.a + D * (1 - S.a)
	
这会创建一个基于原始颜色和目标颜色的插值，代码这样写：

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
	
只要目标fragments能通过深度测试我们就可以利用插值混合来创建透明效果。这意味着我们需要从后往前渲染物体（结合之前的圆锥和球体来理解）。

好了，来看下相关的code：

[α混合的椎体和球体](http://gonghao.alidemo.cn/exercise/chapter6/ex6-5.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter6/ex6-5.html)>

![](http://gtms01.alicdn.com/tps/i1/TB1z.rYGFXXXXXRapXXS5_ALFXX-2398-842.png)

#### Creating transparent objects
我们已经知道如果需要创建透明物体需要：

1. 开启α混合并选择混合函数。
2. 从后往前的渲染物体。

那如果没有相关的物体我们如何创建透明物体呢？换句话说我们如何创建只有一个的透明物体。

其中一个方法是使用表面选择（face culling）。

表面选择允许我们只渲染物体的正面或是背面。在上一个例子中你可以通过Back Face Culling来选择。

使用前面使用的颜色方体，我们会让它变得透明。为此，我们需要：

1. 开启α混合并选择混合函数。
2. 开启表面选择功能。
3. 渲染背面（通过剔除正面）。
4. 渲染正面（通过剔除背面）。

和其他选择项一样，culling也是默认被关闭的。我们需要开启它：

	gl.enable(gl.FACE_CULLING);
	
为了只渲染背面，我们可以在<code>drawArrays</code>或者<code>drawElements</code>之前调用<code>gl.cullFace(gl.FRONT)</code>，相应地我们可以通过<code>gl.cullFace(gl.BACK)</code>来渲染正面。

下面的图表展示了使用α混合和表面选择来创建透明物体的步骤。
![](http://gtms03.alicdn.com/tps/i3/TB1IUdbHXXXXXaQXFXXfvkiHpXX-776-514.png)

下面我们看一看实际的样子：

[前景背景图](http://gonghao.alidemo.cn/exercise/chapter6/ex6-6.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter6/ex6-6.html)>

![](http://gtms02.alicdn.com/tps/i2/TB1rVBfHXXXXXXkXpXX1qxQIXXX-2392-828.png)

在上面的例子中，我们使用了这样的代码控制culling：

	if(showBackFace){
		gl.cullFace(gl.FRONT);
		gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT,0);
	}
	if (showFrontFace){                    
	  	gl.cullFace(gl.BACK);
	  	gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT,0);
	}
	
很简单，如果显示背景，把前景挖掉；如果显示前景，把背景挖掉。如果都有，那么全都渲染了。

最后让我们看一个例子：

[透明墙和椎体](http://gonghao.alidemo.cn/exercise/chapter6/ex6-7.html)

<[源码](https://github.com/fem-d/webGL/blob/master/chapter6/ex6-7.html)>

![](http://gtms02.alicdn.com/tps/i2/TB1rVBfHXXXXXXkXpXX1qxQIXXX-2392-828.png)


在这章中，我们学习了如何在物体，光照，场景中使用颜色。尤其是如何vertex着色，fragment着色，以及纯色。

场景中的光照颜色是由光照模型决定的。我们已经知道如何使用uniform来简化多光源的问题。我们还学习了如何创建径向光源。

单单一个alpha值并不会使得物体透明，插值混合（interpolative blending）是创建透明物体必需的。另外，请记住物体需要由后往前渲染。

面剔除（face culling）在多个透明物体的场景能创建更好的结果。

在下一章中《纹理》中，我们将学习如何使用图片覆盖物体。为此我们需要用到<code>WebGL textures</code>。



























