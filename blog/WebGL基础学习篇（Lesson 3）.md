# WebGL基础学习篇（Lesson 3）
____

>在WebGL中，我们使用vertex和fragment shaders来创建光的模型。通过shaders我们可以定义数学模型来管理光线效果。在这一章中我们将实现不同的光线算法并观察它们的不同。

>从本章开始，内容会比较多，我们先通过大纲了解本章内容。


###大纲
* 学习光线，法线以及材质
* 学习lighting与shading的区别
* 使用Goraud and Phone shading，以及Lambertian and Phong lighting models
* 定义和使用uniforms, attributes and varyings
* 使用ESSL

### Lights, normals and materials
在现实生活中，我们能看到某个物体是因为它能反射光。一个物体反射光的程度取决于它的位置和离光源的距离，以及表面（通常是由法线和物体的材质决定的）。
#### Lights
光源可以是positional的或者是directional的。当光源的位置会影响场景的亮度时，这样的光就是positional的（例如台灯发出的光，远的物体只能接收到微小的光线）。相反，directional的光不受距离影响（如太阳光）。
positional light通常用空间中的一个点表示，而directional light由一个表示方向的向量表示。为了方便数学运算，我们需要将向量规范化（normalized）。
#### Normals
法线是与物体表面垂直的向量。每个vertex都有一个对应的法线向量，法线向量需要规范化（normalized）。（这个高中空间几何里有说，不懂的面壁去） 
>我们可以通过叉乘来获得法线。

举个例子，如果我们在平面上有三个点p0, p1, p2，我们可以得到两个向量v1 = p2 - p1， v2 = p0 - p1。那么这个平面的发现就是这两个向量的叉乘v1 * v2。如下图所示：
![](http://gtms01.alicdn.com/tps/i1/T12q0uFqdxXXc2G8jV-694-440.png)
使用同样的方法我们可以得到每个vetex的法线。但是当一个vertex同时属于多个平面时，我们又该如何呢？答案是对于每个平面我们都生成一个法线，再通过向量相加得到vertex的最终法线，如下图所示：
![](http://gtms01.alicdn.com/tps/i1/T1lanVFaBsXXbAVvQu-638-548.png)
#### Materials
一个物体的材质通常可以由几个参数来决定，包括颜色及纹理。颜色由RGB来表示，纹理是覆盖在物体上的图片。

### 在流水线中使用lights，normals and materials
我们在第二课里知道WebGL buffers，attributes和uniforms会作为参数传入shader，而varyings用于将参数从vertex shader传入fragment shader，如下图所示：
![](http://gtms01.alicdn.com/tps/i1/T1koEXFblhXXaY8eAc-1168-760.png) 
法线是每个vertex的基础信息，它会被存储在VBO中与WebGL的属性相关联。光线和材质作为uniforms传递，uniforms在vertex shader和fragment shader中都可以使用。这给了我们很多弹性，我们可以在vertex shader中决定光如何反射或者在fragment shader中决定。

#### 并行与attributes、uniforms之间的区别
最重要的区别在于当开始渲染时，GPU会启动多个并行的vertex shader。每个vertex shader都会接收不同的一组attributes，而uniforms对于shader来说更像是常量，每个vertex shader使用的都是同一套。
![](http://gtms02.alicdn.com/tps/i2/T1wq0OFBhaXXX9M1bV-831-576.png)
一旦光线，法线和材质被传入，下一步就需要定义shading and lighting models。

### shading methods and light reflection models
>本小节包含较多几何知识，记住公式就好

阴影（shading）和光照（lighting）这两个术语很容易被混淆。但是它们却代表着两个不同的概念阴影一般表示我们获得每个fragment的最终颜色所采用的描影（interpolation）方式；一旦阴影模型建立了，光照模型决定了如何利用法线、材质和光线来生成最终颜色。光照模型的公式使用了物理的光照反射。

#### shading/interpolation methods
在这一节中，我们将介绍两个基本的interpolation方法：Goraud和Phong shading。

##### Goraud interpolation
Goraud interpolation是在vertex shader中进行计算的。vertex法线会被用于计算中。最后的颜色会通过varying参数传递到fragment shader中。由于渲染管线会提供varying自动描影的功能，最后每个fragment都会具有经过描影的颜色。

##### phong interpolation
Phong interpolation在fragment shader中进行计算。为此，vertex法线会被作为varying传递到fragment shader中。由于描影机制的作用，每个fragment都会有自己的法线。它会被用于生成最后的颜色，具体如下图所示。
![](http://gtms01.alicdn.com/tps/i1/T18BpLFp4TXXbm7rHM-687-500.png)
最后，需要注意的是，shading method并不决定最终颜色，它只是定义了在哪（vertex或者fragment shader中）以及什么描影方式（vertex颜色或者vertex法线）。

#### light reflection model
光照模型与阴影模型毫无关系（如上节最后所说）。

##### Lambertian reflection model
Lambertian反射被广泛的用于漫反射效果（diffuse reflections），它会将光线四面八方反射出去而不是向一个方向（这种叫做specular reflections）。
Lambertian反射的计算方法是计算表面法线和光线的反方向向量的点积，然后将结果与光线颜色和材质颜色相乘。
![](http://gtms02.alicdn.com/tps/i2/T1oSFMFwFbXXcAHEI4-766-544.png)

##### Phong reflection model
Phong reflection描述了一种表面反射的方式，它是相邻反射（ambient），漫反射（diffuse）和镜面反射（specular）的相加。
![](http://gtms04.alicdn.com/tps/i4/T1npxNFvXbXXXkZC6f-909-527.png)
相邻反射反应了场景中的散射光，它与光源无关。
漫反射就是前面说到得Lambertian reflect。
镜面反射顾名思义。它是视线和反射的光线向量的点积，当这个点积为1时，摄像头捕捉到的光线最强。这个点积之后经过n次方运算，n代表表面的光亮度。最后再与光线和材质的specular color相乘。
![](http://gtms03.alicdn.com/tps/i3/T1FRxNFtdbXXX5Ovs7-800-567.png)

### ESSL-OpenGL ES Shading Language
ESSL是我们用于构造渲染器的语言。它和C/C++很相似，不同的是它有一些内建类型和函数使我们更易于操作向量和矩阵。
>本节是官方GLSL ES规范的总结，它是GLSL（the shading language for OpenGL）的子集。
>你可以在这找到规范[点这里](http://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf)

### Storage qualifier
变量声明需要有一个storage qualifier进行标识：  

+ **attribute**: 该值用于连接vertex shader和WebGL程序。它仅在vertex shader中使用。
+ **uniform**: 该值用于连接shader和WebGL程序，在渲染中值不会改变。它可以在vertex和fragment shader中同时被使用。如果在两个shader中都使用，变量需要同时被声明。
+ **varying**: 该值用于连接vertex shader和fragment shader，传递描影数据。它会在两个shader中同时被用到。
+ **const**: 常量，可以在ESSL的任何地方被用到。

### Types
ESSL提供了几个基本类型：  

+ void
+ bool
+ int
+ float
+ vec2: 二元浮点向量
+ vec3: 三元浮点向量
+ vec4: 四元浮点向量
+ bvec2: 二元布尔向量
+ bvec3: 三元布尔向量
+ bvec4: 四元布尔向量
+ ivec2: 二元整型向量
+ ivec3: 三元整型向量
+ ivec4: 四元整型向量
+ mat2: 2*2浮点矩阵
+ mat3: 3*3浮点矩阵
+ mat4: 4*4浮点矩阵
+ sampler2D: 2D纹理处理器
+ samplerCube: 三维纹理处理器

最后我们在ESSL中声明的变量是这样的：varying vec4 vFinalColor。它表明vFinalColor是一个varying类型的四元浮点向量。

### Operators and functions
ESSL也提供了许多用于向量和矩阵的操作，如+, -, *, /, dot, cross, matrixCompMult, normalize, reflect等等。

### Lambertian reflection model的实现
#### vertex shader

	<script id="shader-vs" type="x-shader/x-vertex">
			
			attribute vec3 aVertexPosition;
			attribute vec3 aVertexNormal;
			//这是三个4*4矩阵，用于在镜头转动时计算vertices的位置和法线
  			
			uniform mat4 uMVMatrix;
			uniform mat4 uPMatrix;
			uniform mat4 uNMatrix;

			uniform vec3 uLightDirection;
			uniform vec4 uLightDiffuse;
			uniform vec4 uMaterialDiffuse;
			
			varying vec4 vFinalColor;
			
			void main(void) {
				vec3 N = normalize(vec3(uNMatrix * vec4(aVertexNormal, 1.0)));
				vec3 L = normalize(uLightDirection);
				float lambertTerm = dot(N, -L);
				vFinalColor = uMaterialDiffuse * uLightDiffuse * lambertTerm;
				vFinalColor.a = 1.0;
				gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
			}
	</script>
	
>后面会详细讲解含义。对照前面讲的model建立过程可以更好地理解。
        
#### fragment shader
fragment shader非常简单。最开始的三行用于定义shader的精确度。

	<script id="shader-fs" type="x-shader/x-fragment">
		#ifdef GL_SL
		precision highp float;
		#endif
		
		// 从vertex shader中传来
		varying vec4 vFinalColor;
		
		void main(void) {
			gl_FragColor = vFinalColor;		}
	</script>
	
### Writing ESSL programs
前面我们谈到了两种描影模型两种光照模型。接下来我们会模拟这些情景。  
[Goraud Shading + Lambertian reflection model](https://github.com/fem-d/webGL/blob/master/chapter3/ex3-1.html)
![](http://gtms04.alicdn.com/tps/i4/T1Fg89FpdXXXaK6EzR-481-401.png)

[Moving Light](https://github.com/fem-d/webGL/blob/master/chapter3/ex3-2.html)
![](http://gtms03.alicdn.com/tps/i3/T1m5t7FpldXXaDY2cQ-546-134.png)

[Goraud Shading + Phong reflection model](https://github.com/fem-d/webGL/blob/master/chapter3/ex3-3.html)
![](http://gtms04.alicdn.com/tps/i4/T1Sz1IFChXXXXXZe.v-960-804.png)

### Phong shading
在从Goraud shading到Phong shading前，让我们先更深入的了解下。前面说到Phone shading是在每个fragment中计算最终颜色。这意味着ambient，diffuse以及specular的计算都是在fragment shader中而不是vertex shader中。这需要更多的计算量，但我们能得到更真实地场景。
因此，我们在vertex shader中需要做得是创建更多的varying以便我们能在fragment shader中使用。
正如在每个vertex上做的一样，我们需要得到每个像素的法线以便可以计算lambert值。我们需要做的仅仅是得到从vertex shader中传来的vertex的法线然后得到描影值。
![](http://gtms04.alicdn.com/tps/i4/T1uUGFFtdcXXbuA2Hd-908-416.png)

下面让我们看看Phong shading中vertex shader的代码
	
	attribute vec3 aVertexPosition;
	attribute vec3 aVertexNormal;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform mat4 uNMatrix;
	varying vec3 vNormal;
	varying vec3 vEyeVec;
	
	void main(void) {
		vec4 vertex = uMVMatrix * vec4(aVertexPosition, 1.0);
		vNormal = vec3(uNMatrix * vec4(aVertexNormal, 1.0));
		vEyeVec = -vec3(vertex.xyz);
		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);	}
	
接着是fragment shader中的代码
	
	uniform float uShininess;
	uniform vec3 uLightDirection;
	uniform vec4 uLightAmbient;
	uniform vec4 uLightDiffuse;
	uniform vec4 uLightSpecular;
	uniform vec4 uMaterialAmbient;
	uniform vec4 uMaterialDiffuse;
	uniform vec4 uMaterialSpecular;
	varying vec3 vNormal;
	varying vec3 vEyeVec;
	
	void main(void) {
		vec3 L = normalize(uLightDirection);
		vec3 N = normalize(vNormal);
		float lambertTerm = dot(N, -L);
		
		vec4 Ia = uLightAmbient * uMaterialAmbient;
		vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);
		vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);
		
		if (lambertTerm > 0.0) {
			Id = uLightDiffuse * uMaterialDiffuse * lamberTerm;
			vec3 E = normalize(vEyeVec);
			vec3 R = reflect(L, N);
			float specular = pow(max(dot(R, E), 0.0), uShininess);			Is = uLightSpecular * uMaterialSpecular * specular;
		}
		vec4 finalColor = Ia + Id + Is;
		finalColor.a = 1.0;
		
		gl_FragColor = finalColor;	}
	
[Phong shading with Phong lighting](https://github.com/fem-d/webGL/blob/master/chapter3/ex3-4.html)
![](http://gtms03.alicdn.com/tps/i3/T1WMOJFuXXXXcYpY7A-962-800.png)

### 回到WebGL
现在让我们来好好分析下JavaScript代码，了解下JavaScript代码是如何和ESSL关联上的。
首先，我们需要看看如何使用WebGL上下文创建program；其次，我们需要知道如何初始化attributes和uniforms。

#### Creating a program
让我们一步步查看下initProgram：
> 以下代码只讲解关键的部分
	
	var prg;
	function initProgram() {
		// 我们首先使用了uitls.getShader(WebGLContext, DOMID)来获取shader
		var vertexShader = utils.getShader(gl, "shader-vs");
		var fragmentShader = utils.getShader(gl, "shader-fs");


为了理解utils.getShader的作用，我们需要看一下它的主要代码：

	var shader;
	// 创建shader
	if (script.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);	} else if (script.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEC_SHADER);	} else {
		return null;	}
	
	// 关联ESSL和shader
	gl.shaderSource(shader, str);
	// 编译
	gl.complieShader(shader);
	
回到initProgram中，我们继续创建program：

	prg = gl.createProgram();
	gl.attachShader(prg, vertexShader);
	gl.attachShader(prg, fragmentShader);
	gl.linkProgram(prg);
	if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
		alert("Could not initialize shaders");		return;
	}
	gl.useProgram(prg);
	
最后，我们需要创建JavaScript对象和program attributes和uniforms之间的关联。这很容易做到：

	prg.aVertexPosition = gl.getAttribLocation(prg, "aVertexPosition");
	prg.aVertexNormal = gl.getAttribLocation(prg, "aVertexNormal");
	prg.uPMatrix = gl.getUniformLocation(prg, "uPMatrix");
	prg.uMVMatrix = gl.getUniformLocation(prg, "uMVMatrix");
	prg.uNMatrix = gl.getUniformLocation(prg, "uNMatrix");
	
	prg.uLightDirection = gl.getUniformLocation(prg, "uLightDirection");
	prg.uLightAmbient = gl.getUniformLocation(prg, "uLightAmbient");
	prg.uLightDiffuse = gl.getUniformLocation(prg, "uLightDiffuse");
	prg.uMaterialDiffuse = gl.getUniformLocation(prg, "uMaterialDiffuse");
	
#### Initializing attributes and uniforms
一旦我们创建了program，我们就可以初始化webGL属性了，以initLights函数为例：

	function initLights() {
		gl.uniform3fv(prg.uLightDirection, [0.0, 0,0, -1.0]);
		gl.uniform4fv(prg.uLightAmbient, [0.01, 0.01, 0.01, 1.0]);
		gl.uniform4fv(prg.uLightDiffuse, [0.5, 0.5, 0.5, 1.0]);
		gl.uniform4fv(prg.uMaterialDiffuse, [0.1, 0.5, 0.8, 1.0]);	}

完整的API如下：
![](http://gtms03.alicdn.com/tps/i3/T1SIGKFyReXXX0w1_4-623-169.png)

#### 再来一个示例
我们下面创造这样一个场景，前方有一面墙，包括了A，B，C三个区域。想象下我们正拿着电筒面对着B，斜着的A、C区域会比B区域更暗，如下图所示：
![](http://gtms02.alicdn.com/tps/i2/T1lsGPFBFXXXbaoxHP-477-329.png)
下面我们总结下我们需要做的事：
1. 编写ESSL。编写vertex和fragment shader，我们前面已经讲到如何写ESSL了。在这里我们使用Goraud shading+Lambertian reflection model。
2. 编写initProgram函数。取到对应的attributes和uniforms的引用。
3. 编写initBuffsers函数。在这里我们需要创建几何位置：可以使用8个点组成6个三角形。在这个函数中我们包含了一个额外的buffer，它包含了法线信息。
	
	var normals = utils.calculateNormals(vertices, indices);
	var normalsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
4. 编写initLights函数。
5. 我们在drawScene中需要注意的是将法线VBO绑定起来。

	 gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	 gl.vertexAttribPointer(prg.aVertexNormal, 3, gl.FLOAT, false, 0, 0);

[我是一面墙](https://github.com/fem-d/webGL/blob/master/chapter3/ex3-4.html)
![](http://gtms01.alicdn.com/tps/i1/T1jhmKFw0eXXbZAoDR-481-403.png)

### 更多光源的知识：positional lights
在我们结束本章之前，让我们再来讨论下光源的问题。前面我们讲的光都是无限远的，这使得我们可以把光线当做都是平行光，比如太阳光，这也被叫做directional lights。现在考虑把光源点移至场景附近，就如台灯一般，这样的光叫做positional lights，如下图所示:
![](http://gtms02.alicdn.com/tps/i2/T1LDKKFrBeXXaYUhZb-493-249.png)

正如前面例子中出现的，directional lights只需要一个uniform属性*uLightDirection*即可。相反，使用positional lights我们需要知道光源的坐标，为此我们使用*uLightPosition*来表示，由于positional lights不再是平行光了，所以我们还需要使用*vLightRay*来表示每条光线，下面是positional lights的一个例子：

[positional lights（白色的是光源）](https://github.com/fem-d/webGL/blob/master/chapter3/ex3-5.html)
![](http://gtms02.alicdn.com/tps/i2/T1eImPFz8XXXcIVPfM-613-400.png)

最后屌渣天的[Nissan Car](https://github.com/fem-d/webGL/blob/master/chapter3/ex3-6.html)
![](http://gtms01.alicdn.com/tps/i1/T15amNFydbXXaU5.24-486-402.png)

终于第三章结束了……总结一下：
1. 我们学到了如何使用vertex shader和fragment shader来定义光照模型；
2. 学习什么是光源、素材和法线，以及这些元素如何影响场景；
3. 学习了shading和lighting的区别，以及基础的Goraud和Phong光照模型；
4. 学习了一些ESSL的例子

在下章中，我们将学习ESSL的矩阵变换，以及如何3D场景如何投影到viewport上。



















