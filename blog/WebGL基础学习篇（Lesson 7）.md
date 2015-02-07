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

现在让我们深入学习下每种过滤方式的工作原理。

#### NEAREST

使用NEAREST过滤器的纹理始终会返回最接近样本点的马赛克（texel）中心点的颜色。在这种模式下纹理会呈现出块状像素化，适合“复古（retro）”的图像。NEAREST在MIN和MAG过滤器中都适用。

![](http://gtms01.alicdn.com/tps/i1/TB1dzYJHXXXXXcMXpXXVcP25FXX-544-398.png)

#### LINEAR

LINEAR过滤器返回以样本点为中心四个方向上像素的平均值。这会形成一个逐渐过渡的颜色，这效果通常也是更理想的。但是这也意味着显卡需要消耗四倍的工作量来完成二个工作，所以它比NEAREST要慢，幸运的是，现在显卡速度很快，我们几乎察觉不到。LINEAR在MIN和MAG过滤器中都适用。这个过滤器也被叫做<code>bilinear filtering</code>。

![](http://gtms04.alicdn.com/tps/i4/TB1IR2QHXXXXXXHXXXXNcyYNXXX-610-442.png)

现在让我们看看两者的差异（放大的情况下）：


![](http://gtms04.alicdn.com/tps/i4/TB1elTEHXXXXXaDXFXXJfKcIXXX-1562-588.png)
NEAREST filter
![](http://gtms03.alicdn.com/tps/i3/TB1gUbDHXXXXXc5XVXXla4FIFXX-1670-560.png)
LINEAR filter

#### Mipmapping

在讨论其他只适用于<code>TEXTURE_MIN_FILTER</code>过滤方式之前，我们需要先引入一个新概念：mipmapping。

当需要渲染缩小的样本时，我们会遇到这样一个问题：即使是使用LINEAR过滤，样本点也会因为离的太远而损失精度。下面的图显示了这个问题，右边是将缩小的正方体放大400倍的演示图，这样我们能更清楚的发现问题。

![](http://gtms01.alicdn.com/tps/i1/TB1DLzJHXXXXXa0XFXXi2C10FXX-744-504.png)

为了避免这种情况，显卡需要实现mipmap chain。

mipmaps是一系列缩小的纹理副本，每一个副本都是前者的一半大小。如果将这些纹理以一行的形式展示，那么就是：

![](http://gtms04.alicdn.com/tps/i4/TB18jYFHXXXXXcmXVXXD51S5pXX-1084-546.png)

这样做的好处是，当渲染时显卡会选择最接近当前尺寸的纹理。但是，mipmapping只在某些纹理过滤时能被使用。TEXTURE_MIN_FILTER就是其中一种。

##### NEAREST_MIPMAP_NEAREST

这种过滤方式会选取最接近屏幕上纹理的mipmap，并且使用<code>NEAREST</code>来实现。

##### LINEAR__MIPMAP_NEAREST

这种过滤方式会选取最接近屏幕上纹理的mipmap，并且使用<code>LINEAR</code>来实现。

##### NEAREST_MIPMAP_LINEAR

这种过滤方式会选取两个最接近的mipmap，并且使用<code>NEAREST</code>来实现，最后的颜色会是两种样本的平均值。

##### LINEAR_MIPMAP_LINEAR

这种过滤方式会选取两个最接近的mipmap，并且使用<code>LINEAR</code>来实现，最后的颜色会是两种样本的平均值。这也叫做三线性过滤(trilinear filtering)。

![](http://gtms01.alicdn.com/tps/i1/TB1ge63HXXXXXXgXpXXPxzk6pXX-438-236.png)

在所有的MIPMAP过滤模式中，NEAREST_MIPMAP_NEAREST是最快但质量最低的，而LINEAR_MIPMAP_LINEAR则是最慢但质量最高的，另外两种则徘徊其中。在大多数情况下，性能的损失并不是那么重要，因此尽量使用LINEAR_MIPMAP_LINEAR。

#### Generating mipmaps

WebGL并不自动为每个纹理创建mipmap，因此如果你要使用，你需要先创建它们。幸运的是，这很简单：

	gl.generateMipmap(gl.TEXTURE_2D);
	
<code>generateMipmap</code>必须在<code>texImage2D</code>之后使用，并且会自动创建完整的mipmap链。

如果你想手动提供mipmaps，你需要在调用texImage2D时主动传入一个非0的参数作为函数的第二个参数。

	gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mipmapImage);
	
这里我们手动的创建了第一级的mipmap，它只有原图的一半大小。第二级只有四分之一大小，以此类推。

这在一些高级功能下非常有用，或者是处理一些无法在generateMipmap中使用的被压缩图片。

为了使纹理在mipmap中被使用，我们还需要遵守一些尺寸限制。如字面上说的，纹理的宽高必须是2的幂次方，比如16px, 32px, 64px等。还要注意的是，宽高必须要相等，所以512*128的纹理也是可以的。

非2幂次方的纹理依然可以在WebGL中使用，但是只能用于NEAREST和LINEAR过滤器中。

### Texture wrapping

在前面的章节中，我们使用了<code>texParameteri</code>来设置纹理的过滤方式，但是正如它的名字所表示的，这并不是它的所有功能。另外一种我们可以操作的方式叫做纹理包装（texture wrapping）。

纹理包装描述了在0到1范围外的纹理坐标的行为。

这种方式独立于ST坐标系，使用它需要调用两个方法：

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
这里我们在两个方法中都绑定了<code>CLAMP_TO_EDGE</code>，具体的效果我们将在后面讲到。

直接查看实例总是比单纯的概念描述简单，所以我们直接看例子好了。


[不同的包裹模式](http://gonghao.alidemo.cn/exercise/chapter7/ex7-3.html)

[<源码>](https://github.com/fem-d/webGL/blob/master/chapter7/ex7-3.html)

![](http://gtms03.alicdn.com/tps/i3/TB1jUEmHXXXXXXdXFXXhQdnLVXX-1038-942.png)

#### CLAMP_TO_EDGE

![](http://gtms03.alicdn.com/tps/i3/TB1D6coHXXXXXbHXpXXdYIB8XXX-444-440.png)

这种包裹方式将所有不在0到1范围内的纹理坐标都近似到最近的有效点上。所以我们看到的0到1范围外的纹理都是纹理边缘上的纹理（所以出现上图看到的横线和竖线）。注意，只有这种包裹方式支持非2次幂纹理。

#### REPEAT

![](http://gtms01.alicdn.com/tps/i1/TB1JqQrHXXXXXXZXXXXlMjS9pXX-446-450.png)

这是默认的包裹方式，也是最常使用的。在数学上，这种方式会忽略纹理坐标的整数部分。因此在0到1范围外就是重复的纹理。

#### MIRRORED_REPEAT

![](http://gtms04.alicdn.com/tps/i4/TB1K4AnHXXXXXcNXpXXV6CK1FXX-430-432.png)

这种方式的纹理算法更加复杂。如果纹理坐标的整数部分是偶数，纹理坐标的实现和REPEAT一致。如果是奇数，那么最后的值是1减去当前纹理坐标。这样得到的结果就是镜子倒映的展现形式。

如前面说的，这些模式可以是混合的，比如我们这样做：

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXUTRE_WRAP_T, gl.CLAMP_TO_EDGE);
	
![](http://gtms04.alicdn.com/tps/i4/TB1CusiHXXXXXchapXXqFpeQpXX-478-480.png)

> 想知道为什么shader uniforms被叫做samplers而不是textures？一个texture仅仅是存储在GPU中的图片数据，而sampler包含所有的纹理信息，如过滤和包裹。

### Using multiple textures

到目前为止，我们每次只加了一个纹理。但是在很多场景下我们需要使用多纹理来创建更复杂的效果。为此，我们可以使用WebGL提供的功能在一次<code>draw</code>中操作多纹理，这也被叫做多纹理渲染（multitexturing）。

之前我们已经提到了多纹理的内容，所以让我们再复习下。我们有这样的代码：

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
第一行中<code>gl.activeTexture</code>就是实现多纹理的关键代码。我们使用它来告诉WebGL状态机哪个纹理是我们想操作的。在这个例子中，我们使用了<code>gl.TEXTURE0</code>，这就是说后续的操作对象都是第一个纹理单元。如果我们想切换到第二个纹理，使用<code>gl.TEXTURE1</code>就可以了。

不同的设备支持的纹理单元个数也不尽相同，但是WebGL规范规定了必须支持至少两个单元。我们可以使用以下的方法来获取设备支持的个数：

	gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
	
WebGL提供了从<code>gl.TEXTURE0</code>到<code>gl.TEXTURE31</code>。我们还可以使用<code>gl.TEXTURE0 + i</code>来指向<code>gl.TEXTUREi</code>，比如：

	gl.TEXTURE0 + 2 === gl.TEXTURE2;
	
在渲染器中操作多纹理也非常简单：

	uniform sampler2D uSampler;
	uniform sampler2D uOhterSampler;
	
在调用draw函数前，你可以动态的告诉渲染器你要使用哪一个。比如：

	// Bind the first texture
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(Program.uSampler, 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, ohterTexture);
	gl.uniform1i(Program.uOtherSampler, 1);
	
现在我们有两个纹理了。问题是我们如何使用它们？

作为例子，我们将实现一个多纹理的场景。

[多纹理](http://gonghao.alidemo.cn/exercise/chapter7/ex7-4.html)

[<源码>](https://github.com/fem-d/webGL/blob/master/chapter7/ex7-4.html)

![](http://gtms03.alicdn.com/tps/i3/TB1mSUqHXXXXXbiXXXXLrFWFFXX-910-806.png)

#### 例子讲解

在脚本中，我们首先定义了另一个texture变量：

	var texture2 = null;
	
在<code>config</code>最后，我们需要添加这个纹理：

	texture2 = new Texture();
	texture2.setImage('textures/light.png');
	
这个纹理是这样的：

![](http://gtms02.alicdn.com/tps/i2/TB1hfQmHXXXXXaoXFXXexM9GFXX-352-354.png)

在<code>draw</code>方法中，我们将这个纹理绑定到渲染器：

	gl.activeTexture(gl.TEXTURE);
	gl.bindTexture(gl.TEXTURE_2D, texture2.tex);
	gl.uniform1i(Program.uSampler2, 1);
	
接下来，在渲染器中定义这个uniform：

	uniform sampler2D uSampler2;
	
最后，我们将两个纹理混合起来。在这个例子中，我们期望第二个纹理有光照得效果，因此将两个值相乘：

	gl_FragColor = texture2D(uSampler, vTextureCoord) * texture2D(uSampler2, vTextureCoord);
	
注意我们在两个纹理中都使用了相同的纹理坐标。在这个例子中我们是为了方便而这样做，如果有需要的话也可以设置不同的纹理坐标。

纹理如何混合并不是固定的，我们也可以这样做：

	gl_FragColor = vec4(texture2D(uSampler2, vTextureCoord).rgb - texture2D(uSampler, vTextureCoord).rgb, 1.0);
	
得到的图就是：

![](http://gtms03.alicdn.com/tps/i3/TB1ZxksHXXXXXXyXXXX1nVA3FXX-856-802.png)

### Cube maps

在前面我们说过除了2D纹理外，我们还可以使用立体地图（cube maps）。

立体地图，如它的字面表达的，是一个立体的纹理。六个面的纹理都被创建，并且关联到每个面上。显卡可以使用3D纹理坐标来将它们样本化（sample）。

每个面都根据它们所在的坐标轴和正负值来标记。

![](http://gtms03.alicdn.com/tps/i3/TB1Y68ZHXXXXXXjapXX5O8r3pXX-540-404.png)

到目前为止，我们使用的纹理对象还是<code>TEXTURE_2D</code>。立体地图引入了新的纹理对象，它和立体的各个面相对应：

* TEXTURE_CUBE_MAP
* TEXTURE_CUBE_MAP_POSITIVE_X
* TEXTURE_CUBE_MAP_NEGATIVE_X
* TEXTURE_CUBE_MAP_POSITIVE_Y
* TEXTURE_CUBE_MAP_NEGATIVE_Y
* TEXTURE_CUBE_MAP_POSITIVE_Z
* TEXTURE_CUBE_MAP_NEGATIVE_Z

立体地图创建方式和纹理一样，唯一不同的就是纹理对象：

	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, positiveXImage);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, positiveXImage);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, positiveYImage);
	// Etc.
	
绑定到渲染器也是相同的方法：

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
	gl.uniform1i(Program.uCubeSampler, 0);
	
渲染器中我们这样定义：

	uniform samplerCube uCubeSampler;
	
最后，定义fragment的最终颜色：

	gl_FragColor = textureCube(uCubeSampler, vCubeTextureCoord);
	
你提供的3D坐标会被显卡规范化为一个向量，它定义了从立体中心指向面的方向。一个向量会沿着这个方向，与立体面接触的地方就是纹理渲染的地方。

![](http://gtms01.alicdn.com/tps/i1/TB1ybwjHXXXXXbZapXX.SRq_XXX-450-428.png)

[立体地图](http://gonghao.alidemo.cn/exercise/chapter7/ex7-5.html)

[<源码>](https://github.com/fem-d/webGL/blob/master/chapter7/ex7-5.html)

![](http://gtms01.alicdn.com/tps/i1/TB1qs7rHXXXXXbXXXXXhRLO4VXX-1006-806.png)

#### 例子重点讲解

需要注意的是，在渲染器中我们使用了vertex normals而不是每个面的纹理坐标，这会给我们镜子一般的感觉。但是，实际上的normals都是指向外面的。如果我们要使用它们，我们只能得到一个颜色。在这个例子中，我们“欺骗”了渲染器，并使用了vertex postion而不是normal。（在大多数模型中，使用normals更合适）

	vVertexNormal = (uNMatrix * vec4(-aVertexPosition, 1.0)).xyz;
	
> 这个没明白为什么，求有了解的同学告知，附上失败的效果图。

![](http://gtms01.alicdn.com/tps/i1/TB1LtAkHXXXXXajapXXyAFC3FXX-856-812.png)

在这章中我们学到了如何使用纹理。

我们测试了不同的过滤效果和包裹效果，以及它们对于纹理有如何的影响。我们学习了使用多纹理。最后，也知道了立体地图的使用方式，以及如何做出倒映效果。

在下一章中，我们会学习如何选择和接触场景中的物体。




	














