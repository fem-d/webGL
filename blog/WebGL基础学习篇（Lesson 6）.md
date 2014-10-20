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

























