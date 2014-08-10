# WebGL初级调试篇
____

>本文内容涉及了前四章所讲内容，请读者先阅览前四章的内容，有问题可以随时和我交流。

在书写第四章第一个例子时，发现了这样一个问题，渲染出来的图是这样的：
![](http://gtms03.alicdn.com/tps/i3/T12zm8Fq4bXXXMDbAc-1201-400.png)
但是预期效果应该是：
![](http://gtms02.alicdn.com/tps/i2/T1hva8FuJbXXbBBdvW-1402-400.png)
很明显，圆锥的颜色出现了问题。由于本次使用的是Goraud shading + Lambertian lighting model，因此首先查看是否是光照的问题，使用<code>gl.getUniform(prg, prg.uLightPosition)</code>进行查看，发现光照位置没有问题。那么会是哪儿的问题呢？
让我们来看下vertex shader：

	attribute vec3 aVertexPosition;
	attribute vec3 aVertexNormal;
	attribute vec4 aVertexColor;

	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform mat4 uNMatrix;

	uniform vec3 uLightPosition; 
	uniform vec4 uLightAmbient;  
	uniform vec4 uLightDiffuse;  
	uniform vec4 uMaterialDiffuse; 
	uniform bool uWireframe;
	uniform bool uPerVertexColor;
	varying vec4 vFinalColor;

	void main(void) {
    	if (uWireframe) {
        	if (uPerVertexColor){
            	vFinalColor = aVertexColor;
        	}
        	else{
            	vFinalColor = uMaterialDiffuse;
        	}
    	}
    	else{
        	vec3 N = vec3(uNMatrix * vec4(aVertexNormal, 0.0));  // This is a vector w = 0;
        	vec3 L = normalize(-uLightPosition);                 // Given a light position, use the inverse is the direction (to the center of the world)

        float lambertTerm = dot(N,-L);
        if (lambertTerm <= 0.0) lambertTerm = 0.01;
        	vec4 Ia = uLightAmbient;
        	vec4 Id = uMaterialDiffuse * uLightDiffuse * lambertTerm;
        	vFinalColor = Ia + Id;
        	vFinalColor.a = 1.0; //alpha channel
    	}
    
    	//Transformed vertex position
    	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition,1.0); // vertex w=1
	}
	
圆锥使用的是非线框，所以直接进入else区块。看来应该是vFinalColor有问题，让我们实验下，将<code>vFinalColor = Ia + Id</code>替换为<code>vFinalColor = Ia</code>，发现正常。再替换为<code>vFinalColor = Id</code>，发现问题：
![](http://gtms01.alicdn.com/tps/i1/T1e316FtBdXXXNfx.Z-901-401.jpg)
怎么成了黑色了！再看代码<code>vec4 Id = uMateriaDiffuse * uLightDiffuse * lambertTerm;</code>，分别单独用uMaterialDiffuse和uLightDiffuse进行测试，发现没问题，那就是lambertTerm的问题了。再看代码<code>float lambertTerm = dot(N, -L);</code>，前面已经证实过uLihgtPosition是正确的，因此肯定是N的问题。代码有<code>vec3 N = vec3(uNMatrix * vec4(aVertexNormal, 0.0));</code>。对于这两个值uNMatrix和aVertexNormal，前者可以简单的打印出来查看，但是后者是WebGLBuffer对象，我们怎么查看呢？
很简单，使用工具[WebGL-inspector](https://chrome.google.com/webstore/detail/webgl-inspector/ogkcjmbhnfmlnielkjhedpcjomeaghda)。通过插件我们可以看到：
![](http://gtms03.alicdn.com/tps/i3/T153W7FyXcXXamUTr3-697-262.png)
这明显有问题，检查相关代码，发现：
![](http://gtms02.alicdn.com/tps/i2/T1Mpq8FCNbXXaTCir6-1936-150.png)
嗯，继续深入，原来是calculateNormals方法有问题！至此终于解决这bug了。

>WebGL中一点小小的失误就能导致debug很久，所以一定要小心啊。当然，大家如果有更好的调试方法也可以介绍下~