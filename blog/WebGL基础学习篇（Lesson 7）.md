# WebGL基础学习篇（Lesson 7）
___

> 目前我们已经学会在场景中添加位置（geometry），点颜色（vertex colors）以及光照（lighting）；但是这对于我们想达到的还远远不够。如果能往场景上添加更多的“绘制（paint）”而不需要更多的位置信息岂不是更好？我们可以通过纹理（texture mapping）来实现。在这章中，我们会使用纹理来使得我们的场景更加生动。

### 大纲

* 如何创建纹理
* 如何在渲染时使用纹理
* 过滤（filter）和包裹（wrapping）模式以及它们如何影响纹理
* 多纹理（Multi-texturing）
* 为正方体加纹理

### What is texture mapping
纹理从字面上理解就是使用图片渲染在物体的表面上。正如下面的图所示：
![](http://gtms04.alicdn.com/tps/i4/TB1Q7C_HXXXXXc3XpXX4dTZSXXX-410-370.png)

使用目前我们已学到的知识来做这样一个场景会变得相当复杂。图中WebGL的logo必须通过许多小三角仔细组合才能创建出来。虽然技术上也是可以的，但是额外的位置信息会随着场景的复杂而急剧上升。

幸运的是，纹理使得上面的工作变得简单。我们需要的仅仅是一个规定格式的WebGL logo，一个vertex属性，以及额外的几行渲染器代码。

### Creating and uploading a texture

首先，由于多方面的原因浏览器在读取纹理时是“由上往下”的顺序，这要是OpenGL中的方式。因此，在WebGL中我们需要在texture上颠倒Y坐标轴。我们可以使用以下的代码实现：

	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	
是否启用由你决定，但是本章中会一直启用。

创建纹理的方式和我们创建vertex buffer或者index buffer的方式非常类似。我们可以这样创建纹理：

	var texture = gl.createTexture();
	
纹理，和缓存类似，必须在操作前绑定。

	gl.bindTexture(gl.TEXTURE_2D, texture);
	
第一个参数是我们需要绑定的纹理类型（或者说是纹理绑定地址）。现在我们主要讲2D纹理，更多的类型我们会在后面讲到。

绑定了纹理后，我们可以加上图片信息。最简单的方法是将DOM图片传入<code>textImage2D</code>中，如下面所示：

	var image = document.getElementById("textureImage");
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
图片的DOM元素作为最后一个参数传入texImage2D中。当texImage2D被调用时，WebGL会根据传入的图片尺寸自动判断大小。其他的参数告诉WebGL图片的信息以及如何存储它。一般来说你需要关心的只有第三个和第四个参数，当然在没有透明信息是也可以只使用<code>gl.RGB</code>。

对于图片，我们还需要告诉WebGL如何在渲染时过滤纹理。我们稍后马上会告诉大家什么是过滤以及不同过滤模式的区别，现在先让我们看一个最简单的用例：

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	
最后，如同buffers一样，我们要养成解绑的操作，我们可以这样：

	gl.bindTexture(gl.TEXTURE_2D, null);
	
当然我们不希望太多的图片在页面中显示出来，为此，我们只需要创建image对象就行了。

	var texture = gl.createTexture();
	var image =new Image();
	image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	image.src = "textureFile.png";
	
OK，我们总结一下创建纹理的步骤：

* 创建一个新的texture对象
* 将它绑定起来
* 传递图片信息
* 设置过滤模式或其他纹理参数
* 解绑

当我们确定不再需要某个texture对象时，我们可以释放它以及它占用的内存：

	gl.deleteTexture(texture);
	
### Using texture coordinates

现在我们准备好了纹理，接下来需要将它作用到物体上。接下来的问题是我们怎么控制在不同的面上显示不同的纹理。这里我们需要用到另外一个叫做<code>texture coordinates</code>的vertex属性。

纹理坐标（Texture coordinates）是一个由两个浮点数组成的向量数组，它描述了纹理的坐标。稍微不同的是，WebGL强制规定了坐标的范围为[0, 1]，也就是左上角的点为[0, 0]，右下角的点为[1, 1]，如图所示：
![](http://gtms04.alicdn.com/tps/i4/TB1FVfeHXXXXXb6XXXXO8nuMFXX-472-474.png)

这样的话，如果你想对应到纹理中心的话，纹理坐标就是[0.5, 0.5]。这个坐标系对于长方形的纹理同样适用。

这种方式虽然一开始会觉得奇怪。但是以特定的点来定位显然比通过宽高来定位简单多了。试想你现在适用了一个很高的图片来作为纹理，但是由于图片过大或过高的原因需要改小，适用像素你必须修改对象的像素值，但是使用[0,1]就不需要了。

判断出物体（特别是复杂的物体）对应的纹理坐标是创建3D资源最有技巧的部分之一，幸运的是有许多3D建模工具为woman提供了丰富的功能。这个过程叫做三维重建（unwrapping）。

> 和vertex position用X、Y、Z代表坐标轴一样，texture coordinates也用符号表示。不幸的是，在不同的3D软件中这些符号并不一致。OpenGL使用S和T表示，DirectX使用U和V。因此你可能会发现有人使用“UVs”来代表texture coordinates，使用“UV Mapping”来表示三维重建（unwrapping）。
> 
> 这篇文章中我们会使用ST来表示。

### Using textures in shader

纹理坐标以相同的方式在渲染器中被使用。我们需要定义一个二维向量来存储：

	attribute vec2 aVertexTextureCoords;
	
和其他vertex attribute一样，我们需要将前面说到的纹理坐标通过这个属性传递进去。
	
另外，我们还需要在fragment shader中添加一个我们此前没有见过的uniform：sampler2D。这个属性允许我们访问shader中的纹理信息。

	uniform sampler2D uSampler;
	
在之前的例子中，我们总是往unifrom中放入我们想要的值，像光线颜色等。<code>Samplers</code>则不一样。现在让我们看看如何将纹理和sampler uniform关联起来：

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(Program.uSampler, 0);
	
首先，我们激活了对应的texture。WebGL支持多纹理（后面会讲到），因此定义纹理时加上序号是个不错的选择。然后，我们绑定要使用的texture，这时texture就和TEXTURE0关联起来了。最后，我们告诉渲染器使用TEXTURE0。

做完这样，我们需要为在fragment shader中使用纹理做准备。最简单的方式是将texture作为最终颜色传递过去：

	gl_FragColor = texture2D(uSampler, vTextureCoords);
	
<code>texture2D</code>将sampler uniform和坐标作为参数，返回一个基于坐标的纹理颜色，即一个四维向量。即使图片没有alpha通道，它依然会返回一个alpha为1的四维向量。

说了这么多理论，我们来看一个实例：

[最简单的纹理](http://gonghao.alidemo.cn/exercise/chapter7/ex7-1.html)

[<源码>](https://github.com/fem-d/webGL/blob/master/chapter7/ex7-1.html)

![](http://gtms04.alicdn.com/tps/i4/TB1GPa9HXXXXXcvXFXXz1YeNFXX-1500-776.png)

### Texture filter modes

现在我们已经知道了纹理如何在fragment shader中使用，但是还仅限于最基本的使用场景，在更复杂的情况下仍然有许多问题。

拿刚才的demo为例，当我们放大时，我们会发现WebGL logo边缘会出现很多锯齿，当logo很小时也会有这样的问题。

那么这些锯齿是怎么出现的呢？

想想上一章中我们讲到的vertex colors会做插值(interpolate)，因此fragment shader得到的会是一个平稳的颜色过渡。纹理坐标也是使用相同的方式，纹理坐标与屏幕像素对应。在最理想的情况下，它们会是1比1对应上的。

![](http://gtms03.alicdn.com/tps/i3/TB1kX1_HXXXXXc8XFXX7B6uWXXX-628-556.png)

但是，在真实情况下，纹理一般都不在本来的位置上显示。比如说放大和缩小，这都是纹理比屏幕有更低或更高的分辨率。

![](http://gtms04.alicdn.com/tps/i4/TB1pKG.HXXXXXbDXFXXkJrG7XXX-1090-526.png)

当一个纹理被放大或缩小时，texture sampler会返回什么颜色就是有歧义的了。考虑一下这种情况，纹理被稍稍放大了：

![](http://gtms01.alicdn.com/tps/i1/TB1eK_gHXXXXXazXXXXvSq.GFXX-456-426.png)

决定左上角或者正中的颜色很容易，但是马赛克（texels）之间的颜色呢？这都是由你的过滤模式决定的。我们可以通过纹理过滤控制纹理取样的方式以达到我们想要的结果。

设置纹理过滤非常简单，我们在前面的例子里已经看过了。

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	
和WebGL中大多数方法一样，<code>texParamteri</code>会操作当前绑定的纹理，而且每个纹理都必须设置。这就是说不同的纹理可以有不同的过滤方式。

在这个例子中，我们同时将放大过滤器（TEXTURE_MAG_FILTER）和缩小过滤器（TEXTURE_MIN_FILTER）设置为了<code>NEAREST</code>。这第三个参数可以传递不同的值，最快理解的方法就是实际看一下。

[texture filter属性](http://gonghao.alidemo.cn/exercise/chapter7/ex7-2.html)

[<源码>](https://github.com/fem-d/webGL/blob/master/chapter7/ex7-2.html)

![](http://gtms02.alicdn.com/tps/i2/TB1_hi_HXXXXXabXVXXaRVj2FXX-1002-806.png)





















