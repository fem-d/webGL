# WebGL基础学习篇（Lesson 4）
____

>在本章中，我们将学习之前代码中看到的矩阵的相关知识。这些矩阵可以表示场景的转换。我们在前一章的Nissan GTS model中使用过它改变视角的距离。简单来说，我们通过使用矩阵移动了摄像头和场景中的物体。

虽然前面序言说到了摄像头，但是WebGL API里是没有的（what the f**k，裤子都脱了你就让我看这个！），但是不用担心，我们可以使用矩阵来代替摄像头，这让我们有更多的灵活性来实现复杂的动画（下一章会讲到）。在这章里，我们将学习矩阵变换以及如何实现摄像头。
### 大纲
* 理解从3D到2D转换过程
* 学习仿射变换（affine transformation）
* 将矩阵映射到ESSL uniforms
* 学着使用model-veiw matrix和perspective matrix
* 理解矩阵中元素的意义
* 创建一个摄像头并使用它移动3D场景

### WebGL没有摄像头
再次强调下这个问题。那么，我们用什么来解决这问题呢？答案很简单，在屏幕上我们看到的其实就相当于摄像头看到的，因此我们只需要一个4*4的矩阵就可以了。  
每次我们移动视角，实际上相当于更新了“摄像头”的位置。为此，我们需要相应地对每个vertex做一次变换。同样的，我们也必须保证在每次摄像头移动后法线和光线保持既有的状态。总而言之，我们需要考虑两种不同的变换：vertex和normal。

### Vertex transformations
在我们看到场景中的物体前其实它们已经经过了很多次矩阵变换，每次变换都是通过一个4*4的矩阵来实现的。但是向量是三维的，我们不可能将它与4元矩阵相乘，因此我们需要给向量增加一维。这样每个点都会有一个第四维（齐次坐标homogenous coordinate）。

#### 齐次坐标（Homogeneous coordinates）
在计算机图形学中齐次坐标是非常重要的。它让我们可以使用4*4的矩阵实现仿射变换（如rotation, scaling, shear, and translation）和坐标投影（projective transformation）。
在齐次坐标中，vertices由4部分组成：x,y,z和w。前三个值对应欧几里得空间（笛卡尔坐标系），第四个值代表投影（perspective component），它们组成了投影空间（projective space）。
> 维基上对于[Homogeneous coordinates](http://en.wikipedia.org/wiki/Homogeneous_coordinates)的介绍。简而言之，它可以用等式表示趋近于无穷的点（本人数学也不好，大概是这个意思~）。形象一点的区别是，在欧几里得空间中，平行的线是不能相交的；但是在齐次坐标中会在无限远处相交。

两个坐标系的转换非常简单，下面公式参上：
![](http://gtms01.alicdn.com/tps/i1/T1cRd9Fz8gXXbcN4bB-364-102.png)

正如我们之前代码中所做的：
	
	attribute vec3 aVertexPosition;
	attribute vec3 aVertexNormal;
	
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform mat4 uNMatrix;
	
	varying vec3 vNormal;
	varying vec3 vEyeVec;
	
	void main(void) {
		vec4 vertex = uMVMatrix * vec4(aVertexPosition, 1.0);
		vNormal = vec3(uNMatrix * vec4(aVertexNormal, 0.0));
		vEyeVec = -vec3(vertex.xyz)
		gl_Position = uPMatrix * vertex;}

需要注意的是，对于vertices我们的w值为1，而对于vectors我们的w值为0（0作为除数表示无限远）。

#### Model transform
我们从物体坐标系统开始，这是vertex坐标定义的地方。如果我们想移动这些物体，我们需要使用矩阵进行变换。这些矩阵就是模型矩阵（model matrix）。当它与vertices相乘后，我们就能得到新的vertex coordinates。
![](http://gtms04.alicdn.com/tps/i4/T1lHmQFz8aXXblMPco-850-668.png)

经过model transform后，物体坐标被转换为世界坐标，它决定了物体在场景中的位置。

#### View transform
接下来的变换，view transform将世界原点转换为了视图原点。它根据你的眼睛或是摄像头的位置定位。进行这个变换的矩阵被称为视图矩阵（view matrix）。
![](http://gtms04.alicdn.com/tps/i4/T1eL1QFvBaXXcNEs_l-780-594.png)

#### Projection transform
接下来是projection transform，它决定了视图空间如何被渲染以及它如何被投影到屏幕上。这个区域被称为frustum，它包含了六个面板（近处，远处，上面，下面，左面和右面）：
![](http://gtms04.alicdn.com/tps/i4/T1CJaNFB0hXXaQTVrR-722-566.png)

这六个面板的信息被包含在视角矩阵（perspective matrix）中。任何在这个区域外的vertex都会被抛弃。经过投影变换后，我们可以得到剪切坐标（clipping coordinates）。
frustum的形状和深度决定了从3D投影到2D的投影类型。如果远近面板相同，那就是正投影，否则就是视角投影，如下图所示：
![](http://gtms02.alicdn.com/tps/i2/T1rVuRFpVXXXcVozjk-884-432.png)

#### Perspective division
一旦可视空间决定了，frustum就会被投射到近面板上创建2D图像。由于操作系统和显示设备的差异，为了保持健壮性，WebGL提供了独立于硬件的中间间坐标系统(intermediate coordinate system)。它也被叫做规格化设备坐标（Normalized Device Coordinates（NDC））。
用w除以剪切坐标我们就能获得NDC，这也是这一步叫做perspective division的原因。同时，正如我们前面讲到的，我们从齐次坐标返回到了笛卡尔坐标系。x，y代表物体在2D图像上的位置，z代表深度，如下图所示：
![](http://gtms03.alicdn.com/tps/i3/T1DmuNFr4cXXau2Wnv-1036-578.png)

#### Viewport transform
最后，NDC被转换为视图坐标。它将坐标投影到屏幕上。在WebGL中，通常是canvas提供的空间，如下图所示：
![](http://gtms01.alicdn.com/tps/i1/T1XpyRFwlXXXbOq8vi-806-462.png)
和上面的转换不同，这个转换没有对应的矩阵。我们通常使用WebGL中的viewport方法，后面将会介绍。

### Normal transformations
当vertices变换后，法线向量也相应的需要变换。如果你对前面说到的东西有点映像的话，或许你能想到是使用Model-view matrix（MVMatrix）进行变换。但是MVMatrix会有一些问题：
![](http://gtms03.alicdn.com/tps/i3/T14486Fz4oXXXAvXb2-622-248.png)
在只对一个轴收缩或是剪切变换(shear transformation)时，就如上图一样，可能会导致法线失准。那么如何解决呢？

#### 计算法线向量
本节有大量空间几何知识，不感兴趣的可以跳过，否则就看看吧，回想下高中的美好~  
首先从垂直的定义开始，如果两个向量的点积是0那么它们就是垂直的：

	N*S = 0

这里S代表物体表面向量，令M代表MVMatrix。我们用M变换S得到：

	S' = MS
	
我们期望得到一个矩阵K让我们得到变换后的向量：

	N' = KN
	
我们期望S'和N'应该垂直，因此有：

	N'*S' = 0
	
等式替换，我们有：

	(KN)*(MS) = 0
	
一个点积可以写作将第一个向量置换后与第二个相乘的方式：
>置换的小图标搞不定，用&lt;T&gt;代替

	(KN)<T>(MS) = 0
	
展开置换有：

	N<T>K<T>MS = 0
	
优先计算第二个和第三个矩阵：

	N<T>(K<T>M)S = 0
	
因为N.S = 0, 因此N<T>S = 0, 要使N<T>(K<T>M)S = 0
，必须有(K<T>M) = I， 因此有：

	K<T>M = I
	
接着把K的值找出来：
>逆矩阵的符号用&lt;-1&gt;代替

	K<T>MM<-1> = IM<-1> = M<-1>
	K<T>(I) = M<-1>
	(K<T>)<T> = (M<-1>)<T>
	K = (M<-1>)<T>
	
最后，我们得到了向量矩阵K = (M<-1>)<T>

### WebGL implementation
现在让我们来看看WebGL的实现：
![](http://gtms03.alicdn.com/tps/i3/T1iuOQFD8aXXaoRwcK-1084-564.png)
在WebGL中，我们使用3个矩阵以及一个WebGL方法来实现前面说到的5个变换：
1. Model-View矩阵包括了model和view变换。  
2. Normal矩阵通过先对Model-View矩阵求逆再置换的方式获得。  
3. Perspective矩阵用于projection transformation和perspective division，转化后我们将得到NDC。  
4. 最后，我们使用<code>gl.viewport</code>来将NDC映射到视图坐标上，其原型为<code>gl.viewport(minX, minY, width, height)</code>。

### JavaScript matrices
WebGL并没有提供单独的操作矩阵的方法。因此，我们需要一个JavaScript库来进行矩阵操作。在这个学习教程中我们使用了glMatrix。
>你可以在这里找到[glMatrix](https://github.com/toji/gl-matrix)

### Mapping Javascript matrices to ESSL uniforms
由于Model-View和Perspective矩阵在单个渲染步骤中并不会改变，因此它们一般作为uniforms传入渲染器中。首先，我们要获取uniform的JS引用：<pre><code>var reference = getUniformLocation(Object program, String uniformName)</code></pre>
其次，我们将引用以及对应的矩阵传入渲染器中：<pre><code>gl.uniformMatrix4fv(WebGLUniformLocation reference, bool transpose, float[] matrix)</code></pre>
对于其他的uniform，ESSL也提供了二维，三维以及四维的矩阵：
<pre><code>uniformMatrx[234]fv(ref, transpose, matrix)</code></pre>
第一个参数是uniform引用，第二个参数根据规范必须是false，第三个参数是js matrix浮点对象（也可以是Float32Array对象，这将更有效）。

### Working with matrices in ESSL
让我们回想一下前面Phong vertex shader中的代码，注意这几个矩阵都是uniform mat4类型的。
	
	attribute vec3 aVertexPosition;
	attribute vec3 aVertexNormal;
	
	// Model-View Matrix
	uniform mat4 uMVMatrix;
	// Perspective Matrix
	uniform mat4 uPMatrix;
	// Normal Matrix
	uniform mat4 uNMatrix;
	
	varying vec3 vNormal;
	varying vec3 vEyeVec;
	
	void main(void) {
		vec4 vertex = uMVMatrix * vec4(aVertexPosition, 1.0);
		vNormal = uNMatrx * aVertexNormal;
		
		vEyeVec = -vec3(vertex.xyz);
		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);	}
	
需要注意的是，最后一行相乘的顺序，根据前面讲的转化顺序，先是model transform，接着是view transform，然后是projection transform。但是矩阵相乘不是可交换的，因此需要注意相乘的顺序。
	
### The Model-View matrix
我们使用MVMatrix进行仿射变换。仿射是一个数学名词，指的是不改变物体结构的的变换，如旋转，移动等。幸运的是我们不需要理解如何使用矩阵实现这些变换，我们只需要使用glMatrix库就好了。
>如果你对仿射变换感兴趣的话，可以搜索affine transforms in computer graphices。

### Spatial encoding of the world
一般来说，当我们渲染一个场景时，我们是面向z轴负方向。如下图所示（在后面的例子中我们拿单位矩阵为例）：
![](http://gtms03.alicdn.com/tps/i3/T14kq3FytbXXbjQgTP-477-229.png)

从图中可以看到矩阵中各个数的具体意义：
#### Rotation matrix
矩阵中前三列代表了x，y，z轴，它们组成了3*3的矩阵，这个矩阵包含了旋转的信息。

	[m1, m2, m3] = [1, 0, 0] = x-axis
	[m5, m6, m7] = [0, 1, 0] = y-axis
	[m8, m9, m10] = [0, 0, 1] = z-axis
	
#### Translation vector
最后一列的前三行组成的三维向量定义了偏移量。

	[m13, m14, m15] = [0, 0, 0] = translation
	
#### The mysterious fourth row
第四行没有包含任何特别的信息：

* m4, m8, m12总是为0
* m16（homogeneous coordinate）总是1

### The Camera matrix
最开始的时候我们说过WebGL没有cameral对象，那么现在让我们想象一下如果我们有这么一个cameral matrix，它和MVMatrix一样可以移动和旋转。那么我们需要做的就是如何移动和旋转：

#### Camera translation
现在我们将摄像头移到[0, 0, 4]的位置，即z轴正向4的位置。我们没有摄像头的矩阵，但是我们知道如何移动世界坐标
<pre><code>mat4.translate(mvMatrix, [0,0,4])</code></pre>
这样世界将在Z轴正向4的位置，反过来以为这你的摄像头在[0, 0, -4]的位置，是的，反过来就好，因此要让摄像头在[0, 0, 4]的位置，我们只需要
<pre><code>mat4.translate(mvMatrix, [0,0,-4])</code></pre>
不废话了，上代码，上图，注意页面中的矩阵就是MVMatrix（另外需要特别注意的是移动过程中矩阵只有最后一列前三个值会变化）：  
[MVMatrix translation](https://github.com/fem-d/webGL/blob/master/chapter4/ex4-1.html)
![](http://gtms04.alicdn.com/tps/i4/T1vLa9FEdbXXXwK7wC-1215-573.png)

#### Camera rotation
同样的，如果我们想将摄像头朝右边旋转45度，相当于将世界向左旋转45度。使用glMatrix，我们可以简单的达到目的：
<pre><code>mat4.rotate(mvMatrix, 45*Math.PI/180, [0, 1, 0])</code></pre>
注意mvMatrix的变化：  
[MVMatrix rotation](https://github.com/fem-d/webGL/blob/master/chapter4/ex4-2.html)
![](http://gtms01.alicdn.com/tps/i1/T1vdebFw8mXXXf1qwt-1211-570.png)

让我们来看看MVMatrix的变化，首先我们绕x轴旋转90度：

* 首先看第一列，发现x轴没有变化，还是[1,0,0]
* 再查看第二列，可以发现y轴从[0,1,0]变成了[0,0,1]，这使得我们变成了俯视
* 再看第三列，它代表了z轴，从[0,0,1]变为了[0,-1,0]

[MVMatrix rotation and position](https://github.com/fem-d/webGL/blob/master/chapter4/ex4-3.html)
![]()

>注意：虽然前面的例子中我们都使用了camera matrix，但实际上它只是MVMatrix的逆矩阵，我们可以这样获得<code>mat4.inverse(mvMatrix, cMatrix)</code>


### 关于WebGL中矩阵相乘的思考(重要)
请尽量不要跳过这一节，我们将详细地介绍关于矩阵相乘的知识。
>在继续往下前，我们需要了解的是，在WebGL中矩阵操作的顺序和它们作用于vertices的顺序相反。

现在让我们来阐明这一特征。假设你正书写旋转/移动的代码，即先旋转再移动，最后的转换像这样<code>RTv</code>，R代表4维矩阵旋转，T代表4维移动，v代表vertices。
如果你详细看了前面的例子，你会发现我们在代码中实际上是先移动再旋转。Vertices需要从右往左相乘，因此首先是T，再是R。
在代码中可以很好的体现：
	
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, position);
	mat4.rotateX(mvMatrix, rotation[0]*Math.PI/180);
	mat4.rotateY(mvMatrix, rotation[1]*Math.PI/180);
	mat4.rotateZ(mvMatrix, rotation[2]*Math.PI/180);
	
如果我们是工作在摄像头坐标中，而且想实现同样的变换，我们就需要一些变化：

	M = RT				// MVMatrix是旋转R和位移T相乘
	C = M<-1>			// 已知摄像头坐标是MVMatrix的逆矩阵
	C = (RT)<-1>		// 代入
	C = T<-1>R<-1>	// 逆矩阵运算
	
之前的代码中我们已经将旋转和位移的逆矩阵计算出来了，因此我们需要做的只有变换顺序：

	mat4.identity(mvMatrix);
	mat4.rotateX(mvMatrix, rotation[0]*Math.PI/180);
	mat4.rotateY(mvMatrix, rotation[1]*Math.PI/180);
	mat4.rotateZ(mvMatrix, rotation[2]*Math.PI/180);
	mat4.translate(mvMatrix, position);

### Basic camera types
接下来我们会讨论两个基本的摄像头类型：

* 环绕镜头（Orbiting camera）
* 跟踪镜头（Tracking camera）

#### Orbiting camera
在前面的示例中，我们已经见过世界坐标系或是摄像头坐标系下的旋转和位移了，它们都是以世界为中心进行的。我们可以自由的在场景中以各种角度欣赏对象，也就是所谓的上帝视角。

#### Tracking camera
玩过CS，CF的同学肯定都清楚第一人称视角，是的，这就是这个视角。

#### Rotating the camera around its location
正如我在前面重要的那节说的那样，矩阵相乘的顺序很重要。比如说我们有一个四维的矩阵，R为旋转矩阵，T为位移矩阵，我们有：
<pre><code>TR != RT</code></pre>
总之，相乘的顺序会影响最终结果。先旋转再位移和先位移再旋转得到的结果绝对是不同的。
那么我们怎么实现第一人称视角呢？很简单，将矩阵相乘的顺序颠倒一下就可以了（不考虑光照等情况）。

#### Translating the camera in the line of sight
当我们使用上帝视角时，镜头会一直朝向世界的中心。但是在第一视角时，我们可以自由的查看任何一个地方。因此我们需要知道摄像头相对于世界坐标的方位，下面我们将谈到这方面。

#### Cameral model
和它的逆矩阵MVMatrix一样，Camera matrix也含有摄像头的坐标信息。正如下面图中所示，左上角3*3的矩阵就是它的坐标信息：

* 第一列代表了x坐标，也叫做Right vector
* 第二列是y坐标，也叫做Up vector
* 第三列是z坐标，定义了摄像头向前向后的向量，叫做Camera axis

因为Camera matrix是MVMatrix的逆矩阵，因此这个3*3矩阵告诉了我们camera axes在世界坐标中的朝向。
![](http://gtms04.alicdn.com/tps/i4/T1B4URFqpbXXcIIQ2h-990-510.png)
下面的例子展示了两种不同的视角：
[两个镜头](https://github.com/fem-d/webGL/blob/master/chapter4/ex4-4.html)

### The Perspective matrix
在本章的开头我们就说过Perspective matrix用于将projection transformation转化为perspective division。这个过程也是将3D景象映射为2D图形的过程。
在现实中，perspective matrix决定了能被镜头捕捉到的图像的范围，就如同真实下照相机的镜头长度一样。与真实环境下图像总是会被perspective影响不同，在WebGL中我们有不同的显示方式：正视投影。

#### Field of view
Perspective matrix决定了摄像头的Field of View(FOV)，也就是有多少3D空间能被捕捉到。FOV是一个以角度为度量的指标，可以通过视图角度（angle of view）来改变。
![](http://gtms01.alicdn.com/tps/i1/T1zZ3MFyXcXXbtwRDy-1252-454.png)

#### Perspective or orthogonal projection
透视投影给近的物体赋予了更多的空间。换句话说，也就是近的物体会更大而远的会更小。这也是我们眼睛看到的情景。透视投影给予了我们距离感因为它给了我们大脑深度线索（depth cue）。
相反，正视投影使用的是平行线；这意味着不管距离如何物体都会是原始大小。因此，深度线索在正视投影是丢失了。
在WebGL中，我们可以使用<code>mat4.perspective</code>或者<code>mat4.ortho</code>来分别启用透视或正视投影。它们的API如下：
![](http://gtms04.alicdn.com/tps/i4/T1VR.TFwpaXXacbFsE-1244-1084.png)
接下来让我们体验一下两者的区别：

[透视投影](https://github.com/fem-d/webGL/blob/master/chapter4/ex4-5.html)
![](http://gtms01.alicdn.com/tps/i1/T1KbucFF4XXXcVUdH2-1374-806.png)

[正视投影](https://github.com/fem-d/webGL/blob/master/chapter4/ex4-5.html)
![](http://gtms02.alicdn.com/tps/i2/T10R5aFU8XXXXVTaD7-1376-804.png)
	
在第四章中，我们说到：

* WebGL中是没有摄像头的，但是我们可以使用MVMatrix创建一个；
* 3D图形经过了很多次变换才被显示在屏幕上，这些变换用一个4*4的矩阵表示；
* 变换都是仿射变换，WebGL通过三个矩阵Modle-View Matrix， Perspective Matrix以及Normal Matrix以及一个WebGL操作gl.viewport()来加以实现；
* 所有的仿射变换都是通过4维数组来变换的，因此我们需要扩充一维w。向量的w值总是0，而点的w值则是1；
* 看WebGL场景时，我们一般都是面向z轴负方向，但是我们也可以通过改变Model-View matrix来改变它；
* Camera Matrix是Model-View matrix的逆矩阵，它们的操作是相反的。我们有两种视角——上帝视角和第一人称视角；
* 当进行仿射变换时，法线需要被特别对待。我们需要从Model-View matrix中计算出新的Normal matrix；
* Perspective决定了两种基本投影方式：即透视投影和正视投影。












