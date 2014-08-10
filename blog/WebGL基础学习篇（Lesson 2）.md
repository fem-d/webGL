# WebGL基础学习篇（Lesson 2）
____

>WebGL采用“分而治之”的方法实现渲染。复杂的多边形被分解为三角形，线条和点等基本元素。接着这些基本元素通过渲染流水线被GPU并行处理，最后形成了我们在屏幕上看到的场景。

### Vertices and Indices
Vertices是定义3D对象边界的点。每个vertex都由三个浮点数组成，分别对应X轴，Y轴和Z轴。和OpenGL不同的是，WebGL并没有提供单独操作单个点进行渲染的API，因此我们需要将所有的vertices写在一个**JavaScript数组**中，并使用它创建WebGL vertex缓存。  
Indices是vertices的数字标签（numeric labels）。Indices告诉WebGL如何连接vertices。与vertices相同的是，indices同样也使用数组来创建WebGL index缓存。
>在WebGL中，有两种WebGL缓存被用作描述和处理对象。包含vertex数据的缓存被称为Vertex Buffer Objects(VBOs)。包含index数据的缓存被称为Index Buffer Objects(IBOs)。

### Overview of WebGL's rendering pipeline
![](http://gtms01.alicdn.com/tps/i1/T11ywaFgXnXXaPT4YB-924-604.png)
#### Vertex Buffer Objects[VBOs]
VBOs保存了WebGL用于渲染对象的数据。如前面说的，vertex的坐标在VBOs中被存储及处理。不仅如此，VBOs中还有其他的（如vertex法线，颜色，纹理）数据。
#### Vertex shader
vertex shader会处理每个vertex，包括位置，颜色，纹理等。这个数据会在vertex shader中以属性的方式保存，每个属性都指向了一个VBO。
#### Fragment shader
每三个vertices形成了一个三角形，而表面元素（三角形）需要被上色，否则它只能是透明的。  
每个表面元素（surface element）被称为一个fragment，我们习惯于把它们叫做pixels。  
下图显示了fragment shader的作用：
![](http://gtms01.alicdn.com/tps/i1/T1cOZCFa8kXXbUchL1-696-360.png)
#### Framebuffer
Framebuffer是一个二维的缓存，它包含了用于fragment shader渲染的fragments。一旦所有fragments被处理了，一个2D的图像就呈现在我们眼前了。
framebuffers是整个渲染流水线的最后一步。
#### Attributes, uniforms, and varyings
Attributes, uniforms和varyings是我们做渲染编程时需要使用的三个变量（写C代码时……）。Attributes是用于vertex shader的输入值（如vertex的位置，颜色）；uniforms用于vertex shader以及fragment shader中（如lights position）；varyings用于将vertex shader中处理的数据传入fragment shader中。

### Rendering geometry in WebGL
1. 首先，我们需要用JavaScript数组定义一个模型；
2. 接着，我们需要定义WebGL buffers；
3. 第三步，我们需要将一个vertex shader属性指向刚刚我们创建的VBO以保存vertex信息；
4. 最后，使用这个VBO进行渲染。

### Creating WebGL buffers
	var vertices = [-50.0, 50.0, 0.0,
							-50.0, -50.0, 0.0,
							50.0, -50.0, 0.0,
							50.0, 50.0, 0.0];
	var myBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, myBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
在上面的例子中，我们首先创建了一个JavaScript数组，接着我们创建了一个WebGL buffer。
>bindBuffer的第一个参数是表明buffer的类型，我们有两个选择：gl.ARRAY_BUFFER和gl.ELEMENT_ARRAY_BUFFER，分别存储vertex data和index data。

绑定了buffer后，我们需要为buffer传值。WebGL并不接收JavaScript数组作为它的参数，因此我们必须将它转化为类型数组（typed array）。
>类型数组的规范可见[typed array](http://www.khronos.org/registry/typedarray/specs/latest)。

最后我们需要解除buffer绑定。正如前面所讲，WebGL是一个状态机，除非更改属性否则它会一直保持该状态。

### Associating attributes to VBOs
一旦VBOs创建成功，我们就可以将它们和vertex shader的属性绑定起来。每个vertex shader的属性只会与一个VBO关联。
![](http://gtms01.alicdn.com/tps/i1/T14flgFD0eXXXbBz.Z-868-638.png)

我们需要实现以下步骤：
1. 首先我们绑定VBO。
2. 接着我们将某个属性指向该VBO。
3. 最后，我们启用该属性。

### Binding a VBO
在前面的例子中，我们已经知道可以这样绑定VBO：

	gl.bindBuffer(gl.ARRAY_BUFFER, myBuffer);
	
### Pointing an attribute to the currently bound VBO
WebGL中提供了vertexAttribPointer方法将WebGL属性指向目前绑定的VBO：

	gl.vertexAttribPointer(Index, Size, Type, Norm, Stride, Offset)
	
* Index: 需要绑定的属性的索引值。
* Size: 表示buffer中几个值代表一个vertex。
* Type: 表示buffer中数据的类型，一般有FIXED, BYTE, UNSIGNED_BYTE, FLOAT, SHORT, UNSIGNED_SHORT。
* Norm: 这个参数可以设为true或者false，它涉及的数据转换不在这个教程里讲述。一般我们都将它设为false。
* Stride: 如果为0，表示buffer中的数据是按顺序存储。
* Offset: buffer的偏移值，如果设置了则会从Offset的位置开始。

### Enabling the attribute
最后，我们需要激活该属性。

	gl.enableVertexAttribArray(aVertexPosition);
	
整个过程如下所示：
![](http://gtms01.alicdn.com/tps/i1/T1QvG9FjBmXXbLGUkX-1200-776.png)

### Rendering
一旦我们定义了VBOs而且将它们绑定到了shader的属性上，我们就可以开始渲染了。
为此我们需要使用到两个API: drawArrays和drawElements。

### The drawArrays and drawElements functions
drawArrays和drawElements用于在framebuffer上渲染。
drawArrays按照在buffer中渲染的顺序使用vertex数据。相反，drawElements使用indices来处理vertex data buffers并创建对象。drawArrays和drawElements只能使用被激活的数组（enabled arrays）。  
在我们的例子中，我们只用了一个激活数组：含有vertex坐标的buffer。但是在通常情况下，我们可以有多个激活数组。我们可以使用数组存储其他的一些vertex信息，如vertex颜色，vertex法线或是纹理位置等。对于每个数组，我们都需要使用激活的vertex shader属性与之对应。

#### Using drawArrays
我们可以在没有indices信息的时候使用drawArrays。在图形相当简单的情况下我们一般只使用drawArrays方法，比如图形仅仅是一个三角形或四边形时。WebGL会按VBO中定义的数据顺序创建图形。如果在创建图形时有大量重复的点，使用drawArrays是不明智的。重复的vertex信息会引发重复的vertex shader调用从而导致性能下降。
![](http://gtms01.alicdn.com/tps/i1/T1p.nGFh8rXXcAyI_6-1060-768.png)
接口参数如下：
	
	gl.drawArrays(Mode, First, Count)
	
* Mode: 表示对应的渲染方式。可能的值有gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN和gl.TRIANGLES（具体的效果将在示例2中展示）。
* First: 激活数组中开始的位置。
* Count: 需要渲染的元素数目。

#### Using drawElements
与drawArrays不同，drawElements允许我们使用IBO来定义WebGL如何渲染图形。与drawArrays会重复渲染vertices不同，drawElements使用了indices来定义点与点之间的连接，因此每个点只需要渲染一次，从而大量减少了GPU的负担。如下图所示：
![](http://gtms01.alicdn.com/tps/i1/T1_RvNFd8iXXbSzFHZ-1054-772.png)
在使用drawElements时，我们需要使用两个缓存VBO和IBO。vertex shader会处理每个VBO中的vertex，之后渲染管线会使用IBO将这些vertex组成对应的三角形。
接口参数如下：

	gl.drawElements(Mode, Count, Type, Offset)
	
* Mode: 表示对应的渲染方式。可能的值有POINTS, LINE_STRIP, LINE_LOOP, LINES, TRIANGLE_STRIP, TRIANGLE_FAN和TRIANGLRS。
* Count: 需要渲染的元素数目。
* Type: 表示indices的数据类型。必须为UNSIGNED_BYTE或是UNSIGNED_SHORT,indices必须是整数。
* Offset: 表示indices从哪个开始，通常为0。

> [示例1：创建简单的图形](https://github.com/fem-d/webGL/blob/master/chapter2/ex2-1.html)

> [示例2：Rendering Mode](https://github.com/fem-d/webGL/blob/master/chapter2/ex2-2.html)
























