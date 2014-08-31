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
























